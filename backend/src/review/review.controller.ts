import { Controller, Get, Post, Body, Query, UseGuards, Optional } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Get()
  list(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reviewService.list(+page, +limit);
  }

  @Post()
  create(@Body() dto: CreateReviewDto, @CurrentUser() user?: any) {
    return this.reviewService.create(dto, user?.id);
  }
}
