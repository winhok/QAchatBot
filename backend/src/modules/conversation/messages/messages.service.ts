import { LoggerService } from '@/infrastructure/logger/logger.service'
import { PrismaService } from '@/infrastructure/database/prisma.service'
import { Injectable } from '@nestjs/common'
import type { MessageRole, ToolCallStatus } from '@/shared/schemas/enums'
import type { Prisma } from '../../../../generated/prisma/index.js'

export interface CreateMessageDto {
  sessionId: string
  role: MessageRole
  content?: string
  metadata?: Prisma.InputJsonValue
}

export interface CreateToolCallDto {
  messageId: string
  toolCallId: string
  toolName: string
  args: Prisma.InputJsonValue
}

export interface UpdateToolCallDto {
  result?: Prisma.InputJsonValue
  status: ToolCallStatus
  duration?: number
}

@Injectable()
export class MessagesService {
  private readonly className = 'MessagesService'

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async create(dto: CreateMessageDto) {
    const lastMessage = await this.prisma.message.findFirst({
      where: { sessionId: dto.sessionId },
      orderBy: { seq: 'desc' },
      select: { seq: true },
    })
    this.logger.logQueryResult(this.className, 'create.findLast', lastMessage)

    const seq = (lastMessage?.seq ?? 0) + 1

    const message = await this.prisma.message.create({
      data: {
        sessionId: dto.sessionId,
        seq,
        role: dto.role,
        content: dto.content,
        metadata: dto.metadata ?? {},
      },
    })
    this.logger.logQueryResult(this.className, 'create', message)

    await this.prisma.session.update({
      where: { id: dto.sessionId },
      data: { lastMessageAt: new Date() },
    })

    return message
  }

  async findBySession(sessionId: string, limit?: number, offset?: number) {
    const result = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { seq: 'asc' },
      include: {
        toolCalls: {
          orderBy: { seq: 'asc' },
        },
      },
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
    })
    this.logger.logQueryResult(this.className, 'findBySession', result)
    return result
  }

  async findOne(id: string) {
    const result = await this.prisma.message.findUnique({
      where: { id },
      include: {
        toolCalls: {
          orderBy: { seq: 'asc' },
        },
      },
    })
    this.logger.logQueryResult(this.className, 'findOne', result)
    return result
  }

  async updateContent(id: string, content: string) {
    const result = await this.prisma.message.update({
      where: { id },
      data: { content },
    })
    this.logger.logQueryResult(this.className, 'updateContent', result)
    return result
  }

  async appendContent(id: string, chunk: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      select: { content: true },
    })
    this.logger.logQueryResult(this.className, 'appendContent.find', message)

    const result = await this.prisma.message.update({
      where: { id },
      data: { content: (message?.content ?? '') + chunk },
    })
    this.logger.logQueryResult(this.className, 'appendContent', result)
    return result
  }

  async updateMetadata(id: string, metadata: Prisma.InputJsonValue) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      select: { metadata: true },
    })
    this.logger.logQueryResult(this.className, 'updateMetadata.find', message)

    const result = await this.prisma.message.update({
      where: { id },
      data: {
        metadata: {
          ...(message?.metadata as object),
          ...(metadata as object),
        },
      },
    })
    this.logger.logQueryResult(this.className, 'updateMetadata', result)
    return result
  }

  async createToolCall(dto: CreateToolCallDto) {
    const lastToolCall = await this.prisma.toolCall.findFirst({
      where: { messageId: dto.messageId },
      orderBy: { seq: 'desc' },
      select: { seq: true },
    })
    this.logger.logQueryResult(this.className, 'createToolCall.findLast', lastToolCall)

    const seq = (lastToolCall?.seq ?? 0) + 1

    const result = await this.prisma.toolCall.create({
      data: {
        messageId: dto.messageId,
        seq,
        toolCallId: dto.toolCallId,
        toolName: dto.toolName,
        args: dto.args,
      },
    })
    this.logger.logQueryResult(this.className, 'createToolCall', result)
    return result
  }

  async updateToolCall(id: string, dto: UpdateToolCallDto) {
    const result = await this.prisma.toolCall.update({
      where: { id },
      data: {
        ...(dto.result !== undefined && { result: dto.result as object }),
        status: dto.status,
        ...(dto.duration !== undefined && { duration: dto.duration }),
      },
    })
    this.logger.logQueryResult(this.className, 'updateToolCall', result)
    return result
  }

  async updateToolCallByToolCallId(toolCallId: string, dto: UpdateToolCallDto) {
    const result = await this.prisma.toolCall.updateMany({
      where: { toolCallId },
      data: {
        ...(dto.result !== undefined && { result: dto.result as object }),
        status: dto.status,
        ...(dto.duration !== undefined && { duration: dto.duration }),
      },
    })
    this.logger.debug(this.className, `<==      Total: ${result.count}`)
    return result
  }

  async getToolCallByToolCallId(toolCallId: string) {
    const result = await this.prisma.toolCall.findFirst({
      where: { toolCallId },
    })
    this.logger.logQueryResult(this.className, 'getToolCallByToolCallId', result)
    return result
  }

  async remove(id: string) {
    const result = await this.prisma.message.delete({
      where: { id },
    })
    this.logger.logQueryResult(this.className, 'remove', result)
    return result
  }

  async removeBySession(sessionId: string) {
    const result = await this.prisma.message.deleteMany({
      where: { sessionId },
    })
    this.logger.debug(this.className, `<==      Total: ${result.count}`)
    return result
  }
}
