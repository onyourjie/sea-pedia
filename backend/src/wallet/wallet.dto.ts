import {
  IsNumber,
  Min,
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;
const PHONE_MESSAGE =
  'Nomor HP tidak valid. Gunakan format Indonesia (mis. 08123456789 atau +6281234567890)';

export class TopUpDto {
  @ApiProperty({ example: 100000, minimum: 1000 })
  @IsNumber()
  @Min(1000)
  amount: number;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'Rumah', minLength: 1, maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label: string;

  @ApiProperty({ example: 'Filzah Mufidah', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipientName: string;

  @ApiProperty({
    example: '08123456789',
    description: 'Nomor HP penerima (format Indonesia).',
    pattern: '^(\\+62|62|0)8[1-9][0-9]{6,11}$',
  })
  @IsString()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  recipientPhone: string;

  @ApiProperty({ example: 'Jl. Sudirman No. 1', minLength: 5, maxLength: 200 })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  street: string;

  @ApiProperty({ example: 'Jakarta', minLength: 2, maxLength: 60 })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  city: string;

  @ApiProperty({ example: 'DKI Jakarta', minLength: 2, maxLength: 60 })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  province: string;

  @ApiProperty({ example: '10110', pattern: '^\\d{5}$' })
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Kode pos harus 5 digit angka' })
  postalCode: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Rumah', minLength: 1, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label?: string;

  @ApiPropertyOptional({
    example: 'Filzah Mufidah',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipientName?: string;

  @ApiPropertyOptional({
    example: '08123456789',
    pattern: '^(\\+62|62|0)8[1-9][0-9]{6,11}$',
  })
  @IsOptional()
  @IsString()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  recipientPhone?: string;

  @ApiPropertyOptional({
    example: 'Jl. Sudirman No. 1',
    minLength: 5,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional({ example: 'Jakarta', minLength: 2, maxLength: 60 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  city?: string;

  @ApiPropertyOptional({
    example: 'DKI Jakarta',
    minLength: 2,
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  province?: string;

  @ApiPropertyOptional({ example: '10110', pattern: '^\\d{5}$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Kode pos harus 5 digit angka' })
  postalCode?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
