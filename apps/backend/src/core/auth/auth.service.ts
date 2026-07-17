import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: any) {
    const { email, password } = loginDto;

    // 1. Charger l'utilisateur + ses memberships
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    // 2. Vérification identité
    if (!user || !user.password) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // 🔥 TEST TEMPORAIRE : bypass du mot de passe
    const isPasswordValid = true;
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // 3. Vérification des accès Workspace
    if (!user.workspaceMembers || user.workspaceMembers.length === 0) {
      throw new ForbiddenException("Accès refusé : vous n'êtes rattaché à aucun garage.");
    }

    const defaultMembership = user.workspaceMembers[0];

    // 4. Payload JWT (🔥 rôle pris depuis WorkspaceMember)
    const payload = {
      sub: user.id,
      email: user.email,
      role: defaultMembership.role ?? 'user',
      workspaceId: defaultMembership.workspace_id,
    };

    // 5. Retour API aligné avec le front (🔥 aucun undefined)
    const response = {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? '',
        role: defaultMembership.role ?? 'user',
        memberships: user.workspaceMembers.map((m) => ({
          id: m.id,
          role: m.role ?? 'user',
          workspaceId: m.workspace_id,
          workspace: m.workspace,
        })),
      },
    };

    console.log(">>> PAYLOAD RENVOYÉ =", response);

    return response;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await argon2.verify(user.password, pass))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
