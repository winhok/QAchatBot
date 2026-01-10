import {
  MemoryCategory,
  MemoryEntry,
  MemoryScope,
  MergedMemory,
} from '@/shared/schemas/memory.types'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

// Re-export types for backward compatibility
export type { MemoryCategory, MemoryEntry, MemoryScope, MergedMemory }

@Injectable()
export class MemoryStoreService {
  constructor(private prisma: PrismaService) {}

  // ========== 写入记忆 ==========

  async putGlobal<T>(
    userId: string,
    category: MemoryCategory,
    key: string,
    value: T,
    priority = 0,
  ) {
    return this.prisma.memory.upsert({
      where: {
        userId_folderId_scope_category_key: {
          userId,
          folderId: '',
          scope: 'global',
          category,
          key,
        },
      },
      update: { value: value as object, priority },
      create: {
        userId,
        folderId: null,
        scope: 'global',
        category,
        key,
        value: value as object,
        priority,
      },
    })
  }

  async putFolder<T>(
    folderId: string,
    category: MemoryCategory,
    key: string,
    value: T,
    priority = 0,
  ) {
    return this.prisma.memory.upsert({
      where: {
        userId_folderId_scope_category_key: {
          userId: '',
          folderId,
          scope: 'folder',
          category,
          key,
        },
      },
      update: { value: value as object, priority },
      create: {
        folderId,
        scope: 'folder',
        category,
        key,
        value: value as object,
        priority,
      },
    })
  }

  // ========== 读取记忆 ==========

  async getGlobalMemories(userId: string): Promise<MemoryEntry[]> {
    const memories = await this.prisma.memory.findMany({
      where: {
        userId,
        scope: 'global',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { priority: 'desc' },
    })
    return memories.map((m) => ({
      key: m.key,
      value: m.value,
      scope: m.scope as MemoryScope,
      category: m.category as MemoryCategory,
      priority: m.priority,
    }))
  }

  async getFolderMemories(folderId: string): Promise<MemoryEntry[]> {
    const memories = await this.prisma.memory.findMany({
      where: {
        folderId,
        scope: 'folder',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { priority: 'desc' },
    })
    return memories.map((m) => ({
      key: m.key,
      value: m.value,
      scope: m.scope as MemoryScope,
      category: m.category as MemoryCategory,
      priority: m.priority,
    }))
  }

  // ========== 核心：获取会话的合并记忆 ==========

  async getMergedMemoryForSession(sessionId: string, userId?: string): Promise<MergedMemory> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { folderId: true },
    })

    const globalMemories = userId ? await this.getGlobalMemories(userId) : []
    const folderMemories = session?.folderId ? await this.getFolderMemories(session.folderId) : []

    return this.mergeMemories(globalMemories, folderMemories)
  }

  private mergeMemories(global: MemoryEntry[], folder: MemoryEntry[]): MergedMemory {
    const result: MergedMemory = {
      prefs: {},
      rules: [],
      knowledge: {},
      context: {},
    }

    // 先应用全局记忆（低优先级）
    for (const m of global) {
      this.applyEntry(result, m)
    }

    // 再应用文件夹记忆（高优先级，覆盖同名 key）
    for (const m of folder) {
      this.applyEntry(result, m)
    }

    return result
  }

  private applyEntry(result: MergedMemory, entry: MemoryEntry) {
    switch (entry.category) {
      case 'prefs':
        result.prefs[entry.key] = entry.value
        break
      case 'rules':
        if (Array.isArray(entry.value)) {
          result.rules.push(...(entry.value as string[]))
        } else if (typeof entry.value === 'string') {
          result.rules.push(entry.value)
        }
        break
      case 'knowledge':
        result.knowledge[entry.key] = entry.value
        break
      case 'context':
        result.context[entry.key] = entry.value
        break
    }
  }

  // ========== 便捷方法 ==========

  async addFolderRule(folderId: string, rule: string) {
    const key = 'custom_rules'
    const existing = await this.prisma.memory.findFirst({
      where: { folderId, scope: 'folder', category: 'rules', key },
    })
    const rules: string[] = existing ? (existing.value as string[]) : []
    if (!rules.includes(rule)) {
      rules.push(rule)
    }
    await this.putFolder(folderId, 'rules', key, rules)
  }

  async removeFolderRule(folderId: string, rule: string) {
    const key = 'custom_rules'
    const existing = await this.prisma.memory.findFirst({
      where: { folderId, scope: 'folder', category: 'rules', key },
    })
    if (!existing) return
    const rules = (existing.value as string[]).filter((r) => r !== rule)
    await this.putFolder(folderId, 'rules', key, rules)
  }

  async setFolderContext(folderId: string, key: string, value: unknown) {
    await this.putFolder(folderId, 'context', key, value)
  }

  async setGlobalPref(userId: string, key: string, value: unknown) {
    await this.putGlobal(userId, 'prefs', key, value)
  }

  // ========== 删除记忆 ==========

  async deleteGlobalMemory(userId: string, category: MemoryCategory, key: string) {
    return this.prisma.memory.deleteMany({
      where: { userId, scope: 'global', category, key },
    })
  }

  async deleteFolderMemory(folderId: string, category: MemoryCategory, key: string) {
    return this.prisma.memory.deleteMany({
      where: { folderId, scope: 'folder', category, key },
    })
  }

  // ========== 清理过期记忆 ==========

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.memory.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    return result.count
  }
}
