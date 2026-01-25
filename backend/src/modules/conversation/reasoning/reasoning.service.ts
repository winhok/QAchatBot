import { PrismaService } from '@/infrastructure/database/prisma.service'
import { Injectable } from '@nestjs/common'

interface CreateReasoningParams {
  sessionId: string
  checkpointId: string
  content: string
  duration?: number
}

@Injectable()
export class ReasoningService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建 reasoning 记录
   */
  create(params: CreateReasoningParams) {
    return this.prisma.reasoning.create({
      data: {
        sessionId: params.sessionId,
        checkpointId: params.checkpointId,
        content: params.content,
        duration: params.duration,
      },
    })
  }

  /**
   * 通过 checkpointId 获取 reasoning
   */
  findByCheckpointId(checkpointId: string) {
    return this.prisma.reasoning.findUnique({
      where: { checkpointId },
    })
  }

  /**
   * 获取会话的所有 reasoning 记录
   */
  findBySessionId(sessionId: string) {
    return this.prisma.reasoning.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * 更新 reasoning 内容（用于流式追加）
   */
  async appendContent(checkpointId: string, additionalContent: string) {
    const existing = await this.findByCheckpointId(checkpointId)
    if (!existing) return null

    return this.prisma.reasoning.update({
      where: { checkpointId },
      data: {
        content: existing.content + additionalContent,
      },
    })
  }

  /**
   * 设置思考时长
   */
  setDuration(checkpointId: string, duration: number) {
    return this.prisma.reasoning.update({
      where: { checkpointId },
      data: { duration },
    })
  }

  /**
   * 删除会话的所有 reasoning
   */
  deleteBySessionId(sessionId: string) {
    return this.prisma.reasoning.deleteMany({
      where: { sessionId },
    })
  }
}
