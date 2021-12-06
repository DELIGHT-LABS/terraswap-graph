import { Controller } from '@nestjs/common'
import { Get } from 'koa-joi-controllers'

@Controller()
export class AppController {
  @Get()
  health(): { timestamp: number } {
    return { timestamp: Date.now() }
  }
}
