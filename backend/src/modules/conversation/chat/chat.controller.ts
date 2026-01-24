import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { ChatRequestSchema, type ChatRequest } from '@/shared/schemas/requests'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common'
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
    @Query('checkpoint_id') checkpointId?: string,
    @Query('model_id') modelId?: string,
  ) {
    if (!sessionId) {
      return {
        message: 'LangGraph chat api is running',
        version: '1.0.0',
        endpoints: {
          chat: 'POST /api/chat - Stream chat messages',
          history: 'GET /api/chat?session_id=xxx - Get chat history',
          branches: 'GET /api/chat/:sessionId/branches?checkpoint_id=xxx - Get branches',
        },
      }
    }

    // Validate session exists and belongs to user
    const session = await this.sessionsService.findOne(userId, sessionId)
    if (!session) {
      throw new BadRequestException('Session not found')
    }

    const result = await this.chatService.getHistory(sessionId, checkpointId, modelId)
    return {
      session_id: sessionId,
      history: result.messages,
      checkpoint_id: result.checkpointId,
      parent_checkpoint_id: result.parentCheckpointId,
    }
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
        res,
        isAborted: () => aborted,
        tools,
        checkpointId: dto.checkpoint_id,
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

  @Get(':sessionId/branches')
  async getBranches(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Query('checkpoint_id') checkpointId: string,
    @Query('model_id') modelId?: string,
  ) {
    if (!checkpointId) {
      throw new BadRequestException('checkpoint_id is required')
    }

    // Validate session belongs to user
    const session = await this.sessionsService.findOne(userId, sessionId)
    if (!session) {
      throw new BadRequestException('Session not found')
    }

    return this.chatService.getBranches(sessionId, checkpointId, modelId)
  }

  @Get(':sessionId/checkpoints')
  async getCheckpoints(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Query('model_id') modelId?: string,
  ) {
    // Validate session belongs to user
    const session = await this.sessionsService.findOne(userId, sessionId)
    if (!session) {
      throw new BadRequestException('Session not found')
    }

    return this.chatService.getCheckpoints(sessionId, modelId)
  }

  @Get(':sessionId/branch-count')
  async getBranchCount(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Query('model_id') modelId?: string,
  ) {
    // Validate session belongs to user
    const session = await this.sessionsService.findOne(userId, sessionId)
    if (!session) {
      throw new BadRequestException('Session not found')
    }

    const count = await this.chatService.getBranchCount(sessionId, modelId)
    return { branchCount: count }
  }
}
