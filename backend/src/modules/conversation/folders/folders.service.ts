import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/infrastructure/database/prisma.service'
import { LoggerService } from '@/infrastructure/logger/logger.service'

@Injectable()
export class FoldersService {
  private readonly className = 'FoldersService'

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async create(
    userId: string,
    data: {
      name: string
      icon?: string
      color?: string
      description?: string
    },
  ) {
    const result = await this.prisma.folder.create({
      data: { ...data, userId },
    })
    this.logger.logQueryResult(this.className, 'create', result)
    return result
  }

  async findAll(userId: string) {
    const result = await this.prisma.folder.findMany({
      where: { userId },
      include: {
        sessions: {
          where: { status: { not: 'deleted' } },
          orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
          take: 10,
          select: { id: true, name: true, lastMessageAt: true },
        },
        _count: { select: { sessions: true, memories: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })
    this.logger.logQueryResult(this.className, 'findAll', result)
    return result
  }

  async findOne(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId },
      include: {
        sessions: {
          where: { status: { not: 'deleted' } },
          orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        },
        memories: true,
      },
    })
    this.logger.logQueryResult(this.className, 'findOne', folder)
    if (!folder) throw new NotFoundException('Folder not found')
    return folder
  }

  async getOrCreateDefault(userId: string) {
    const existing = await this.prisma.folder.findFirst({
      where: { userId, isDefault: true },
    })
    if (existing) return existing

    const result = await this.prisma.folder.create({
      data: { name: '未分类', userId, isDefault: true, icon: '📁' },
    })
    this.logger.logQueryResult(this.className, 'getOrCreateDefault', result)
    return result
  }

  async update(
    userId: string,
    id: string,
    data: {
      name?: string
      icon?: string
      color?: string
      description?: string
    },
  ) {
    const folder = await this.prisma.folder.findFirst({ where: { id, userId } })
    if (!folder) throw new NotFoundException('Folder not found')

    const result = await this.prisma.folder.update({ where: { id }, data })
    this.logger.logQueryResult(this.className, 'update', result)
    return result
  }

  async delete(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({ where: { id, userId } })
    if (!folder) throw new NotFoundException('Folder not found')
    if (folder.isDefault) {
      throw new Error('Cannot delete default folder')
    }

    // 将该文件夹下的会话移到默认文件夹
    const defaultFolder = await this.getOrCreateDefault(userId)

    await this.prisma.session.updateMany({
      where: { folderId: id, userId },
      data: { folderId: defaultFolder.id },
    })

    const result = await this.prisma.folder.delete({ where: { id } })
    this.logger.logQueryResult(this.className, 'delete', result)
    return result
  }

  async moveSession(userId: string, sessionId: string, folderId: string | null) {
    const session = await this.prisma.session.findFirst({ where: { id: sessionId, userId } })
    if (!session) throw new NotFoundException('Session not found')

    const result = await this.prisma.session.update({
      where: { id: sessionId },
      data: { folderId },
    })
    this.logger.logQueryResult(this.className, 'moveSession', result)
    return result
  }

  async moveSessions(userId: string, sessionIds: string[], folderId: string) {
    const result = await this.prisma.session.updateMany({
      where: { id: { in: sessionIds }, userId },
      data: { folderId },
    })
    this.logger.logQueryResult(this.className, 'moveSessions', result)
    return result
  }

  // ========== 记忆管理 ==========

  async getMemories(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({ where: { id: folderId, userId } })
    if (!folder) throw new NotFoundException('Folder not found')

    const result = await this.prisma.memory.findMany({
      where: { folderId, userId, scope: 'folder' },
      orderBy: [{ category: 'asc' }, { priority: 'desc' }],
    })
    this.logger.logQueryResult(this.className, 'getMemories', result)
    return result
  }

  async addMemory(
    userId: string,
    folderId: string,
    data: {
      category: string
      key: string
      value: unknown
      priority?: number
    },
  ) {
    const folder = await this.prisma.folder.findFirst({ where: { id: folderId, userId } })
    if (!folder) throw new NotFoundException('Folder not found')

    const result = await this.prisma.memory.upsert({
      where: {
        userId_folderId_scope_category_key: {
          userId,
          folderId,
          scope: 'folder',
          category: data.category,
          key: data.key,
        },
      },
      update: { value: data.value as object, priority: data.priority ?? 0 },
      create: {
        userId,
        folderId,
        scope: 'folder',
        category: data.category,
        key: data.key,
        value: data.value as object,
        priority: data.priority ?? 0,
      },
    })
    this.logger.logQueryResult(this.className, 'addMemory', result)
    return result
  }

  async deleteMemory(userId: string, folderId: string, key: string) {
    const folder = await this.prisma.folder.findFirst({ where: { id: folderId, userId } })
    if (!folder) throw new NotFoundException('Folder not found')

    const result = await this.prisma.memory.deleteMany({
      where: { folderId, userId, scope: 'folder', key },
    })
    this.logger.logQueryResult(this.className, 'deleteMemory', result)
    return result
  }
}
