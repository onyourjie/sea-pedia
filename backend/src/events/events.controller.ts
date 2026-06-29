import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private eventsService: EventsService,
    private prisma: PrismaService,
  ) {}

  @Get('orders')
  @UseGuards(AuthGuard('jwt-query'))
  async streamOrderEvents(@Req() req: Request & { user: any }, @Res() res: Response) {
    const userId = req.user.id;

    // Resolve buyerId from userId
    const buyer = await this.prisma.buyer.findUnique({ where: { userId } });
    if (!buyer) {
      res.status(403).json({ message: 'Buyer profile not found' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send a heartbeat every 30s to keep the connection alive through proxies
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    const stream = this.eventsService.getStream(buyer.id);
    const sub = stream.subscribe({
      next: (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
      error: () => res.end(),
      complete: () => res.end(),
    });

    req.on('close', () => {
      clearInterval(heartbeat);
      sub.unsubscribe();
    });
  }
}
