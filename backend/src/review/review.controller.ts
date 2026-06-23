import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './review.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ApiEndpoint,
  ApiPagination,
} from '../common/swagger/api-docs.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Get()
  @ApiPagination()
  @ApiEndpoint({
    summary: 'Daftar ulasan marketplace',
    successDescription: 'Daftar ulasan umum dengan pagination.',
    responseExample: { data: [], total: 0, page: 1, limit: 20 },
  })
  list(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reviewService.list(+page, +limit);
  }

  @Post()
  @ApiEndpoint({
    summary: 'Kirim ulasan marketplace',
    status: 201,
    successDescription:
      'Ulasan umum berhasil dibuat. Identitas pengguna bersifat opsional.',
  })
  create(@Body() dto: CreateReviewDto, @CurrentUser() user?: any) {
    return this.reviewService.create(dto, user?.id);
  }
}
