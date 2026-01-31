import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import type { CreateFeedbackDto, FeedbackStatsDto } from './dto/feedback.dto'
import { FeedbackService } from './feedback.service'

@Controller('api/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /**
   * 提交反馈
   * POST /api/feedback
   */
  @Post()
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto)
  }

  /**
   * 获取消息的反馈
   * GET /api/feedback?messageId=xxx
   */
  @Get()
  getByMessageId(@Query('messageId') messageId: string) {
    return this.feedbackService.getByMessageId(messageId)
  }

  /**
   * 获取反馈统计
   * GET /api/feedback/stats
   */
  @Get('stats')
  getStats(@Query() query: FeedbackStatsDto) {
    return this.feedbackService.getStats(query)
  }

  /**
   * 获取最近的反馈列表
   * GET /api/feedback/recent
   */
  @Get('recent')
  getRecent(@Query('limit') limit?: string) {
    return this.feedbackService.getRecent(limit ? parseInt(limit, 10) : 20)
  }
}
