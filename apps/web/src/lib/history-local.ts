import type { AlignRequest, AlignResult, HistoryRecord } from '@/types/alignment';

const LS_KEY = 'genalign_history_records_v3';
const MAX_RECORDS = 80;

function parseRecords(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as HistoryRecord[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function persist(records: HistoryRecord[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(records));
}

export function listHistoryRecords(limit = 50): HistoryRecord[] {
  return parseRecords().slice(0, limit);
}

export function appendHistoryRecord(rec: HistoryRecord): void {
  const prev = parseRecords();
  const next = [rec, ...prev.filter((r) => r.id !== rec.id)].slice(0, MAX_RECORDS);
  persist(next);
}

export function deleteHistoryRecord(id: string): boolean {
  const prev = parseRecords();
  const next = prev.filter((r) => r.id !== id);
  if (next.length === prev.length) return false;
  persist(next);
  return true;
}

export function getHistoryRecord(id: string): HistoryRecord | undefined {
  return parseRecords().find((r) => r.id === id);
}

export function historyStats(): {
  total: number;
  by_algorithm: Array<{ algorithm: string; count: number; avg_ms: number }>;
} {
  const recs = parseRecords();
  const acc = new Map<string, { count: number; ms: number }>();
  for (const r of recs) {
    const cur = acc.get(r.algorithm) ?? { count: 0, ms: 0 };
    cur.count += 1;
    cur.ms += r.elapsed_ms;
    acc.set(r.algorithm, cur);
  }
  return {
    total: recs.length,
    by_algorithm: [...acc.entries()].map(([algorithm, v]) => ({
      algorithm,
      count: v.count,
      avg_ms: v.ms / v.count,
    })),
  };
}

export function buildHistoryRecord(
  body: AlignRequest,
  rawSeqA: string,
  rawSeqB: string,
  result: AlignResult,
): HistoryRecord {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    algorithm: result.algorithm,
    seq_a: rawSeqA,
    seq_b: rawSeqB,
    match_score: body.match ?? 1,
    mismatch_penalty: body.mismatch ?? -1,
    gap_penalty: body.gap ?? -2,
    use_blosum62: !!body.use_blosum62,
    mode: body.mode ?? 'dna',
    matrix_name: body.matrix_name ?? null,
    gap_open: body.gap_open ?? null,
    gap_extend: body.gap_extend ?? null,
    banded: !!body.banded,
    bandwidth: body.bandwidth ?? null,
    result_score: result.score,
    aligned_a: result.aligned_a,
    aligned_b: result.aligned_b,
    identity: result.identity,
    matches: result.matches,
    mismatches: result.mismatches,
    gaps: result.gaps,
    elapsed_ms: result.elapsed_ms,
    peak_memory_kb: result.peak_memory_kb,
    created_at: new Date().toISOString(),
  };
}
