import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  private readonly jwtSecret = process.env.JWT_SECRET || 'changeme';
  private readonly accessExpiry = '15m';
  private readonly refreshTtlMs = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  private signAccessToken(payload: object) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.accessExpiry });
  }

  private createRawRefreshToken(): string {
    return randomBytes(48).toString('hex');
  }

  async validateUserByEmail(email: string, password: string) {
    // On force la sélection du champ role
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return null;
    const ok = await argon2.verify(user.password, password);
    return ok ? user : null;
  }

  async login(email: string, password: string, workspaceId?: string) {
    const user = await this.validateUserByEmail(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // ✅ DIAGNOSTIC LOG : Tu verras ça dans ton terminal NestJS
    const realRole = (user as any).role || 'user';
    this.logger.log(`LOGIN : Utilisateur ${user.email} identifié avec le rôle : ${realRole}`);

    const accessToken = this.signAccessToken({
      sub: user.id,
      workspace: workspaceId || (user as any).workspaceId || "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971",
      role: realRole, // Utilise la variable extraite juste au dessus
    });

    const rawRefresh = this.createRawRefreshToken();
    const hash = await argon2.hash(rawRefresh);
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);

    await this.prisma.refreshToken.create({
      data: { tokenHash: hash, userId: user.id, expiresAt },
    });

    return { accessToken, refreshToken: rawRefresh, userId: user.id };
  }

  async refresh(rawRefresh: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revoked: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    for (const t of tokens) {
      try {
        const ok = await argon2.verify(t.tokenHash, rawRefresh);
        if (!ok) continue;

        if (t.expiresAt && t.expiresAt.getTime() < Date.now()) {
          await this.prisma.refreshToken.update({ where: { id: t.id }, data: { revoked: true } });
          throw new UnauthorizedException('Refresh expired');
        }

        const user = await this.prisma.user.findUnique({ where: { id: t.userId } });
        if (!user) throw new UnauthorizedException('User not found');

        await this.prisma.refreshToken.update({ where: { id: t.id }, data: { revoked: true } });

        const accessToken = this.signAccessToken({
          sub: user.id,
          workspace: (user as any).workspaceId || "a1ae9e3a-2ff0-49f3-8e4d-f504f1332971",
          role: (user as any).role || 'user',
        });

        const newRaw = this.createRawRefreshToken();
        const newHash = await argon2.hash(newRaw);
        const expiresAt = new Date(Date.now() + this.refreshTtlMs);
        await this.prisma.refreshToken.create({ data: { tokenHash: newHash, userId: user.id, expiresAt } });

        return { accessToken, refreshToken: newRaw, userId: user.id };
      } catch (e) {
        continue;
      }
    }
    throw new UnauthorizedException('Invalid refresh token');
  }

  async logout(rawRefresh: string) {
    if (!rawRefresh) return false;
    const tokens = await this.prisma.refreshToken.findMany({ where: { revoked: false } });
    for (const t of tokens) {
      try {
        const ok = await argon2.verify(t.tokenHash, rawRefresh);
        if (ok) {
          await this.prisma.refreshToken.update({ where: { id: t.id }, data: { revoked: true } });
          return true;
        }
      } catch (e) { continue; }
    }
    return false;
  }
}
