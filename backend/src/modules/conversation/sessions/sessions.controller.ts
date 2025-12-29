import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  CreateSessionRequestSchema,
  UpdateSessionRequestSchema,
  type CreateSessionRequest,
  type UpdateSessionRequest,
} from '@/shared/schemas/requests';
import type { SessionStatus, SessionType } from '@/shared/schemas/enums';
import { SessionsService } from './sessions.service';

@Controller('api/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateSessionRequestSchema))
    dto: CreateSessionRequest,
  ) {
    return this.sessionsService.create(dto);
  }

  @Get()
  async findAll(
    @Query('type') type?: SessionType,
    @Query('status') status?: SessionStatus,
  ) {
    const sessions = type
      ? await this.sessionsService.findByType(type, status)
      : await this.sessionsService.findAll(status);
    return { sessions };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSessionRequestSchema.omit({ id: true })))
    dto: Omit<UpdateSessionRequest, 'id'>,
  ) {
    return this.sessionsService.update(id, dto);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.sessionsService.archive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }
}
