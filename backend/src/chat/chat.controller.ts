import { Controller, Post, Body, Request, UseGuards, Optional } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './chat.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiEndpoint } from '../common/swagger/api-docs.decorator';

// Optional JWT guard — sets req.user if token valid, does not reject if missing
class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(_err: any, user: any) {
    return user || null;
  }
}

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 2 }, medium: { ttl: 60000, limit: 20 } })
  @ApiEndpoint({
    summary: 'Kirim pesan ke AI chatbot SEAPEDIA',
    successDescription: 'Balasan dari AI assistant.',
    responseExample: { reply: 'Halo! Ada yang bisa saya bantu?' },
  })
  chat(@Body() dto: ChatRequestDto, @Request() req: any) {
    const userId = req.user?.id;
    return this.chatService.chat(dto, userId);
  }
}
