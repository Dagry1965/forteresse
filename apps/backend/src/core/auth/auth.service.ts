import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import type { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type JwtExpiration = Extract<
  NonNullable<SignOptions['expiresIn']>,
  string
>;

type RefreshPayload = {
  sub: string;
  workspaceId: string;
  type: 'refresh';
  jti: string;
};

export type AuthRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  private async logAuthEvent(
    action: string,
    entityId: string,
    context: AuthRequestContext = {},
    options: {
      workspaceId?: string | null;
      userId?: string | null;
      success?: boolean;
      errorMessage?: string | null;
      newData?: unknown;
    } = {},
  ): Promise<void> {
    await this.auditService.log({
      action,
      entity: 'Authentication',
      entityId,
      workspaceId: options.workspaceId ?? null,
      userId: options.userId ?? null,
      success: options.success ?? true,
      errorMessage: options.errorMessage ?? null,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
      newData: options.newData,
    });
  }

  private getAccessExpiration(): JwtExpiration {
    return (process.env.JWT_ACCESS_EXPIRES_IN?.trim() || '15m') as JwtExpiration;
  }

  private getRefreshExpiration(): JwtExpiration {
    return (process.env.JWT_REFRESH_EXPIRES_IN?.trim() || '30d') as JwtExpiration;
  }

  private durationToMilliseconds(value: string): number {
    const match = value.trim().match(/^(\d+)(s|m|h|d)$/);

    if (!match) {
      throw new Error(
        'JWT_REFRESH_EXPIRES_IN doit utiliser un format comme 30d, 12h, 15m ou 60s.',
      );
    }

    const amount = Number(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * multipliers[unit];
  }

  private async createTokenPair(
    userId: string,
    email: string,
    workspaceId: string,
    role: string,
  ) {
    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        workspaceId,
        type: 'access',
      },
      {
        expiresIn: this.getAccessExpiration(),
      },
    );

    const refreshExpiration = this.getRefreshExpiration();
    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        workspaceId,
        type: 'refresh',
        jti: randomUUID(),
      },
      {
        expiresIn: refreshExpiration,
      },
    );

    const tokenHash = await argon2.hash(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.durationToMilliseconds(refreshExpiration),
    );

    await this.prisma.refreshToken.create({
      data: {
        token_hash: tokenHash,
        expires_at: expiresAt,
        workspace_id: workspaceId,
        user_id: userId,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: this.getAccessExpiration(),
    };
  }

  async login(
    loginDto: { email: string; password: string },
    context: AuthRequestContext = {},
  ) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        workspaceMembers: {
          where: {
            deleted_at: null,
          },
          include: {
            workspace: true,
          },
          orderBy: {
            created_at: 'asc',
          },
        },
      },
    });

    if (!user || !user.password || user.deleted_at) {
      await this.logAuthEvent(
        'LOGIN_FAILED',
        email,
        context,
        {
          success: false,
          errorMessage: 'Identifiants incorrects',
          newData: { email },
        },
      );

      throw new UnauthorizedException('Identifiants incorrects');
    }

    const isPasswordValid = await argon2.verify(
      user.password,
      loginDto.password,
    );

    if (!isPasswordValid) {
      await this.logAuthEvent(
        'LOGIN_FAILED',
        user.id,
        context,
        {
          workspaceId: user.workspace_id,
          userId: user.id,
          success: false,
          errorMessage: 'Identifiants incorrects',
          newData: { email: user.email },
        },
      );

      throw new UnauthorizedException('Identifiants incorrects');
    }

    if (user.workspaceMembers.length === 0) {
      throw new ForbiddenException(
        "Acc\u00e8s refus\u00e9 : vous n'\u00eates rattach\u00e9 \u00e0 aucun garage.",
      );
    }

    const defaultMembership = user.workspaceMembers[0];

    await this.prisma.refreshToken.deleteMany({
      where: {
        user_id: user.id,
        expires_at: {
          lte: new Date(),
        },
      },
    });

    const tokens = await this.createTokenPair(
      user.id,
      user.email,
      defaultMembership.workspace_id,
      defaultMembership.role,
    );

    await this.logAuthEvent(
      'LOGIN_SUCCESS',
      user.id,
      context,
      {
        workspaceId: defaultMembership.workspace_id,
        userId: user.id,
        newData: {
          email: user.email,
          role: defaultMembership.role,
        },
      },
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? '',
        role: defaultMembership.role,
        workspaceId: defaultMembership.workspace_id,
        memberships: user.workspaceMembers.map((membership) => ({
          id: membership.id,
          role: membership.role,
          workspaceId: membership.workspace_id,
          workspace: membership.workspace,
        })),
      },
    };
  }

  async refresh(
    refreshToken: string,
    context: AuthRequestContext = {},
  ) {
    let payload: RefreshPayload;

    try {
      payload = this.jwtService.verify<RefreshPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException(
        'Jeton de rafra\u00eechissement invalide ou expir\u00e9.',
      );
    }

    if (
      payload.type !== 'refresh'
      || !payload.sub
      || !payload.workspaceId
      || !payload.jti
    ) {
      throw new UnauthorizedException(
        'Jeton de rafra\u00eechissement invalide.',
      );
    }

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        user_id: payload.sub,
        workspace_id: payload.workspaceId,
        expires_at: {
          gt: new Date(),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    let currentToken:
      | (typeof storedTokens)[number]
      | undefined;

    for (const storedToken of storedTokens) {
      if (await argon2.verify(storedToken.token_hash, refreshToken)) {
        currentToken = storedToken;
        break;
      }
    }

    if (!currentToken) {
      throw new UnauthorizedException(
        'Jeton de rafra\u00eechissement r\u00e9voqu\u00e9.',
      );
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        user_id: payload.sub,
        workspace_id: payload.workspaceId,
        deleted_at: null,
        user: {
          deleted_at: null,
        },
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      await this.prisma.refreshToken.delete({
        where: { id: currentToken.id },
      });

      throw new ForbiddenException(
        'Acc\u00e8s au garage r\u00e9voqu\u00e9.',
      );
    }

    await this.prisma.refreshToken.delete({
      where: { id: currentToken.id },
    });

    const tokens = await this.createTokenPair(
      membership.user.id,
      membership.user.email,
      membership.workspace_id,
      membership.role,
    );

    await this.logAuthEvent(
      'REFRESH_SUCCESS',
      membership.user.id,
      context,
      {
        workspaceId: membership.workspace_id,
        userId: membership.user.id,
        newData: {
          email: membership.user.email,
          role: membership.role,
        },
      },
    );

    return tokens;
  }

  async logout(
    refreshToken: string,
    context: AuthRequestContext = {},
  ) {
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        expires_at: {
          gt: new Date(),
        },
      },
    });

    let revokedToken:
      | (typeof storedTokens)[number]
      | undefined;

    for (const storedToken of storedTokens) {
      if (await argon2.verify(storedToken.token_hash, refreshToken)) {
        await this.prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });

        revokedToken = storedToken;
        break;
      }
    }

    if (revokedToken) {
      await this.logAuthEvent(
        'LOGOUT_SUCCESS',
        revokedToken.user_id,
        context,
        {
          workspaceId: revokedToken.workspace_id,
          userId: revokedToken.user_id,
        },
      );
    }

    return {
      success: true,
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (
      user
      && !user.deleted_at
      && await argon2.verify(user.password, password)
    ) {
      const { password: _, ...result } = user;
      return result;
    }

    return null;
  }
}
