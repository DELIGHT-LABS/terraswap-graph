import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/.env` })

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import { initORM } from 'orm'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { RewriteFrames } from '@sentry/integrations'
import * as Sentry from '@sentry/node'

function buildDocs(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Terraswap Dashboard')
    .setDescription('Terraswap Dashboard API description')
    .setVersion('1.0')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('/api', app, document)
}

function initSentry(app: INestApplication, dsn: string) {
  Sentry.init({
    dsn,
    environment: process.env.APP_ENV,
    logLevel: 1,
    release: process.env.GIT_COMMIT_HASH,
    integrations: [
      new RewriteFrames({
        root: process.cwd(),
      }),
    ],
  })
}

async function bootstrap() {
  await initORM()
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())

  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  if (process.env.OPEN_API === 'true') {
    buildDocs(app)
  }

  if (process.env.SENTRY_DSN) {
    initSentry(app, process.env.SENTRY_DSN)
  }
  await app.listen(process.env.SERVER_PORT || 3000, '0.0.0.0')
}

bootstrap()
