// TODO: 反馈 API 控制器
// 功能需求：
// 1. POST: 提交用户反馈（点赞/点踩）
// 2. GET: 获取某条消息的反馈状态（可选）
// 3. 存储到数据库或发送到分析服务
// 4. 可选：收集详细的负面反馈原因

import { Controller, Post, Get, Body, Query } from '@nestjs/common'
import { FeedbackService, type FeedbackPayload } from './feedback.service'

@Controller('api/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  submit(@Body() dto: FeedbackPayload) {
    // TODO: 实现反馈提交逻辑
    // - 验证参数
    // - 存储反馈数据
    // - 返回结果
    return this.feedbackService.submit(dto)
  }

  @Get()
  get(@Query('messageId') messageId?: string) {
    // TODO: 获取反馈状态（可选）
    return this.feedbackService.get(messageId)
  }
}
