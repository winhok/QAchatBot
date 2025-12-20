'use client'

// TODO: API 请求历史面板组件
// 功能需求：
// 1. 显示接口测试的请求历史记录
// 2. 每条记录包含：请求方法、URL、状态码、耗时
// 3. 展开查看详细信息（请求头、请求体、响应头、响应体）
// 4. 一键回放请求（重新发送）
// 5. 复制为 cURL 命令
// 6. 筛选和搜索历史记录
// 7. 清空历史
// 8. 导出历史记录
// 9. 参考 Postman/Insomnia 的历史记录功能

import { useState } from 'react'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

interface ApiRequestRecord {
  id: string
  timestamp: Date
  method: HttpMethod
  url: string
  requestHeaders: Record<string, string>
  requestBody?: unknown
  responseStatus: number
  responseHeaders: Record<string, string>
  responseBody?: unknown
  duration: number  // 毫秒
  error?: string
}

interface ApiHistoryPanelProps {
  sessionId: string
  onReplay: (record: ApiRequestRecord) => void
}

export function ApiHistoryPanel({ sessionId, onReplay }: ApiHistoryPanelProps) {
  const [records, setRecords] = useState<ApiRequestRecord[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<{
    method?: HttpMethod
    status?: 'success' | 'error' | 'all'
    search?: string
  }>({ status: 'all' })

  // TODO: 加载历史记录
  // - 从 API 或本地存储获取
  // - 按时间倒序排列

  // TODO: 筛选记录
  const filteredRecords = records.filter(record => {
    // TODO: 根据 filter 条件筛选
    return true
  })

  // TODO: 获取方法颜色
  const getMethodColor = (method: HttpMethod): string => {
    // TODO: 不同方法返回不同颜色
    // GET: 绿色, POST: 蓝色, PUT: 橙色, DELETE: 红色
    return ''
  }

  // TODO: 获取状态码颜色
  const getStatusColor = (status: number): string => {
    // TODO: 2xx 绿色, 3xx 蓝色, 4xx 橙色, 5xx 红色
    return ''
  }

  // TODO: 生成 cURL 命令
  const generateCurl = (record: ApiRequestRecord): string => {
    // TODO: 根据记录生成 cURL 命令
    // curl -X POST 'url' -H 'header: value' -d 'body'
    return ''
  }

  // TODO: 复制 cURL
  const copyCurl = async (record: ApiRequestRecord) => {
    const curl = generateCurl(record)
    // TODO: 复制到剪贴板
  }

  // TODO: 回放请求
  const handleReplay = (record: ApiRequestRecord) => {
    onReplay(record)
  }

  // TODO: 清空历史
  const clearHistory = () => {
    // TODO: 确认后清空
  }

  // TODO: 导出历史
  const exportHistory = () => {
    // TODO: 导出为 JSON 或 HAR 格式
  }

  return (
    <div className="api-history-panel">
      {/* TODO: 工具栏 */}
      <div className="toolbar">
        {/* TODO: 搜索输入框 */}
        {/* TODO: 方法筛选下拉框 */}
        {/* TODO: 状态筛选（成功/失败/全部） */}
        {/* TODO: 清空按钮 */}
        {/* TODO: 导出按钮 */}
      </div>

      {/* TODO: 历史记录列表 */}
      <div className="history-list">
        {filteredRecords.length === 0 ? (
          <div className="empty-state">
            {/* TODO: 空状态提示 */}
          </div>
        ) : (
          filteredRecords.map(record => (
            <div key={record.id} className="history-item">
              {/* TODO: 摘要行（点击展开） */}
              <div onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                {/* TODO: 方法标签（带颜色） */}
                {/* TODO: URL（截断显示） */}
                {/* TODO: 状态码（带颜色） */}
                {/* TODO: 耗时 */}
                {/* TODO: 时间戳 */}
              </div>

              {/* TODO: 展开详情 */}
              {expandedId === record.id && (
                <div className="detail">
                  {/* TODO: 操作按钮（回放、复制 cURL） */}

                  {/* TODO: 请求详情 */}
                  <div className="request-section">
                    {/* TODO: 请求头 */}
                    {/* TODO: 请求体（格式化 JSON） */}
                  </div>

                  {/* TODO: 响应详情 */}
                  <div className="response-section">
                    {/* TODO: 响应头 */}
                    {/* TODO: 响应体（格式化 JSON） */}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
