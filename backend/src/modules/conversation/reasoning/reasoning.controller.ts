import { Controller, Get, Param, Query } from '@nestjs/common'
import type { Reasoning } from '@prisma/client'
import { ReasoningService } from './reasoning.service'

interface ReasoningResponse {
  id: string
  checkpointId: string
  content: string
  duration: number | null
  createdAt: Date
}

function toReasoningResponse(r: Reasoning): ReasoningResponse {
  return {
    id: r.id,
    checkpointId: r.checkpointId,
    content: r.content,
    duration: r.duration,
    createdAt: r.createdAt,
  }
}

@Controller('api/reasoning')
export class ReasoningController {
  constructor(private readonly reasoningService: ReasoningService) {}

  /**
   * 通过 checkpointId 获取 reasoning
   * GET /api/reasoning/:checkpointId
   */
  @Get(':checkpointId')
  async getByCheckpointId(
    @Param('checkpointId') checkpointId: string,
  ): Promise<{ found: boolean; data: ReasoningResponse | null }> {
    const reasoning = await this.reasoningService.findByCheckpointId(checkpointId)
    if (!reasoning) {
      return { found: false, data: null }
    }
    return {
      found: true,
      data: toReasoningResponse(reasoning),
    }
  }

  /**
   * 获取会话的所有 reasoning
   * GET /api/reasoning?sessionId=xxx
   */
  @Get()
  async getBySessionId(
    @Query('sessionId') sessionId: string,
  ): Promise<{ reasonings: ReasoningResponse[] }> {
    if (!sessionId) {
      return { reasonings: [] }
    }
    const reasonings = await this.reasoningService.findBySessionId(sessionId)
    return {
      reasonings: reasonings.map(toReasoningResponse),
    }
  }
}
