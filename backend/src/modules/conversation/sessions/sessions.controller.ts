import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import {
  CreateSessionRequestSchema,
  UpdateSessionRequestSchema,
  type CreateSessionRequest,
  type UpdateSessionRequest,
} from '@/shared/schemas/requests'
import type { SessionStatus, SessionType } from '@/shared/schemas/enums'
import { SessionsService } from './sessions.service'

@Controller('api/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateSessionRequestSchema))
    dto: CreateSessionRequest,
  ) {
    return this.sessionsService.create(userId, dto)
  }

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: SessionType,
    @Query('status') status?: SessionStatus,
  ) {
    const sessions = type
      ? await this.sessionsService.findByType(userId, type, status)
      : await this.sessionsService.findAll(userId, status)
    return { sessions }
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.sessionsService.findOne(userId, id)
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSessionRequestSchema.omit({ id: true })))
    dto: Omit<UpdateSessionRequest, 'id'>,
  ) {
    return this.sessionsService.update(userId, id, dto)
  }

  @Patch(':id/archive')
  archive(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.sessionsService.archive(userId, id)
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.sessionsService.remove(userId, id)
  }
}
