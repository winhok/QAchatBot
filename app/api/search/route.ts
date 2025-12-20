// TODO: 搜索 API 路由
// 功能需求：
// 1. 搜索会话名称
// 2. 搜索消息内容（全文检索）
// 3. 返回匹配的会话和消息
// 4. 高亮匹配片段
// 5. 分页支持

import { NextRequest, NextResponse } from 'next/server'

interface SearchResult {
  type: 'session' | 'message'
  sessionId: string
  sessionName: string
  messageId?: string
  content: string
  highlight: string  // 带高亮标记的匹配片段
  score: number      // 相关性评分
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

export async function GET(request: NextRequest) {
  // TODO: 实现搜索逻辑
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  if (!query.trim()) {
    return NextResponse.json({ results: [], total: 0, query: '' })
  }

  try {
    // TODO: 实现搜索
    // 1. 搜索会话名称（模糊匹配）
    // 2. 搜索消息内容（全文检索）
    // 3. 合并结果并排序
    // 4. 生成高亮片段
    // 5. 分页处理

    const results: SearchResult[] = []

    return NextResponse.json({
      results,
      total: results.length,
      query,
    } as SearchResponse)
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
