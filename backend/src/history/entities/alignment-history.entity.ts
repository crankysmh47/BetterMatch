import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('alignment_history')
export class AlignmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  algorithm: string;

  @Column('text')
  seq_a: string;

  @Column('text')
  seq_b: string;

  @Column()
  match_score: number;

  @Column()
  mismatch_penalty: number;

  @Column()
  gap_penalty: number;

  @Column({ default: false })
  use_blosum62: boolean;

  @Column()
  result_score: number;

  @Column('text')
  aligned_a: string;

  @Column('text')
  aligned_b: string;

  @Column('float')
  identity: number;

  @Column()
  matches: number;

  @Column()
  mismatches: number;

  @Column()
  gaps: number;

  @Column('float')
  elapsed_ms: number;

  @Column('float')
  peak_memory_kb: number;

  @CreateDateColumn()
  created_at: Date;
}
