import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as cron from 'node-cron';
import { Repository } from 'typeorm';
import { Reading } from './reading.entity';

const REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class PingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PingService.name);
  private task: cron.ScheduledTask | null = null;
  private targets: string[] = [];

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Reading) private readonly readings: Repository<Reading>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.targets = (this.config.get<string>('TARGET_URLS') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (this.targets.length === 0) {
      this.logger.warn('TARGET_URLS is empty — ping service idle');
      return;
    }

    const intervalSeconds = Number(this.config.get('PING_INTERVAL_SECONDS', 60));
    // node-cron supports 6-field expressions (with seconds) as a superset of
    // standard cron. `*/N * * * * *` fires every N seconds.
    const expression = `*/${intervalSeconds} * * * * *`;
    this.task = cron.schedule(expression, () => {
      void this.pingAll();
    });

    this.logger.log(
      `scheduled ${this.targets.length} target(s) every ${intervalSeconds}s (${expression})`,
    );

    // Run once immediately so the DB has data on first boot without waiting.
    await this.pingAll();
  }

  onModuleDestroy(): void {
    this.task?.stop();
  }

  async pingAll(): Promise<void> {
    await Promise.all(this.targets.map((url) => this.pingOne(url)));
  }

  private async pingOne(url: string): Promise<void> {
    const start = Date.now();
    let statusCode = 0;
    try {
      const res = await axios.get(url, {
        timeout: REQUEST_TIMEOUT_MS,
        // Any HTTP response counts — we record 4xx/5xx too. Only network
        // errors / DNS failures / timeouts throw and land as statusCode=0.
        validateStatus: () => true,
        maxRedirects: 5,
      });
      statusCode = res.status;
    } catch (err) {
      this.logger.warn(`ping ${url} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    const latencyMs = Date.now() - start;
    await this.readings.save({ url, statusCode, latencyMs });
    this.logger.log(`${url} → ${statusCode || 'ERR'} in ${latencyMs}ms`);
  }
}
