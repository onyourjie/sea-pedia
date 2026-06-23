import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TakeJobDto {
  @ApiPropertyOptional({
    description: 'Catatan opsional driver saat mengambil pekerjaan.',
    example: 'Siap mengambil pesanan.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
