/**
 * 创建反馈 DTO
 */
export interface CreateFeedbackDto {
  messageId: string
  sessionId: string
  score: number // 1 = 👍, -1 = 👎
  comment?: string
}

/**
 * 反馈统计查询 DTO
 */
export interface FeedbackStatsDto {
  sessionId?: string
  startDate?: string
  endDate?: string
}
