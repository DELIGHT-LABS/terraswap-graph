import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { DashboardsModule } from './dashboards.module'

@Module({
  imports: [DashboardsModule],
  controllers: [AppController],
})
export class AppModule {}
