import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
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
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(CreateFolderRequestSchema))
    dto: CreateFolderRequest,
  ) {
    return this.foldersService.create(userId, dto)
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    const folders = await this.foldersService.findAll(userId)
    return { folders }
  }

  @Get('default')
  getDefault(@CurrentUser('id') userId: string) {
    return this.foldersService.getOrCreateDefault(userId)
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.foldersService.findOne(userId, id)
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateFolderRequestSchema))
    dto: UpdateFolderRequest,
  ) {
    return this.foldersService.update(userId, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.foldersService.delete(userId, id)
  }

  // ========== Session 移动 ==========

  @Post(':id/sessions')
  moveSessions(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(MoveSessionsRequestSchema))
    dto: MoveSessionsRequest,
  ) {
    return this.foldersService.moveSessions(userId, dto.sessionIds, id)
  }

  @Post(':id/sessions/:sessionId')
  moveSession(
    @CurrentUser('id') userId: string,
    @Param('id') folderId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.foldersService.moveSession(userId, sessionId, folderId)
  }

  // ========== 记忆管理 ==========

  @Get(':id/memories')
  getMemories(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.foldersService.getMemories(userId, id)
  }

  @Post(':id/memories')
  addMemory(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddMemoryRequestSchema))
    dto: AddMemoryRequest,
  ) {
    return this.foldersService.addMemory(userId, id, dto)
  }

  @Delete(':id/memories/:key')
  deleteMemory(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('key') key: string,
  ) {
    return this.foldersService.deleteMemory(userId, id, key)
  }
}
