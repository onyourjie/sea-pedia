import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, SelectRoleDto } from './auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiEndpoint } from '../common/swagger/api-docs.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiEndpoint({
    summary: 'Daftarkan akun baru',
    status: 201,
    successDescription: 'Akun berhasil didaftarkan.',
    responseExample: { message: 'Registered successfully', roles: ['BUYER'] },
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiEndpoint({
    summary: 'Masuk ke akun',
    status: 201,
    successDescription: 'Kredensial valid dan sesi berhasil dibuat.',
    responseExample: {
      requiresRoleSelection: false,
      accessToken: 'eyJhbGciOiJIUzI1NiIs...',
      activeRole: 'BUYER',
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('select-role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiEndpoint({
    summary: 'Pilih role aktif',
    status: 201,
    auth: true,
    successDescription: 'Role aktif dan access token diperbarui.',
    responseExample: {
      accessToken: 'eyJhbGciOiJIUzI1NiIs...',
      activeRole: 'SELLER',
    },
  })
  selectRole(@CurrentUser() user: any, @Body() dto: SelectRoleDto) {
    return this.authService.selectRole(user.id, dto, user.roles);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiEndpoint({
    summary: 'Keluar dari sesi',
    status: 201,
    auth: true,
    successDescription: 'Sesi berhasil dicabut.',
    responseExample: { message: 'Logged out successfully' },
  })
  logout(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.authService.logout(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiEndpoint({
    summary: 'Ambil identitas dari token aktif',
    auth: true,
    successDescription: 'Payload pengguna dari access token aktif.',
    responseExample: {
      id: 'clx1234567890',
      activeRole: 'BUYER',
      roles: ['BUYER'],
    },
  })
  me(@CurrentUser() user: any) {
    return user;
  }
}
