import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly appService: AppService) {}

  @Get('public')
  getPublicStats() {
    return this.appService.getPublicStats();
  }
}
