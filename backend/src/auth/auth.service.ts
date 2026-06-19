import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, SelectRoleDto } from './auth.dto';
import { RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });
    if (existing) throw new ConflictException('Username or email already taken');

    const roles = dto.roles?.length ? dto.roles : [RoleType.BUYER];

    // Admin role cannot be self-assigned
    if (roles.includes(RoleType.ADMIN)) {
      throw new BadRequestException('Cannot self-register as Admin');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        roles: {
          create: roles.map((role) => ({ role })),
        },
      },
      include: { roles: true },
    });

    // Auto-create Buyer profile if BUYER role
    if (roles.includes(RoleType.BUYER)) {
      const buyer = await this.prisma.buyer.create({ data: { userId: user.id } });
      await this.prisma.wallet.create({ data: { buyerId: buyer.id } });
    }

    // Auto-create Driver profile if DRIVER role
    if (roles.includes(RoleType.DRIVER)) {
      await this.prisma.driver.create({ data: { userId: user.id } });
    }

    return { message: 'Registered successfully', roles: user.roles.map((r) => r.role) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { roles: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const userRoles = user.roles.map((r) => r.role);

    // If only one role, auto-select it and create session
    if (userRoles.length === 1) {
      const token = this.signToken(user.id, userRoles[0]);
      const expiresAt = this.getExpiresAt();
      await this.prisma.session.create({
        data: { userId: user.id, activeRole: userRoles[0], expiresAt },
      });
      return {
        accessToken: token,
        activeRole: userRoles[0],
        roles: userRoles,
        requiresRoleSelection: false,
      };
    }

    // Multiple roles: return a partial token for role selection
    const selectionToken = this.jwt.sign(
      { sub: user.id, roles: userRoles, roleSelection: true },
      { expiresIn: '10m' },
    );
    return {
      selectionToken,
      roles: userRoles,
      requiresRoleSelection: true,
    };
  }

  async selectRole(userId: string, dto: SelectRoleDto, currentRoles: RoleType[]) {
    if (!currentRoles.includes(dto.role)) {
      throw new BadRequestException('You do not own this role');
    }
    const token = this.signToken(userId, dto.role);
    const expiresAt = this.getExpiresAt();
    await this.prisma.session.create({
      data: { userId, activeRole: dto.role, expiresAt },
    });
    return { accessToken: token, activeRole: dto.role };
  }

  async logout(token: string) {
    try {
      const payload = this.jwt.verify(token) as { sub: string };
      await this.prisma.session.deleteMany({ where: { userId: payload.sub } });
    } catch {
      // Token already invalid, nothing to do
    }
    return { message: 'Logged out successfully' };
  }

  async cleanExpiredSessions() {
    await this.prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }

  private getExpiresAt(): Date {
    const raw = this.config.get<string>('JWT_EXPIRES_IN', '7d');
    const days = parseInt(raw) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }

  private signToken(userId: string, activeRole: RoleType): string {
    return this.jwt.sign({ sub: userId, activeRole });
  }
}
