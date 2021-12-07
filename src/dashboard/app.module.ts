import { HttpException, HttpStatus, Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { DashboardsModule } from './dashboards.module'
import { RavenModule, RavenInterceptor } from 'nest-raven'
import { APP_INTERCEPTOR } from '@nestjs/core'
@Module({
  imports: [DashboardsModule, RavenModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor({
        tags: {
          node_env: process.env.NODE_ENV || 'local', 
          app_type: process.env.APP_TYPE || 'dashboard',
        },
        version: true,
        user: true,
        serverName: true,
        request: true,
        filters: [
          {
            type: HttpException,
            filter: (exception: HttpException) =>
              exception.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR,
          },
        ],
      }),
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
