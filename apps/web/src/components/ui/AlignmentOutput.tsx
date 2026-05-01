'use client';

import { useMemo, useState, useCallback } from 'react';
import type { AlignResult } from '@/types/alignment';
import { dnaBaseTextClass } from '@/lib/dna-colors';
import { useToastStore } from '@/lib/toast-store';

const ALGO_LABELS: Record<string, string> = {
  needleman_wunsch: 'Needleman–Wunsch',
  smith_waterman: 'Smith–Waterman',
  hirschberg: "Hirschberg's",
  gotoh: 'Gotoh (affine gaps)',
  banded_nw: 'Banded NW',
};

interface Props {
  result: AlignResult;
  colourDnaBases?: boolean;
  /** When viewing Hirschberg, optional NW peak memory for “vs NW” hover hint */
  baselineMemoryKb?: number | null;
  /** Full inputs — used for Smith–Waterman context ribbon */
  originalSeqA?: string;
  originalSeqB?: string;
  /** Focus matching character in sequence editors */
  onHighlightSeq?: (p: { seq: 'a' | 'b'; index: number } | null) => void;
}

function alignmentColumnToSeqIndex(aligned: string, column: number): number {
  if (column < 0 || column >= aligned.length) return -1;
  if (aligned[column] === '-') return -1;
  let idx = 0;
  for (let k = 0; k < column; k++) {
    if (aligned[k] !== '-') idx++;
  }
  return idx;
}

function swSpansFromTraceback(
  tb: { i: number; j: number }[] | null | undefined,
): { a0: number; a1: number; b0: number; b1: number } | null {
  if (!tb?.length) return null;
  const is = tb.map((p) => p.i).filter((i) => i > 0);
  const js = tb.map((p) => p.j).filter((j) => j > 0);
  if (!is.length || !js.length) return null;
  return {
    a0: Math.min(...is) - 1,
    a1: Math.max(...is) - 1,
    b0: Math.min(...js) - 1,
    b1: Math.max(...js) - 1,
  };
}

function alignCharClass(ch: string, op: string, colourDnaBases: boolean): string {
  if (ch === '-') return 'text-[color:var(--gap-amber)]';
  if (colourDnaBases && /[ATGCUN]/i.test(ch)) {
    const base = dnaBaseTextClass(ch);
    if (!base) return 'text-slate-300';
    if (op === 'M') return `${base} drop-shadow-[0_0_8px_rgba(27,255,184,0.25)]`;
    if (op === 'X') return `${base} opacity-[0.82]`;
    return `${base} opacity-90`;
  }
  if (op === 'M') return 'text-[color:var(--match-green)]';
  if (op === 'X') return 'text-[color:var(--accent-coral)]';
  return 'text-slate-500';
}

function midGlyph(op: string): string {
  if (op === 'M') return '|';
  if (op === 'X') return ':';
  return ' ';
}

function GapFingerprint({ ops }: { ops: string[] }) {
  let m = 0;
  let x = 0;
  let g = 0;
  for (const o of ops) {
    if (o === 'M') m++;
    else if (o === 'X') x++;
    else g++;
  }
  const total = m + x + g || 1;
  const pct = (n: number) => ((100 * n) / total).toFixed(1);
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">
        Gap / match fingerprint
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-[var(--bg-deep)] border border-[var(--border-dim)]">
        <div
          className="h-full bg-[color:var(--match-green)] transition-[width] duration-300"
          style={{ width: `${(100 * m) / total}%` }}
          title={`Matches: ${m} (${pct(m)}%)`}
        />
        <div
          className="h-full bg-[color:var(--accent-coral)] transition-[width] duration-300"
          style={{ width: `${(100 * x) / total}%` }}
          title={`Mismatches: ${x} (${pct(x)}%)`}
        />
        <div
          className="h-full bg-[color:var(--gap-amber)] transition-[width] duration-300"
          style={{ width: `${(100 * g) / total}%` }}
          title={`Gaps: ${g} (${pct(g)}%)`}
        />
      </div>
      <div className="text-[10px] font-mono text-[var(--text-muted)] flex gap-4 flex-wrap">
        <span className="text-[color:var(--match-green)]">● match {m}</span>
        <span className="text-[color:var(--accent-coral)]">● mismatch {x}</span>
        <span className="text-[color:var(--gap-amber)]">● gap {g}</span>
      </div>
    </div>
  );
}

export default function AlignmentOutput({
  result,
  colourDnaBases = true,
  baselineMemoryKb,
  originalSeqA = '',
  originalSeqB = '',
  onHighlightSeq,
}: Props) {
  const toast = useToastStore((s) => s.push);
  const [wrap, setWrap] = useState(60);

  const identityPct = result.identity_pct ?? result.identity;
  const similarityPct = result.similarity_pct ?? identityPct;
  const gapPctVal = result.gap_pct ?? 0;
  const alen = result.alignment_length ?? result.aligned_a?.length ?? 0;

  const swSpans = useMemo(() => {
    if (!result.algorithm?.includes('smith')) return null;
    return swSpansFromTraceback(result.traceback_path ?? undefined);
  }, [result.algorithm, result.traceback_path]);

  const showSwRibbon =
    Boolean(swSpans) && originalSeqA.length > 0 && originalSeqB.length > 0;

  const chunks = useMemo(() => {
    const alignedA = result.aligned_a;
    const alignedB = result.aligned_b;
    const ops = result.operations;
    const out: { a: string[]; b: string[]; o: string[]; start: number }[] = [];
    for (let i = 0; i < alignedA.length; i += wrap) {
      out.push({
        a: alignedA.slice(i, i + wrap).split(''),
        b: alignedB.slice(i, i + wrap).split(''),
        o: ops.slice(i, i + wrap),
        start: i,
      });
    }
    return out;
  }, [result.aligned_a, result.aligned_b, result.operations, wrap]);

  const copyAlignment = useCallback(async () => {
    const header = `# GenAlign export\n# algorithm: ${result.algorithm}\n# score: ${result.score}\n# ${new Date().toISOString()}\n`;
    const body = `>${ALGO_LABELS[result.algorithm] ?? result.algorithm}\n${result.aligned_a}\n${result.aligned_b}\n`;
    try {
      await navigator.clipboard.writeText(header + body);
      toast({ type: 'success', title: 'Alignment copied!' });
    } catch {
      toast({ type: 'error', title: 'Could not copy', detail: 'Clipboard permission denied.' });
    }
  }, [result, toast]);

  const downloadTxt = useCallback(() => {
    const meta = [
      `algorithm=${result.algorithm}`,
      `score=${result.score}`,
      `identity_pct=${identityPct}`,
      `similarity_pct=${similarityPct}`,
      `gap_pct=${gapPctVal}`,
      `length=${alen}`,
      `date=${new Date().toISOString()}`,
    ].join('\n');
    const body = `${meta}\n\n>A\n${result.aligned_a}\n>B\n${result.aligned_b}\n`;
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alignment_${result.algorithm}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, identityPct, similarityPct, gapPctVal, alen]);

  const onPickChar = useCallback(
    (seq: 'a' | 'b', globalCol: number) => {
      if (!onHighlightSeq) return;
      const aligned = seq === 'a' ? result.aligned_a : result.aligned_b;
      const idx = alignmentColumnToSeqIndex(aligned, globalCol);
      if (idx < 0) {
        onHighlightSeq(null);
        return;
      }
      onHighlightSeq({ seq, index: idx });
    },
    [onHighlightSeq, result.aligned_a, result.aligned_b],
  );

  const memTitle =
    baselineMemoryKb != null && Number.isFinite(baselineMemoryKb)
      ? `vs Needleman–Wunsch (${baselineMemoryKb} KB full DP auxiliary)`
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <MetricCard
          label="Alignment score"
          value={result.score}
          fraunces
          emphasis
        />
        <MetricCard label="Identity %" value={`${Number(identityPct).toFixed(1)}%`} />
        <MetricCard label="Similarity %" value={`${Number(similarityPct).toFixed(1)}%`} />
        <MetricCard label="Gap %" value={`${Number(gapPctVal).toFixed(1)}%`} />
        <MetricCard label="Length" value={`${alen} bp`} subtle />
        <MetricCard label="Time" value={`${result.elapsed_ms} ms`} amber />
        <MetricCard
          label="Memory"
          value={`${result.peak_memory_kb} KB`}
          title={memTitle}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-dim)] pb-4">
        <div>
          <h3 className="font-bold text-lg text-[var(--text-primary)] font-[var(--font-display)] italic">
            {ALGO_LABELS[result.algorithm] ?? result.algorithm}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {result.seq_a_len} bp × {result.seq_b_len} bp
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
            Wrap
            <input
              type="number"
              min={30}
              max={120}
              step={10}
              value={wrap}
              onChange={(e) => setWrap(Math.max(30, Math.min(120, Number(e.target.value) || 60)))}
              className="w-16 rounded-md bg-[var(--bg-deep)] border border-[var(--border-dim)] px-2 py-1 text-[var(--text-primary)]"
            />
          </label>
          <button
            type="button"
            onClick={() => void copyAlignment()}
            className="text-xs px-3 py-2 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-card)] text-[var(--accent-teal)] hover:border-[var(--accent-teal)]/35 duration-150"
          >
            Copy alignment
          </button>
          <button
            type="button"
            onClick={downloadTxt}
            className="text-xs px-3 py-2 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--accent-teal)]/35 duration-150"
          >
            Download .txt
          </button>
        </div>
      </div>

      {showSwRibbon && swSpans && (
        <div className="rounded-xl border border-[var(--border-dim)] bg-[var(--bg-deep)] p-3 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--accent-teal)]">
            Smith–Waterman · original sequence context
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-mono">
            Segment A[{swSpans.a0}…{swSpans.a1}] · B[{swSpans.b0}…{swSpans.b1}] — positions outside the traceback span are dimmed.
          </p>
          <div className="font-mono text-xs leading-relaxed break-all space-y-1">
            <div>
              {originalSeqA.split('').map((ch, i) => (
                <span
                  key={`sa-${i}`}
                  className={
                    i >= swSpans.a0 && i <= swSpans.a1 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] opacity-45'
                  }
                >
                  {ch}
                </span>
              ))}
            </div>
            <div>
              {originalSeqB.split('').map((ch, i) => (
                <span
                  key={`sb-${i}`}
                  className={
                    i >= swSpans.b0 && i <= swSpans.b1 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] opacity-45'
                  }
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <GapFingerprint ops={result.operations} />

      <div className="space-y-4 font-mono text-sm overflow-x-auto">
        {chunks.map((chunk, ci) => (
          <div
            key={ci}
            className="rounded-xl p-4 border border-[var(--border-dim)] bg-[var(--bg-card)]"
          >
            <div className="flex">
              <span className="text-[var(--text-muted)] w-10 shrink-0 tabular-nums">{chunk.start + 1}</span>
              <span className="break-all">
                {chunk.a.map((ch, i) => {
                  const gi = chunk.start + i;
                  return (
                    <button
                      key={`a-${gi}`}
                      type="button"
                      tabIndex={0}
                      onClick={() => onPickChar('a', gi)}
                      className={`inline min-w-[0.65ch] px-0 font-mono bg-transparent border-0 cursor-pointer text-left ${alignCharClass(ch, chunk.o[i], colourDnaBases)}`}
                    >
                      {ch}
                    </button>
                  );
                })}
              </span>
            </div>
            <div className="flex">
              <span className="w-10 shrink-0" />
              <span className="text-[var(--text-muted)] break-all tracking-tighter">
                {chunk.o.map((op, mi) => (
                  <span key={mi} className="inline-block min-w-[0.65ch] text-center">
                    {midGlyph(op)}
                  </span>
                ))}
              </span>
            </div>
            <div className="flex">
              <span className="text-[var(--text-muted)] w-10 shrink-0 tabular-nums">{chunk.start + 1}</span>
              <span className="break-all">
                {chunk.b.map((ch, i) => {
                  const gi = chunk.start + i;
                  return (
                    <button
                      key={`b-${gi}`}
                      type="button"
                      tabIndex={0}
                      onClick={() => onPickChar('b', gi)}
                      className={`inline min-w-[0.65ch] px-0 font-mono bg-transparent border-0 cursor-pointer text-left ${alignCharClass(ch, chunk.o[i], colourDnaBases)}`}
                    >
                      {ch}
                    </button>
                  );
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-6 text-xs flex-wrap font-mono text-[var(--text-muted)]">
        <span className="text-[color:var(--match-green)]">| match</span>
        <span className="text-[color:var(--accent-coral)]">: mismatch</span>
        <span className="text-[color:var(--gap-amber)]">space gap</span>
        {colourDnaBases && <span>DNA bases use token colours when aligned</span>}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  emphasis,
  fraunces,
  amber,
  subtle,
  title,
}: {
  label: string;
  value: string | number;
  emphasis?: boolean;
  fraunces?: boolean;
  amber?: boolean;
  subtle?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={`rounded-xl px-4 py-3 min-w-[112px] border flex-1 sm:flex-none ${
        emphasis
          ? 'border-[var(--accent-teal)]/25 bg-[var(--accent-teal)]/8'
          : subtle
            ? 'border-[var(--border-dim)] bg-[var(--bg-deep)] opacity-95'
            : 'border-[var(--border-dim)] bg-[var(--bg-card)]'
      }`}
    >
      <div
        className={`text-xl font-bold tabular-nums tracking-tight ${
          fraunces ? 'font-[var(--font-display)] italic text-[var(--accent-teal)]' : ''
        } ${amber ? 'text-[color:var(--accent-amber)]' : 'text-[var(--text-primary)]'} ${emphasis && !fraunces ? 'text-[var(--accent-teal)]' : ''}`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mt-1">{label}</div>
    </div>
  );
}
