import 'reflect-metadata';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  // sql.js autoSave writes to disk on every mutation, so the target directory
  // must exist before Nest boots the TypeORM connection.
  const dbPath = process.env.DATABASE_PATH ?? 'data/api-monitor.sqlite';
  await mkdir(dirname(resolve(dbPath)), { recursive: true });

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });

  const config = app.get(ConfigService);
  const port = config.get<number>('API_PORT', 3000);
  await app.listen(port);
  console.log(`[api] listening on http://localhost:${port}`);
}

bootstrap();
