import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from './jwt-secret';

type JwtPayload = {
  sub: string;
  email?: string;
  workspaceId?: string;
  role?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email ?? '',
      workspaceId: payload.workspaceId ?? '',
      role: payload.role ?? '',
    };
  }
}
