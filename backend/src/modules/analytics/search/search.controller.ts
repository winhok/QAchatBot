// TODO: 搜索 API 控制器
// 功能需求：
// 1. 搜索会话名称
// 2. 搜索消息内容（全文检索）
// 3. 返回匹配的会话和消息
// 4. 高亮匹配片段
// 5. 分页支持

import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') query?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const q = query || '';
    const limitNum = parseInt(limit || '20');
    const offsetNum = parseInt(offset || '0');

    if (!q.trim()) {
      return { results: [], total: 0, query: '' };
    }

    return this.searchService.search(q, limitNum, offsetNum);
  }
}
