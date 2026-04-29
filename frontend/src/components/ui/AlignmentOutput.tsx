'use client';

import type { AlignResult } from '@/types/alignment';

const ALGO_LABELS: Record<string, string> = {
  needleman_wunsch: 'Needleman-Wunsch',
  smith_waterman:   'Smith-Waterman',
  hirschberg:       "Hirschberg's",
};

interface Props {
  result: AlignResult;
}

function ColoredAlignment({ alignedA, alignedB, ops }: { alignedA: string; alignedB: string; ops: string[] }) {
  const CHUNK = 60;
  const chunks: { a: string[]; b: string[]; o: string[] }[] = [];
  for (let i = 0; i < alignedA.length; i += CHUNK) {
    chunks.push({
      a: alignedA.slice(i, i + CHUNK).split(''),
      b: alignedB.slice(i, i + CHUNK).split(''),
      o: ops.slice(i, i + CHUNK),
    });
  }

  const charClass = (op: string) => {
    if (op === 'M') return 'text-emerald-400';
    if (op === 'X') return 'text-orange-400';
    return 'text-slate-500';
  };

  const midChar = (op: string) => {
    if (op === 'M') return '|';
    if (op === 'X') return '·';
    return ' ';
  };

  return (
    <div className="space-y-4 font-mono text-sm overflow-x-auto">
      {chunks.map((chunk, ci) => (
        <div key={ci} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="flex">
            <span className="text-slate-500 w-8 shrink-0">{ci * CHUNK + 1}</span>
            <span className="text-sky-300">
              {chunk.a.map((ch, i) => (
                <span key={i} className={charClass(chunk.o[i])}>{ch}</span>
              ))}
            </span>
          </div>
          <div className="flex">
            <span className="w-8 shrink-0" />
            <span className="text-slate-500">
              {chunk.o.map((op, i) => (
                <span key={i} className={charClass(op)}>{midChar(op)}</span>
              ))}
            </span>
          </div>
          <div className="flex">
            <span className="text-slate-500 w-8 shrink-0">{ci * CHUNK + 1}</span>
            <span>
              {chunk.b.map((ch, i) => (
                <span key={i} className={charClass(chunk.o[i])}>{ch}</span>
              ))}
            </span>
          </div>
        </div>
      ))}
      <div className="flex gap-6 text-xs flex-wrap">
        <span className="text-emerald-400 flex items-center gap-1">■ Match</span>
        <span className="text-orange-400 flex items-center gap-1">■ Mismatch</span>
        <span className="text-slate-500 flex items-center gap-1">■ Gap</span>
      </div>
    </div>
  );
}

export default function AlignmentOutput({ result }: Props) {
  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-100">
            {ALGO_LABELS[result.algorithm] ?? result.algorithm}
          </h3>
          <p className="text-sm text-slate-500">
            {result.seq_a_len} bp × {result.seq_b_len} bp
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Stat label="Score"    value={result.score}                      highlight />
          <Stat label="Identity" value={`${result.identity}%`}            />
          <Stat label="Matches"  value={result.matches}  color="emerald"  />
          <Stat label="Mismatches" value={result.mismatches} color="orange" />
          <Stat label="Gaps"     value={result.gaps}     color="slate"    />
          <Stat label="Time"     value={`${result.elapsed_ms} ms`}        />
          <Stat label="Memory"   value={`${result.peak_memory_kb} KB`}    />
        </div>
      </div>

      {/* Alignment */}
      <ColoredAlignment
        alignedA={result.aligned_a}
        alignedB={result.aligned_b}
        ops={result.operations}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
  color = 'sky',
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    sky:     'text-sky-400',
    emerald: 'text-emerald-400',
    orange:  'text-orange-400',
    slate:   'text-slate-400',
  };
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${highlight ? 'bg-sky-500/10 border border-sky-500/20' : 'bg-slate-800'}`}>
      <div className={`text-lg font-bold ${highlight ? 'text-sky-400' : colorMap[color] ?? 'text-slate-300'}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
