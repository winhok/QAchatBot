// TODO: 导出服务
// 功能需求：
// 1. 根据 sessionId 获取数据
// 2. 根据 format 和 type 格式化数据
// 3. 生成文件内容

import { Injectable } from '@nestjs/common';

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'excel';
export type ExportType = 'conversation' | 'testcase' | 'bug-report';

export interface ExportRequest {
  sessionId: string;
  format: ExportFormat;
  type: ExportType;
}

export interface ExportResult {
  content: string | Buffer;
  contentType: string;
  filename: string;
}

@Injectable()
export class ExportService {
  async export(dto: ExportRequest): Promise<ExportResult> {
    const { sessionId, format } = dto;

    // TODO: 根据 sessionId 获取数据
    // TODO: 根据 format 和 type 格式化数据
    // TODO: 生成文件内容

    const content: string | Buffer = '';
    let contentType = 'application/json';
    let filename = `export-${sessionId}`;

    switch (format) {
      case 'json':
        // TODO: 生成 JSON
        contentType = 'application/json';
        filename += '.json';
        break;
      case 'csv':
        // TODO: 生成 CSV
        contentType = 'text/csv';
        filename += '.csv';
        break;
      case 'markdown':
        // TODO: 生成 Markdown
        contentType = 'text/markdown';
        filename += '.md';
        break;
      case 'excel':
        // TODO: 生成 Excel（需要 xlsx 库）
        contentType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename += '.xlsx';
        break;
    }

    return { content, contentType, filename };
  }
}
