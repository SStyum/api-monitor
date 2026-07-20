import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'readings' })
@Index(['url', 'timestamp'])
export class Reading {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  url!: string;

  // 0 = network error / timeout / DNS failure (no HTTP response received).
  @Column({ type: 'int' })
  statusCode!: number;

  @Column({ type: 'int' })
  latencyMs!: number;

  @CreateDateColumn()
  timestamp!: Date;
}
