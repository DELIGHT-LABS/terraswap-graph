import { Get, Controller } from '@nestjs/common'

@Controller()
export class AppController {
  @Get('')
  health(): { timestamp: number } {
    return { timestamp: Date.now() }
  }
}
