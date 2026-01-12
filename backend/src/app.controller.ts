import { Controller, Get, Head } from '@nestjs/common'
import { Public } from '@/common/decorators/public.decorator'

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): { ok: boolean } {
    return { ok: true }
  }

  @Public()
  @Head()
  healthCheckHead(): void {
    return
  }
}
