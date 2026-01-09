import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import {
  CreateFolderRequestSchema,
  UpdateFolderRequestSchema,
  AddMemoryRequestSchema,
  MoveSessionsRequestSchema,
  type CreateFolderRequest,
  type UpdateFolderRequest,
  type AddMemoryRequest,
  type MoveSessionsRequest,
} from '@/shared/schemas/requests'
import { FoldersService } from './folders.service'

@Controller('api/folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateFolderRequestSchema))
    dto: CreateFolderRequest,
  ) {
    return this.foldersService.create(dto)
  }

  @Get()
  async findAll(@Query('userId') userId?: string) {
    const folders = await this.foldersService.findAll(userId)
    return { folders }
  }

  @Get('default')
  getDefault(@Query('userId') userId?: string) {
    return this.foldersService.getOrCreateDefault(userId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foldersService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateFolderRequestSchema))
    dto: UpdateFolderRequest,
  ) {
    return this.foldersService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foldersService.delete(id)
  }

  // ========== Session 移动 ==========

  @Post(':id/sessions')
  moveSessions(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(MoveSessionsRequestSchema))
    dto: MoveSessionsRequest,
  ) {
    return this.foldersService.moveSessions(dto.sessionIds, id)
  }

  @Post(':id/sessions/:sessionId')
  moveSession(@Param('id') folderId: string, @Param('sessionId') sessionId: string) {
    return this.foldersService.moveSession(sessionId, folderId)
  }

  // ========== 记忆管理 ==========

  @Get(':id/memories')
  getMemories(@Param('id') id: string) {
    return this.foldersService.getMemories(id)
  }

  @Post(':id/memories')
  addMemory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddMemoryRequestSchema))
    dto: AddMemoryRequest,
  ) {
    return this.foldersService.addMemory(id, dto)
  }

  @Delete(':id/memories/:key')
  deleteMemory(@Param('id') id: string, @Param('key') key: string) {
    return this.foldersService.deleteMemory(id, key)
  }
}
