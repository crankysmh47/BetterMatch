export type Algorithm = 'global' | 'local' | 'optimized' | 'all';

export interface AlignRequest {
  seq_a: string;
  seq_b: string;
  match?: number;
  mismatch?: number;
  gap?: number;
  use_blosum62?: boolean;
}

export interface AlignResult {
  algorithm: string;
  score: number;
  aligned_a: string;
  aligned_b: string;
  operations: string[];
  matches: number;
  mismatches: number;
  gaps: number;
  identity: number;
  seq_a_len: number;
  seq_b_len: number;
  elapsed_ms: number;
  peak_memory_kb: number;
  dp_table?: number[][] | null;
  max_pos?: [number, number] | null;
}

export interface AllResults {
  needleman_wunsch: AlignResult;
  smith_waterman: AlignResult;
  hirschberg: AlignResult;
}

export interface HistoryRecord {
  id: string;
  algorithm: string;
  seq_a: string;
  seq_b: string;
  match_score: number;
  mismatch_penalty: number;
  gap_penalty: number;
  use_blosum62: boolean;
  result_score: number;
  aligned_a: string;
  aligned_b: string;
  identity: number;
  matches: number;
  mismatches: number;
  gaps: number;
  elapsed_ms: number;
  peak_memory_kb: number;
  created_at: string;
}
