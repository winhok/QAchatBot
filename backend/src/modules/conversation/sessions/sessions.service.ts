import { PrismaService } from '@/infrastructure/database/prisma.service'
import { LoggerService } from '@/infrastructure/logger/logger.service'
import type { SessionStatus } from '@/shared/schemas/enums'
import type { CreateSessionRequest, UpdateSessionRequest } from '@/shared/schemas/requests'
import { Injectable } from '@nestjs/common'

@Injectable()
export class SessionsService {
  private readonly className = 'SessionsService'

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * Verify user owns the session, returns session if found
   */
  private async verifyOwnership(userId: string, id: string) {
    return this.prisma.session.findFirst({ where: { id, userId } })
  }

  /**
   * Execute operation after verifying ownership
   * Returns null if session not found or not owned by user
   */
  private async withOwnership<T>(
    userId: string,
    id: string,
    operation: () => Promise<T>,
    methodName: string,
  ): Promise<T | null> {
    const session = await this.verifyOwnership(userId, id)
    if (!session) return null

    const result = await operation()
    this.logger.logQueryResult(this.className, methodName, result)
    return result
  }

  async create(userId: string, dto: CreateSessionRequest) {
    const result = await this.prisma.session.create({
      data: {
        userId,
        ...(dto.id && { id: dto.id }),
        name: dto.name ?? '',
        ...(dto.folderId && { folderId: dto.folderId }),
      },
    })
    this.logger.logQueryResult(this.className, 'create', result)
    return result
  }

  async findOrCreate(userId: string, id: string) {
    const existing = await this.verifyOwnership(userId, id)
    this.logger.logQueryResult(this.className, 'findOrCreate.find', existing)
    if (existing) return existing

    const result = await this.prisma.session.create({
      data: { id, userId },
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
    return this.withOwnership(
      userId,
      id,
      () =>
        this.prisma.session.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.status !== undefined && { status: dto.status }),
            ...(dto.folderId !== undefined && { folderId: dto.folderId }),
          },
        }),
      'update',
    )
  }

  async archive(userId: string, id: string) {
    return this.withOwnership(
      userId,
      id,
      () => this.prisma.session.update({ where: { id }, data: { status: 'archived' } }),
      'archive',
    )
  }

  async remove(userId: string, id: string) {
    return this.withOwnership(
      userId,
      id,
      () => this.prisma.session.update({ where: { id }, data: { status: 'deleted' } }),
      'remove',
    )
  }

  async hardDelete(userId: string, id: string) {
    return this.withOwnership(
      userId,
      id,
      () => this.prisma.session.delete({ where: { id } }),
      'hardDelete',
    )
  }

  async updateLastMessageAt(userId: string, id: string) {
    return this.withOwnership(
      userId,
      id,
      () => this.prisma.session.update({ where: { id }, data: { lastMessageAt: new Date() } }),
      'updateLastMessageAt',
    )
  }
}
