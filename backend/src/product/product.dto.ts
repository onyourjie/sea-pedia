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
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PRODUCT_CATEGORIES = [
  'seafood',
  'pancing',
  'kapal',
  'suku-cadang',
  'navigasi',
  'keselamatan',
  'jasa-selam',
] as const;

export class CreateProductDto {
  @ApiProperty({ example: 'Sepatu Lari', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 150000, minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50, minimum: 0 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    description: 'Kategori produk',
    enum: PRODUCT_CATEGORIES,
  })
  @IsOptional()
  @IsIn(PRODUCT_CATEGORIES)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Additional product image URLs (carousel)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({
    description: 'Discount percentage 0-90',
    minimum: 0,
    maximum: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  discount?: number;

  @ApiPropertyOptional({
    description:
      'Free-form spec key/value map, e.g. {"Berat":"500g","Warna":"Hitam"}',
    example: { Berat: '500g', Warna: 'Hitam' },
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, string>;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ enum: PRODUCT_CATEGORIES })
  @IsOptional()
  @IsIn(PRODUCT_CATEGORIES)
  category?: string;

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

  @ApiPropertyOptional({ minimum: 0, maximum: 90 })
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
