// TODO: 反馈 API 路由
// 功能需求：
// 1. POST: 提交用户反馈（点赞/点踩）
// 2. GET: 获取某条消息的反馈状态（可选）
// 3. 存储到数据库或发送到分析服务
// 4. 可选：收集详细的负面反馈原因

import { NextRequest, NextResponse } from 'next/server'

interface FeedbackPayload {
  messageId: string
  sessionId: string
  type: 'positive' | 'negative'
  reason?: string  // 负面反馈原因
  content?: string // 消息内容（用于分析）
}

export async function POST(request: NextRequest) {
  // TODO: 实现反馈提交逻辑
  // - 解析请求体
  // - 验证参数
  // - 存储反馈数据
  // - 返回结果

  try {
    const payload: FeedbackPayload = await request.json()

    // TODO: 存储反馈
    // - 可以存到数据库
    // - 或发送到分析服务（如 PostHog, Mixpanel）
    // - 或写入日志文件

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // TODO: 获取反馈状态（可选）
  const { searchParams } = new URL(request.url)
  const messageId = searchParams.get('messageId')

  // TODO: 查询反馈记录

  return NextResponse.json({ feedback: null })
}
