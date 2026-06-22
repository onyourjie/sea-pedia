import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

class CreateTopUpDto {
  @ApiProperty({ example: 100_000 })
  @IsInt()
  @Min(10_000)
  amount: number;
}

@ApiTags('payment')
@Controller()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly config: ConfigService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.BUYER)
  @Post('wallet/topup/xendit')
  async createTopUpInvoice(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTopUpDto,
    @Req() req: { headers: Record<string, string | undefined> },
  ) {
    const frontendBase =
      (req.headers['origin'] as string | undefined) ??
      this.config.get<string>('FRONTEND_BASE_URL', 'http://localhost:3000');
    return this.paymentService.createTopUpInvoice(user.id, dto.amount, frontendBase);
  }

  // Public webhook — no JWT guard. Authenticated via x-callback-token header.
  // Throttle wide open since Xendit retries up to 6x and we want all retries to land.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('webhooks/xendit')
  @HttpCode(HttpStatus.OK)
  async xenditWebhook(
    @Headers('x-callback-token') token: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    if (!this.paymentService.verifyWebhookToken(token)) {
      throw new UnauthorizedException('Invalid webhook token');
    }
    return this.paymentService.handleInvoiceCallback(payload);
  }
}
