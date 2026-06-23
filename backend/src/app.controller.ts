import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiEndpoint } from './common/swagger/api-docs.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiEndpoint({
    summary: 'Cek status API',
    successDescription: 'API aktif.',
    responseExample: 'Hello World!',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly appService: AppService) {}

  @Get('public')
  @ApiEndpoint({
    summary: 'Ambil statistik publik marketplace',
    successDescription: 'Ringkasan jumlah toko, produk, dan pengguna.',
    responseExample: { stores: 24, products: 320, users: 1200 },
  })
  getPublicStats() {
    return this.appService.getPublicStats();
  }
}
