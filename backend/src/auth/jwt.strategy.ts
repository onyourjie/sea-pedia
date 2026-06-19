import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; activeRole: string; roles?: string[]; roleSelection?: boolean }) {
    if (payload.roleSelection) {
      return { id: payload.sub, roles: payload.roles, activeRole: null, roleSelection: true };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: true },
    });
    if (!user) return null;

    // Check that an active session exists (logout invalidates all sessions)
    const session = await this.prisma.session.findFirst({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
    });
    if (!session) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      activeRole: payload.activeRole,
      roles: user.roles.map((r) => r.role),
    };
  }
}
