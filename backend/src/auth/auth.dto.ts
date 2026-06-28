import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';

const STRONG_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export class RegisterDto {
  @ApiProperty({ example: 'johndoe', minLength: 1 })
  @IsString()
  username: string;

  @ApiProperty({ example: 'john@example.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password1!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(STRONG_PASSWORD, {
    message:
      'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character',
  })
  password: string;

  @ApiPropertyOptional({ enum: RoleType, isArray: true })
  @IsOptional()
  @IsEnum(RoleType, { each: true })
  roles?: RoleType[];
}

export class LoginDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'Username akun yang terdaftar.',
  })
  @IsString()
  username: string;

  @ApiProperty({ example: 'password123', format: 'password' })
  @IsString()
  password: string;
}

export class SelectRoleDto {
  @ApiProperty({ enum: RoleType })
  @IsEnum(RoleType)
  role: RoleType;
}
