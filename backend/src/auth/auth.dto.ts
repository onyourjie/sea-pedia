import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'johndoe', minLength: 1 })
  @IsString()
  username: string;

  @ApiProperty({ example: 'john@example.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
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
