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

  async create(data: {
    name: string
    userId?: string
    icon?: string
    color?: string
    description?: string
  }) {
    const result = await this.prisma.folder.create({ data })
    this.logger.logQueryResult(this.className, 'create', result)
    return result
  }

  async findAll(userId?: string) {
    const result = await this.prisma.folder.findMany({
      where: userId ? { userId } : {},
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

  async findOne(id: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
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

  async getOrCreateDefault(userId?: string) {
    const existing = await this.prisma.folder.findFirst({
      where: { userId: userId ?? null, isDefault: true },
    })
    if (existing) return existing

    const result = await this.prisma.folder.create({
      data: { name: '未分类', userId, isDefault: true, icon: '📁' },
    })
    this.logger.logQueryResult(this.className, 'getOrCreateDefault', result)
    return result
  }

  async update(
    id: string,
    data: {
      name?: string
      icon?: string
      color?: string
      description?: string
    },
  ) {
    const result = await this.prisma.folder.update({ where: { id }, data })
    this.logger.logQueryResult(this.className, 'update', result)
    return result
  }

  async delete(id: string) {
    const folder = await this.prisma.folder.findUnique({ where: { id } })
    if (folder?.isDefault) {
      throw new Error('Cannot delete default folder')
    }

    // 将该文件夹下的会话移到默认文件夹
    const defaultFolder = await this.getOrCreateDefault(folder?.userId ?? undefined)

    await this.prisma.session.updateMany({
      where: { folderId: id },
      data: { folderId: defaultFolder.id },
    })

    const result = await this.prisma.folder.delete({ where: { id } })
    this.logger.logQueryResult(this.className, 'delete', result)
    return result
  }

  async moveSession(sessionId: string, folderId: string | null) {
    const result = await this.prisma.session.update({
      where: { id: sessionId },
      data: { folderId },
    })
    this.logger.logQueryResult(this.className, 'moveSession', result)
    return result
  }

  async moveSessions(sessionIds: string[], folderId: string) {
    const result = await this.prisma.session.updateMany({
      where: { id: { in: sessionIds } },
      data: { folderId },
    })
    this.logger.logQueryResult(this.className, 'moveSessions', result)
    return result
  }

  // ========== 记忆管理 ==========

  async getMemories(folderId: string) {
    const result = await this.prisma.memory.findMany({
      where: { folderId, scope: 'folder' },
      orderBy: [{ category: 'asc' }, { priority: 'desc' }],
    })
    this.logger.logQueryResult(this.className, 'getMemories', result)
    return result
  }

  async addMemory(
    folderId: string,
    data: {
      category: string
      key: string
      value: unknown
      priority?: number
    },
  ) {
    const result = await this.prisma.memory.upsert({
      where: {
        userId_folderId_scope_category_key: {
          userId: '',
          folderId,
          scope: 'folder',
          category: data.category,
          key: data.key,
        },
      },
      update: { value: data.value as object, priority: data.priority ?? 0 },
      create: {
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

  async deleteMemory(folderId: string, key: string) {
    const result = await this.prisma.memory.deleteMany({
      where: { folderId, scope: 'folder', key },
    })
    this.logger.logQueryResult(this.className, 'deleteMemory', result)
    return result
  }
}
