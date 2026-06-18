import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TakeJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
