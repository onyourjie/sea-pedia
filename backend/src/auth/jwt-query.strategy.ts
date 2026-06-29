import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// Separate strategy for SSE endpoints where EventSource cannot send headers.
// Extracts JWT from ?token= query param instead of Authorization header.
@Injectable()
export class JwtQueryStrategy extends PassportStrategy(Strategy, 'jwt-query') {
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
      secretOrKey: config.get<string>('JWT_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: { sub: string; activeRole: string; sid?: string }) {
    if (!payload.sid) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: true },
    });
    if (!user) return null;
    const session = await this.prisma.session.findFirst({
      where: { id: payload.sid, userId: user.id, expiresAt: { gt: new Date() } },
    });
    if (!session) return null;
    return {
      id: user.id,
      username: user.username,
      activeRole: payload.activeRole,
      roles: user.roles.map((r) => r.role),
    };
  }
}
