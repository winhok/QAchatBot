import { PrismaService } from '@/infrastructure/database/prisma.service'
import { Injectable, Logger } from '@nestjs/common'
import { CreateFeedbackDto, FeedbackStatsDto } from './dto/feedback.dto'

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建反馈
   */
  async create(dto: CreateFeedbackDto) {
    this.logger.log({
      event: 'feedback_created',
      messageId: dto.messageId,
      sessionId: dto.sessionId,
      score: dto.score,
    })

    const feedback = await this.prisma.feedback.create({
      data: {
        messageId: dto.messageId,
        sessionId: dto.sessionId,
        score: dto.score,
        comment: dto.comment,
      },
    })

    return { success: true, feedback }
  }

  /**
   * 获取消息的反馈
   */
  async getByMessageId(messageId: string) {
    const feedback = await this.prisma.feedback.findFirst({
      where: { messageId },
      orderBy: { createdAt: 'desc' },
    })

    return { feedback }
  }

  /**
   * 获取反馈统计
   */
  async getStats(query: FeedbackStatsDto) {
    const where: Record<string, unknown> = {}

    if (query.sessionId) {
      where.sessionId = query.sessionId
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      }
    }

    const [total, positive, negative] = await Promise.all([
      this.prisma.feedback.count({ where }),
      this.prisma.feedback.count({ where: { ...where, score: 1 } }),
      this.prisma.feedback.count({ where: { ...where, score: -1 } }),
    ])

    const positiveRate = total > 0 ? (positive / total) * 100 : 0

    return {
      total,
      positive,
      negative,
      positiveRate: Math.round(positiveRate * 10) / 10,
    }
  }

  /**
   * 获取最近的反馈列表
   */
  async getRecent(limit: number = 20) {
    return this.prisma.feedback.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        session: {
          select: { name: true },
        },
      },
    })
  }
}
