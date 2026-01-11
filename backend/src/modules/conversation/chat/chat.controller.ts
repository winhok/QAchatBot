import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ChatRequestSchema, type ChatRequest } from '@/shared/schemas/requests'
import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common'
import { createId } from '@paralleldrive/cuid2'
import type { Request, Response } from 'express'
import { SessionsService } from '../sessions/sessions.service'
import { ChatService } from './chat.service'

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly sessionsService: SessionsService,
  ) {}

  @Get()
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('session_id') sessionId?: string,
    @Query('model_id') modelId?: string,
  ) {
    if (!sessionId) {
      return {
        message: 'LangGraph chat api is running',
        version: '1.0.0',
        endpoints: {
          chat: 'POST /api/chat - Stream chat messages',
          history: 'GET /api/chat?session_id=xxx - Get chat history',
        },
      }
    }

    // Validate session exists and belongs to user
    const session = await this.sessionsService.findOne(userId, sessionId)
    if (!session) {
      throw new BadRequestException('Session not found')
    }

    const history = await this.chatService.getHistory(sessionId, modelId)
    return { session_id: sessionId, history }
  }

  @Post()
  async chat(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(ChatRequestSchema)) dto: ChatRequest,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<void> {
    const sessionId = dto.session_id || createId()
    const modelId = dto.model_id || 'gpt-4o'
    const sessionType = dto.session_type || 'normal'
    const tools = dto.tools

    // Set streaming response headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')

    // Listen for client disconnect
    let aborted = false
    req.on('close', () => {
      aborted = true
      console.log('[Chat API] Client disconnected')
    })

    try {
      await this.chatService.streamChat({
        userId,
        message: dto.message,
        sessionId,
        modelId,
        sessionType,
        res,
        isAborted: () => aborted,
        tools,
      })
    } catch (error) {
      console.error('[Chat API] Error:', error)
      if (!aborted) {
        const errorData =
          JSON.stringify({
            type: 'error',
            status: 'internal error',
            message: 'Sorry, Something went wrong. Please try again later.',
          }) + '\n'
        res.write(errorData)
      }
    } finally {
      res.end()
    }
  }
}
