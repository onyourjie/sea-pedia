import { IsString, IsInt, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductReviewDto {
  @ApiProperty({ description: 'OrderItem ID this review is attached to' })
  @IsString()
  orderItemId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Produk sesuai ekspektasi.' })
  @IsString()
  @MaxLength(2000)
  comment: string;
}
