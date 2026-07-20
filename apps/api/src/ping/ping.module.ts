import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PingService } from './ping.service';
import { Reading } from './reading.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reading])],
  providers: [PingService],
  exports: [PingService, TypeOrmModule],
})
export class PingModule {}
