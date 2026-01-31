import { Document } from '@langchain/core/documents'
import * as crypto from 'crypto'

/**
 * 生成 UUID
 */
function generateUuid(): string {
  return crypto.randomUUID()
}

/**
 * 文档去重 Reducer
 * 用于 LangGraph State 中合并多次检索的文档结果
 *
 * @param existing 已存在的文档列表
 * @param incoming 新传入的文档、字符串或 'delete' 指令
 * @returns 去重后的文档列表
 */
export function reduceDocs(
  existing: Document[] | undefined,
  incoming: Document[] | string,
): Document[] {
  // 删除指令：清空文档
  if (incoming === 'delete') {
    return []
  }

  const existingList = existing ?? []
  const existingIds = new Set<string>(
    existingList.map((d) => d.metadata?.uuid as string).filter(Boolean),
  )

  // 字符串输入：转换为文档
  if (typeof incoming === 'string') {
    const newDoc = new Document({
      pageContent: incoming,
      metadata: { uuid: generateUuid() },
    })
    return [...existingList, newDoc]
  }

  // 文档数组：按 UUID 去重
  const deduped: Document[] = []
  for (const doc of incoming) {
    let id = doc.metadata?.uuid as string | undefined
    if (!id) {
      // 没有 UUID 的文档，自动生成
      id = generateUuid()
      doc.metadata = { ...doc.metadata, uuid: id }
    }

    if (!existingIds.has(id)) {
      existingIds.add(id)
      deduped.push(doc)
    }
  }

  return [...existingList, ...deduped]
}

/**
 * 为文档分配 UUID（如果没有）
 */
export function ensureDocumentUuid(doc: Document): Document {
  if (doc.metadata?.uuid) {
    return doc
  }
  return new Document({
    pageContent: doc.pageContent,
    metadata: { ...doc.metadata, uuid: generateUuid() },
  })
}

/**
 * 批量为文档分配 UUID
 */
export function ensureDocumentsUuid(docs: Document[]): Document[] {
  return docs.map(ensureDocumentUuid)
}
