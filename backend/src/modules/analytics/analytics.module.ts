import { Module } from '@nestjs/common';
import { FeedbackModule } from './feedback/feedback.module';
import { ExportModule } from './export/export.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [FeedbackModule, ExportModule, SearchModule],
  exports: [FeedbackModule, ExportModule, SearchModule],
})
export class AnalyticsModule {}
