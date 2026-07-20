import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { PingModule } from './ping/ping.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // sql.js is a pure-JS SQLite port — zero native compile, works on any
        // Node runtime. Runs in memory; `location` is the file it auto-loads
        // from at boot and auto-saves to on every write.
        type: 'sqljs',
        location: config.get<string>('DATABASE_PATH', 'data/api-monitor.sqlite'),
        autoSave: true,
        autoLoadEntities: true,
        // synchronize is fine for local dev / SQLite. In prod (Postgres), use
        // proper migrations instead.
        synchronize: true,
      }),
    }),
    PingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
