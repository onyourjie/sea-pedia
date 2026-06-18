import { IsNumber, Min, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopUpDto {
  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(1000)
  amount: number;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'Rumah' })
  @IsString()
  label: string;

  @ApiProperty({ example: 'Jl. Sudirman No. 1' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'DKI Jakarta' })
  @IsString()
  province: string;

  @ApiProperty({ example: '10110' })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
