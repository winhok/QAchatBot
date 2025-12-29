// TODO: 反馈服务
// 功能需求：
// 1. 存储反馈到数据库
// 2. 或发送到分析服务（如 PostHog, Mixpanel）
// 3. 或写入日志文件

import { Injectable } from '@nestjs/common';

export interface FeedbackPayload {
  messageId: string;
  sessionId: string;
  type: 'positive' | 'negative';
  reason?: string; // 负面反馈原因
  content?: string; // 消息内容（用于分析）
}

@Injectable()
export class FeedbackService {
  async submit(_dto: FeedbackPayload) {
    // TODO: 存储反馈
    // - 可以存到数据库
    // - 或发送到分析服务（如 PostHog, Mixpanel）
    // - 或写入日志文件

    return { success: true };
  }

  async get(_messageId?: string) {
    // TODO: 查询反馈记录

    return { feedback: null };
  }
}
