import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'Toko Maju', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Pusat hasil laut segar dan berkualitas.' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'Toko Maju', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Pusat hasil laut segar dan berkualitas.' })
  @IsOptional()
  @IsString()
  description?: string;
}
