import { HttpException, HttpStatus, Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { DashboardsModule } from './dashboards.module'
import { RavenModule, RavenInterceptor } from 'nest-raven'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    DashboardsModule,
    RavenModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: function (c: ConfigService) {
        return {
          limit: c.get('THROTTLE_LIMIT', 10),
          ttl: c.get('THROTTLE_TTL', 1),
        }
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor({
        tags: {
          app_env: process.env.APP_ENV,
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
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
  controllers: [AppController],
})
export class AppModule {}
