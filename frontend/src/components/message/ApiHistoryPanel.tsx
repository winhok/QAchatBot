import { useState } from 'react'

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
  duration: number // 毫秒
  error?: string
}

interface ApiHistoryPanelProps {
  sessionId: string
  onReplay: (record: ApiRequestRecord) => void
}

export function ApiHistoryPanel({ sessionId, onReplay }: ApiHistoryPanelProps) {
  const [records, setRecords] = useState<Array<ApiRequestRecord>>([])
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
  const filteredRecords = records.filter((record) => {
    // 方法筛选
    if (filter.method && record.method !== filter.method) {
      return false
    }
    // 状态筛选
    if (filter.status === 'success' && record.responseStatus >= 400) {
      return false
    }
    if (filter.status === 'error' && record.responseStatus < 400) {
      return false
    }
    // 搜索筛选
    if (filter.search && !record.url.toLowerCase().includes(filter.search.toLowerCase())) {
      return false
    }
    return true
  })

  // TODO: 获取方法颜色
  const getMethodColor = (method: HttpMethod): string => {
    // TODO: 不同方法返回不同颜色
    // GET: 绿色, POST: 蓝色, PUT: 橙色, DELETE: 红色
    const colors: Record<HttpMethod, string> = {
      GET: 'text-green-500',
      POST: 'text-blue-500',
      PUT: 'text-orange-500',
      PATCH: 'text-yellow-500',
      DELETE: 'text-red-500',
      HEAD: 'text-gray-500',
      OPTIONS: 'text-purple-500',
    }
    return colors[method] || 'text-gray-500'
  }

  // TODO: 获取状态码颜色
  const getStatusColor = (status: number): string => {
    // TODO: 2xx 绿色, 3xx 蓝色, 4xx 橙色, 5xx 红色
    if (status >= 200 && status < 300) return 'text-green-500'
    if (status >= 300 && status < 400) return 'text-blue-500'
    if (status >= 400 && status < 500) return 'text-orange-500'
    if (status >= 500) return 'text-red-500'
    return 'text-gray-500'
  }

  // TODO: 生成 cURL 命令
  const generateCurl = (record: ApiRequestRecord): string => {
    // TODO: 根据记录生成 cURL 命令
    const parts = [`curl -X ${record.method} '${record.url}'`]

    for (const [key, value] of Object.entries(record.requestHeaders)) {
      parts.push(`-H '${key}: ${value}'`)
    }

    if (record.requestBody) {
      parts.push(`-d '${JSON.stringify(record.requestBody)}'`)
    }

    return parts.join(' \\\n  ')
  }

  // TODO: 复制 cURL
  const copyCurl = async (record: ApiRequestRecord) => {
    const curl = generateCurl(record)
    await navigator.clipboard.writeText(curl)
  }

  // TODO: 回放请求
  const handleReplay = (record: ApiRequestRecord) => {
    onReplay(record)
  }

  // TODO: 清空历史
  const clearHistory = () => {
    // TODO: 确认后清空
    if (confirm('确定要清空所有历史记录吗？')) {
      setRecords([])
    }
  }

  // TODO: 导出历史
  const exportHistory = () => {
    // TODO: 导出为 JSON 或 HAR 格式
    const data = JSON.stringify(records, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-history-${sessionId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Suppress unused variable warnings for TODO implementations
  void sessionId
  void setFilter
  void getMethodColor
  void getStatusColor
  void copyCurl
  void handleReplay
  void clearHistory
  void exportHistory

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
            <p className="text-muted-foreground text-sm">暂无请求历史</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record.id} className="history-item">
              {/* TODO: 摘要行（点击展开） */}
              <button
                type="button"
                className="history-item-header"
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
              >
                {/* TODO: 方法标签（带颜色） */}
                {/* TODO: URL（截断显示） */}
                {/* TODO: 状态码（带颜色） */}
                {/* TODO: 耗时 */}
                {/* TODO: 时间戳 */}
              </button>

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
