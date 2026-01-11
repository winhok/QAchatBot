import { LoggerService } from '@/infrastructure/logger/logger.service'
import type { SessionStatus, SessionType } from '@/shared/schemas/enums'
import type { CreateSessionRequest, UpdateSessionRequest } from '@/shared/schemas/requests'
import { PrismaService } from '@/infrastructure/database/prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class SessionsService {
  private readonly className = 'SessionsService'

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async create(userId: string, dto: CreateSessionRequest) {
    const result = await this.prisma.session.create({
      data: {
        userId,
        ...(dto.id && { id: dto.id }),
        name: dto.name ?? '',
        type: dto.type,
        ...(dto.folderId && { folderId: dto.folderId }),
      },
    })
    this.logger.logQueryResult(this.className, 'create', result)
    return result
  }

  async findOrCreate(userId: string, id: string, type: SessionType = 'normal') {
    const existing = await this.prisma.session.findFirst({ where: { id, userId } })
    this.logger.logQueryResult(this.className, 'findOrCreate.find', existing)
    if (existing) return existing

    const result = await this.prisma.session.create({
      data: { id, userId, type },
    })
    this.logger.logQueryResult(this.className, 'findOrCreate.create', result)
    return result
  }

  async findAll(userId: string, status?: SessionStatus) {
    const result = await this.prisma.session.findMany({
      where: {
        userId,
        status: status ?? { not: 'deleted' },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      include: {
        folder: {
          select: { id: true, name: true, icon: true, color: true },
        },
        messages: {
          orderBy: { seq: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    })
    this.logger.logQueryResult(this.className, 'findAll', result)
    return result
  }

  async findByType(userId: string, type: SessionType, status?: SessionStatus) {
    const result = await this.prisma.session.findMany({
      where: {
        userId,
        type,
        status: status ?? { not: 'deleted' },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      include: {
        folder: {
          select: { id: true, name: true, icon: true, color: true },
        },
        messages: {
          orderBy: { seq: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    })
    this.logger.logQueryResult(this.className, 'findByType', result)
    return result
  }

  async findOne(userId: string, id: string) {
    const result = await this.prisma.session.findFirst({
      where: { id, userId },
      include: {
        folder: {
          select: { id: true, name: true, icon: true, color: true },
        },
        messages: {
          orderBy: { seq: 'asc' },
          include: {
            toolCalls: {
              orderBy: { seq: 'asc' },
            },
          },
        },
      },
    })
    this.logger.logQueryResult(this.className, 'findOne', result)
    return result
  }

  async update(userId: string, id: string, dto: Omit<UpdateSessionRequest, 'id'>) {
    const session = await this.prisma.session.findFirst({ where: { id, userId } })
    if (!session) return null

    const result = await this.prisma.session.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    })
    this.logger.logQueryResult(this.className, 'update', result)
    return result
  }

  async archive(userId: string, id: string) {
    const session = await this.prisma.session.findFirst({ where: { id, userId } })
    if (!session) return null

    const result = await this.prisma.session.update({
      where: { id },
      data: { status: 'archived' },
    })
    this.logger.logQueryResult(this.className, 'archive', result)
    return result
  }

  async remove(userId: string, id: string) {
    const session = await this.prisma.session.findFirst({ where: { id, userId } })
    if (!session) return null

    const result = await this.prisma.session.update({
      where: { id },
      data: { status: 'deleted' },
    })
    this.logger.logQueryResult(this.className, 'remove', result)
    return result
  }

  async hardDelete(userId: string, id: string) {
    const session = await this.prisma.session.findFirst({ where: { id, userId } })
    if (!session) return null

    const result = await this.prisma.session.delete({
      where: { id },
    })
    this.logger.logQueryResult(this.className, 'hardDelete', result)
    return result
  }

  async updateLastMessageAt(userId: string, id: string) {
    const session = await this.prisma.session.findFirst({ where: { id, userId } })
    if (!session) return null

    const result = await this.prisma.session.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    })
    this.logger.logQueryResult(this.className, 'updateLastMessageAt', result)
    return result
  }
}
