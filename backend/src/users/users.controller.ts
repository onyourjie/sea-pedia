import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiEndpoint } from '../common/swagger/api-docs.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiEndpoint({
    summary: 'Ambil profil pengguna',
    auth: true,
    successDescription: 'Profil lengkap pengguna yang sedang masuk.',
    responseExample: {
      id: 'clx1234567890',
      username: 'johndoe',
      email: 'john@example.com',
      roles: ['BUYER'],
    },
  })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }
}
