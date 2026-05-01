export type Algorithm = 'global' | 'local' | 'optimized' | 'gotoh' | 'all';

export interface AlignRequest {
  seq_a: string;
  seq_b: string;
  algorithm?: string;
  match?: number;
  mismatch?: number;
  gap?: number;
  use_blosum62?: boolean;
  mode?: 'dna' | 'protein';
  matrix_name?: 'BLOSUM62' | 'BLOSUM45' | 'BLOSUM80' | 'PAM250';
  gap_open?: number;
  gap_extend?: number;
  banded?: boolean;
  bandwidth?: number;
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
  identity_pct?: number;
  similarity_pct?: number;
  gap_pct?: number;
  alignment_length?: number;
  seq_a_len: number;
  seq_b_len: number;
  elapsed_ms: number;
  peak_memory_kb: number;
  summary?: string;
  dp_table?: number[][] | null;
  dp_active_region?: boolean[][] | null;
  max_pos?: [number, number] | null;
  traceback_path?: { i: number; j: number }[] | null;
  predecessor?: (string | null)[][] | null;
  recursion_tree?: Record<string, unknown> | null;
  M_matrix?: number[][] | null;
  Ix_matrix?: number[][] | null;
  Iy_matrix?: number[][] | null;
  band_exceeded?: boolean;
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
  mode?: string;
  matrix_name?: string | null;
  gap_open?: number | null;
  gap_extend?: number | null;
  banded?: boolean;
  bandwidth?: number | null;
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
