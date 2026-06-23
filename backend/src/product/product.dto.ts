import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsArray,
  IsInt,
  IsObject,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Sepatu Lari' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String], description: 'Additional product image URLs (carousel)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Discount percentage 0-90' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  discount?: number;

  @ApiPropertyOptional({
    description: 'Free-form spec key/value map, e.g. {"Berat":"500g","Warna":"Hitam"}',
    example: { Berat: '500g', Warna: 'Hitam' },
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, string>;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  specifications?: Record<string, string>;
}
