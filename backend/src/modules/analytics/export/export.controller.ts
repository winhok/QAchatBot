// TODO: 导出 API 控制器
// 功能需求：
// 1. 导出会话为不同格式（JSON/CSV/Markdown）
// 2. 导出测试用例为 Excel 格式
// 3. 支持批量导出
// 4. 生成下载文件

import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import { ExportService, type ExportRequest } from './export.service'

@Controller('api/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  export(@Body() dto: ExportRequest, @Res() res: Response) {
    // TODO: 实现导出逻辑
    try {
      const result = this.exportService.export(dto)

      res.setHeader('Content-Type', result.contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)

      return res.status(HttpStatus.OK).send(result.content)
    } catch {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Export failed' })
    }
  }
}
