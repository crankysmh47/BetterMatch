'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Algorithm, HistoryRecord } from '@/types/alignment';

export type HistoryRestorePayload = {
  seqA: string;
  seqB: string;
  algo: Exclude<Algorithm, 'all'>;
  match: number;
  mismatch: number;
  gap: number;
  useBlosum: boolean;
  mode: 'dna' | 'protein';
  matrixName: 'BLOSUM62' | 'BLOSUM45' | 'BLOSUM80' | 'PAM250';
  gapOpen: number;
  gapExtend: number;
  banded: boolean;
  bandwidth: number;
};

function algoFromRecord(rec: HistoryRecord): Exclude<Algorithm, 'all'> {
  const a = rec.algorithm;
  if (a === 'smith_waterman') return 'local';
  if (a === 'hirschberg') return 'optimized';
  if (a === 'gotoh' || a === 'gotoh_affine') return 'gotoh';
  if (a === 'banded_nw') return 'global';
  return 'global';
}

function recordToPayload(rec: HistoryRecord): HistoryRestorePayload {
  const mtx = (rec.matrix_name ?? 'BLOSUM62') as HistoryRestorePayload['matrixName'];
  return {
    seqA: rec.seq_a,
    seqB: rec.seq_b,
    algo: algoFromRecord(rec),
    match: rec.match_score,
    mismatch: rec.mismatch_penalty,
    gap: rec.gap_penalty,
    useBlosum: rec.use_blosum62,
    mode: rec.mode === 'protein' ? 'protein' : 'dna',
    matrixName: ['BLOSUM62', 'BLOSUM45', 'BLOSUM80', 'PAM250'].includes(mtx) ? mtx : 'BLOSUM62',
    gapOpen: rec.gap_open ?? -2,
    gapExtend: rec.gap_extend ?? -0.5,
    banded: !!(rec.banded || rec.algorithm === 'banded_nw'),
    bandwidth: rec.bandwidth ?? 50,
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  onRestore: (p: HistoryRestorePayload) => void;
};

export default function AlignHistoryDrawer({ open, onClose, onRestore }: Props) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const recs = await api.getHistory(40);
      setRecords(recs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const apply = (p: HistoryRestorePayload) => {
    onRestore(p);
    onClose();
  };

  const fmtShort = (s: string, n = 28) => (s.length <= n ? s : `${s.slice(0, n)}…`);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-label="Close history" onClick={onClose} />
      <aside className="relative h-full w-full max-w-md border-l border-[var(--border-dim)] bg-[var(--bg-deep)] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-dim)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Alignment history</h2>
          <button type="button" onClick={onClose} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg border border-transparent hover:border-[var(--border-dim)]">
            Close
          </button>
        </div>
        <p className="px-4 pt-3 text-[11px] text-[var(--text-muted)] font-mono leading-relaxed">
          Stored in this browser only. Deploy Supabase later if you need sync’d accounts.
        </p>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading &&
            records.map((rec) => (
              <div key={rec.id} className="rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] p-3 space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-xs font-mono text-[var(--accent-amber)]">{rec.algorithm}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{new Date(rec.created_at).toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-mono leading-snug">
                  A {fmtShort(rec.seq_a)} · B {fmtShort(rec.seq_b)}
                </p>
                <button
                  type="button"
                  onClick={() => apply(recordToPayload(rec))}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-teal)]/15 text-[var(--accent-teal)] border border-[var(--accent-teal)]/30 hover:bg-[var(--accent-teal)]/25"
                >
                  Restore inputs &amp; settings
                </button>
              </div>
            ))}
          {!loading && !records.length && !error && (
            <p className="text-sm text-[var(--text-muted)]">No runs yet. Complete an alignment to save one here.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
