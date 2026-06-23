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
import {
  ApiBody,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';
import { IsInt, Min } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import {
  ApiEndpoint,
  ApiWebhookTokenHeader,
} from '../common/swagger/api-docs.decorator';

class CreateTopUpDto {
  @ApiProperty({ example: 100_000, minimum: 10_000 })
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.BUYER)
  @Post('wallet/topup/xendit')
  @ApiEndpoint({
    summary: 'Buat invoice top up Xendit',
    status: 201,
    auth: true,
    roles: ['BUYER'],
    successDescription: 'Invoice Xendit berhasil dibuat.',
    responseExample: {
      invoiceUrl: 'https://checkout.xendit.co/web/example',
      externalId: 'wallet-topup-clx1234567890',
      amount: 100000,
    },
  })
  async createTopUpInvoice(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTopUpDto,
    @Req() req: { headers: Record<string, string | undefined> },
  ) {
    const frontendBase =
      req.headers['origin'] ??
      this.config.get<string>('FRONTEND_BASE_URL', 'http://localhost:3000');
    return this.paymentService.createTopUpInvoice(
      user.id,
      dto.amount,
      frontendBase,
    );
  }

  // Public webhook — no JWT guard. Authenticated via x-callback-token header.
  // Throttle wide open since Xendit retries up to 6x and we want all retries to land.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('webhooks/xendit')
  @HttpCode(HttpStatus.OK)
  @ApiWebhookTokenHeader()
  @ApiUnauthorizedResponse({
    description: 'Header x-callback-token tidak valid.',
    schema: {
      example: {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid webhook token',
      },
    },
  })
  @ApiBody({
    description: 'Payload callback invoice dari Xendit.',
    schema: {
      type: 'object',
      required: ['external_id', 'status'],
      properties: {
        external_id: { type: 'string', example: 'wallet-topup-clx1234567890' },
        status: { type: 'string', example: 'PAID' },
        paid_amount: { type: 'number', example: 100000 },
        payer_email: {
          type: 'string',
          format: 'email',
          example: 'buyer@example.com',
        },
      },
      additionalProperties: true,
    },
  })
  @ApiEndpoint({
    summary: 'Terima callback invoice Xendit',
    successDescription: 'Callback terverifikasi dan diproses secara idempoten.',
    responseExample: { processed: true, status: 'PAID' },
  })
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
