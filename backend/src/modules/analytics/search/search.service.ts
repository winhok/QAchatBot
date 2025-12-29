// TODO: 搜索服务
// 功能需求：
// 1. 搜索会话名称（模糊匹配）
// 2. 搜索消息内容（全文检索）
// 3. 合并结果并排序
// 4. 生成高亮片段
// 5. 分页处理

import { Injectable } from '@nestjs/common';

export interface SearchResult {
  type: 'session' | 'message';
  sessionId: string;
  sessionName: string;
  messageId?: string;
  content: string;
  highlight: string; // 带高亮标记的匹配片段
  score: number; // 相关性评分
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

@Injectable()
export class SearchService {
  async search(
    query: string,
    _limit: number,
    _offset: number,
  ): Promise<SearchResponse> {
    // TODO: 实现搜索
    // 1. 搜索会话名称（模糊匹配）
    // 2. 搜索消息内容（全文检索）
    // 3. 合并结果并排序
    // 4. 生成高亮片段
    // 5. 分页处理

    const results: SearchResult[] = [];

    return {
      results,
      total: results.length,
      query,
    };
  }
}
