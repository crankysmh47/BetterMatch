'use client';

import Link from 'next/link';
import { useMemo, useState, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { api } from '@/lib/api';
import type { AlignResult } from '@/types/alignment';
import { useToastStore } from '@/lib/toast-store';

function KatexBlock({ tex }: { tex: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: true });
    } catch {
      return tex;
    }
  }, [tex]);
  return (
    <div
      className="overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg-deep)_92%,transparent)] px-3 py-3 text-[var(--text-primary)] [&_.katex]:text-[0.92em]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

type DemoKind = 'nw' | 'sw' | 'hirschberg' | 'gotoh' | 'banded';

/** Match home `page.tsx` section + algorithm card headings */
const sectionHeading =
  'border-b border-[var(--card-border)] pb-2 font-mono text-xl font-semibold uppercase tracking-widest text-[var(--heading-cheer)]';

/** Same cheer + rule as section blocks, without uppercase (long diagram titles). */
const diagramHeading =
  'border-b border-[var(--card-border)] pb-2 font-mono text-base font-semibold tracking-wide text-[var(--heading-cheer)] sm:text-lg';

const pageTitle =
  'border-b border-[var(--card-border)] pb-3 font-mono text-2xl font-semibold uppercase tracking-widest text-[var(--heading-accent)] sm:text-3xl';

const algoCardTitle =
  'text-lg font-bold text-[color-mix(in_srgb,var(--accent-mint)_88%,var(--accent-lime))]';

/** Same glass panel treatment as home hero (`page.tsx` heroPanel). */
const introPanel =
  'rounded-3xl border border-[color-mix(in_srgb,var(--card-border)_50%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_52%,transparent)] px-6 py-8 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:px-10 sm:py-10';

const introBodyShadow =
  '[text-shadow:0_1px_2px_rgba(0,0,0,0.55),0_0_14px_rgba(12,28,22,0.35)]';

const algoCardShell =
  'rounded-2xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_92%,transparent)] shadow-[inset_0_1px_0_var(--card-shine)] backdrop-blur-sm';

const demoTagClass: Record<DemoKind, string> = {
  nw: 'text-[var(--accent-mint)] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-rose)_12%,transparent)]',
  sw: 'text-[var(--accent-teal)] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-green)_10%,transparent)]',
  hirschberg:
    'text-[var(--accent-lime)] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-amber)_10%,transparent)]',
  gotoh: 'text-[var(--accent-mint)] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-rose)_12%,transparent)]',
  banded:
    'text-[var(--accent-lime)] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-amber)_10%,transparent)]',
};

function MiniAlignDemo({ kind, title }: { kind: DemoKind; title: string }) {
  const toast = useToastStore((s) => s.push);
  const [a, setA] = useState('GATTACA');
  const [b, setB] = useState('GCATGCU');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<AlignResult | null>(null);

  const run = useCallback(async () => {
    const seq_a = a.replace(/\s+/g, '').toUpperCase();
    const seq_b = b.replace(/\s+/g, '').toUpperCase();
    if (!seq_a.length || !seq_b.length) {
      setErr('Both sequences must be non-empty.');
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const base = {
        seq_a,
        seq_b,
        match: 1,
        mismatch: -1,
        gap: -2,
        mode: 'dna' as const,
      };
      let r: AlignResult;
      if (kind === 'nw') r = await api.alignGlobal({ ...base, banded: false });
      else if (kind === 'sw') r = await api.alignLocal(base);
      else if (kind === 'hirschberg') r = await api.alignOptimized({ ...base, banded: false });
      else if (kind === 'gotoh')
        r = await api.alignGotoh({ ...base, gap_open: -2, gap_extend: -0.5 });
      else r = await api.alignGlobal({ ...base, banded: true, bandwidth: 50 });
      setRes(r);
      if (r.band_exceeded) {
        toast({
          type: 'info',
          title: 'Band exceeded',
          detail: 'Fell back to full DP for this pair.',
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Alignment failed';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, [a, b, kind, toast]);

  return (
    <div className={`${algoCardShell} space-y-3 rounded-xl p-4`}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent-lime)]">{title}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block space-y-1 text-xs text-[var(--text-secondary)]">
          Seq A
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="w-full rounded-lg bg-[var(--bg-card)] border border-[var(--border-dim)] px-2 py-1.5 font-mono text-xs text-[var(--text-primary)]"
          />
        </label>
        <label className="block space-y-1 text-xs text-[var(--text-secondary)]">
          Seq B
          <input
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="w-full rounded-lg bg-[var(--bg-card)] border border-[var(--border-dim)] px-2 py-1.5 font-mono text-xs text-[var(--text-primary)]"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void run()}
        className="text-xs px-3 py-2 rounded-lg bg-[var(--accent-teal)]/15 text-[var(--accent-teal)] border border-[var(--border-dim)] disabled:opacity-40 font-mono"
      >
        {loading ? 'Running…' : 'Run'}
      </button>
      {err && <p className="text-[11px] text-[color:var(--accent-coral)] font-mono">{err}</p>}
      {res && (
        <div className="space-y-1 border-t border-[var(--card-border)] pt-3 font-mono text-[11px] text-[var(--text-secondary)]">
          <div>
            Score <span className="text-[var(--accent-teal)] tabular-nums">{res.score}</span> ·{' '}
            {res.elapsed_ms.toFixed(2)} ms · {res.peak_memory_kb} KB
          </div>
          <pre className="whitespace-pre-wrap break-all text-[var(--text-primary)] leading-relaxed bg-[var(--bg-card)]/80 rounded-lg p-2 border border-[var(--border-dim)]">
            {res.aligned_a}
            {'\n'}
            {res.aligned_b}
          </pre>
        </div>
      )}
    </div>
  );
}

const cards: {
  name: string;
  authors: string;
  year: number;
  type: string;
  time: string;
  space: string;
  tex: string;
  paragraphs: string[];
  demo: DemoKind;
}[] = [
  {
    name: 'Needleman–Wunsch',
    authors: 'Saul B. Needleman & Christian D. Wunsch',
    year: 1970,
    type: 'Global',
    time: 'O(m n)',
    space: 'O(m n)',
    tex: String.raw`M_{i,j} = \max \begin{cases} M_{i-1,j-1} + s(a_i,b_j) \\ M_{i-1,j} + g \\ M_{i,j-1} + g \end{cases}`,
    paragraphs: [
      'Needleman–Wunsch solves global pairwise alignment: every residue of both sequences is aligned to either a partner or a gap, so the score reflects how well the strings align end-to-end.',
      'It builds on the same optimal-substructure idea as edit distance, but uses substitution scores and an explicit gap penalty instead of unit insert/delete costs.',
      'The algorithm fills an (m+1)×(n+1) table and traces back from the bottom-right corner to the origin; ties in the recurrence can yield multiple optimal alignments.',
      'It remains the standard baseline for full-length DNA or protein comparison when you believe homology spans essentially the whole sequences.',
    ],
    demo: 'nw',
  },
  {
    name: 'Smith–Waterman',
    authors: 'Temple F. Smith & Michael S. Waterman',
    year: 1981,
    type: 'Local',
    time: 'O(m n)',
    space: 'O(m n)',
    tex: String.raw`M_{i,j} = \max\left\{ 0,\; M_{i-1,j-1} + s(a_i,b_j),\; M_{i-1,j} + g,\; M_{i,j-1} + g \right\}`,
    paragraphs: [
      'Smith–Waterman finds the highest-scoring local segment: any prefix or suffix may be ignored, which suits motifs, repeats, or partially homologous regions.',
      'Resetting cells to zero prevents negative-running scores from dragging the optimum toward unrelated flanking sequence.',
      'Traceback starts from the maximum cell and stops when the score hits zero, producing an alignment embedded inside longer sequences.',
      'Local alignment is widely used in database search because biologically meaningful similarity often occupies only part of each sequence.',
    ],
    demo: 'sw',
  },
  {
    name: "Hirschberg's algorithm",
    authors: 'David S. Hirschberg',
    year: 1975,
    type: 'Global (linear space)',
    time: 'O(m n)',
    space: 'O(\min(m,n)) auxiliary',
    tex: String.raw`\text{Let mid split } A;\text{ compute last rows of forward and reverse NW to find split column } c.\text{ Recurse on } (A_{1..i}, B_{1..c}) \text{ and } (A_{i+1..m}, B_{c+1..n}).`,
    paragraphs: [
      "Hirschberg's method computes the same optimal global score as Needleman–Wunsch without storing the full DP table.",
      'It recursively bisects one sequence, finds the crossing column that belongs to an optimal path using two linear-space forward/backward passes, then aligns the left and right halves independently.',
      'Asymptotic time remains quadratic in sequence length, but memory drops to linear in the shorter dimension—critical for very long chromosomal-scale comparisons.',
      'Alignment strings may differ from NW when ties are broken differently, but optimal scores match under identical scoring.',
    ],
    demo: 'hirschberg',
  },
  {
    name: 'Gotoh (affine gaps)',
    authors: 'Osamu Gotoh',
    year: 1982,
    type: 'Global (affine gaps)',
    time: 'O(m n)',
    space: 'O(m n) × 3 states',
    tex: String.raw`\begin{aligned} M_{i,j} &= \max\{ M_{i-1,j-1}+s,\; I^x_{i-1,j-1}+s,\; I^y_{i-1,j-1}+s \} \\ I^x_{i,j} &= \max\{ M_{i-1,j}+g_o,\; I^x_{i-1,j}+g_e \} \\ I^y_{i,j} &= \max\{ M_{i,j-1}+g_o,\; I^y_{i,j-1}+g_e \} \end{aligned}`,
    paragraphs: [
      'Affine gaps charge a larger penalty to open a gap than to extend it, favouring long indels over many single-residue gaps.',
      'Three matrices (match state M, gap-in-B state I^x, gap-in-A state I^y) encode whether the alignment ends in a match column or inside a gap run.',
      'Biologically, this matches many insertion–deletion processes better than a single linear gap cost per residue.',
      'Gotoh remains the workhorse for protein alignment when BLOSUM/PAM scores pair with gap-open and gap-extend parameters.',
    ],
    demo: 'gotoh',
  },
  {
    name: 'Banded Needleman–Wunsch',
    authors: 'Band-limited DP (e.g. Chao et al.; Uri Hasson)',
    year: 1992,
    type: 'Global (banded)',
    time: 'O(k \cdot \min(m,n)) typical',
    space: 'O(k \cdot \min(m,n))',
    tex: String.raw`|i-j| \le k \;\Rightarrow\; \text{only DP cells within diagonal band } k \text{ are evaluated; outside } {-}\infty.`,
    paragraphs: [
      'When two sequences are known to be similar, scores contributing to the optimum stay near the main diagonal of the DP table.',
      'Banded NW restricts computation to a stripe of half-width k around that diagonal, reducing both time and memory roughly by n/k when k ≪ n.',
      'If the true alignment leaves the band (dissimilar sequences or bad k), implementations fall back to full NW so correctness is preserved.',
      'This variant is standard in read mappers and greedy pipelines where divergence from a reference is bounded.',
    ],
    demo: 'banded',
  },
];

function LineageSvg() {
  const nodes: { id: string; x: number; y: number; w: number; h: number; label: string }[] = [
    { id: 'lcs', x: 40, y: 28, w: 120, h: 44, label: 'LCS' },
    { id: 'ed', x: 220, y: 28, w: 140, h: 44, label: 'Edit distance' },
    { id: 'nw', x: 420, y: 28, w: 150, h: 44, label: 'Needleman–Wunsch' },
    { id: 'sw', x: 220, y: 140, w: 130, h: 44, label: 'Smith–Waterman' },
    { id: 'hi', x: 390, y: 140, w: 140, h: 44, label: 'Hirschberg' },
    { id: 'go', x: 560, y: 140, w: 110, h: 44, label: 'Gotoh' },
    { id: 'bn', x: 560, y: 252, w: 130, h: 44, label: 'Banded NW' },
  ];

  const cx = (n: (typeof nodes)[0]) => n.x + n.w / 2;
  const cy = (n: (typeof nodes)[0]) => n.y + n.h / 2;

  const arrow = (from: (typeof nodes)[0], to: (typeof nodes)[0]) => (
    <line
      key={`${from.id}-${to.id}`}
      x1={cx(from)}
      y1={from.y + from.h}
      x2={cx(to)}
      y2={to.y}
      stroke="rgba(27,255,184,0.45)"
      strokeWidth={2}
      markerEnd="url(#arrowhead)"
    />
  );

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<string, (typeof nodes)[0]>;

  return (
    <section className={`${algoCardShell} space-y-4 rounded-2xl p-6`}>
      <h2 className={`max-w-4xl ${diagramHeading}`}>
        Lineage: LCS → edit distance → pairwise alignment
      </h2>
      <p className="max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
        Longest Common Subsequence ignores mismatches cost structure; converting to edit distance adds substitution costs. Pairwise biological alignment
        generalises further with scoring matrices and affine gaps. The diagram is schematic—many textbook derivations show NW as the score-maximising
        analogue of edit distance on sequences.
      </p>
      <div className="overflow-x-auto rounded-xl border border-[var(--border-dim)] bg-[var(--bg-deep)] p-4">
        <svg width={720} height={320} viewBox="0 0 720 320" className="min-w-[640px]" aria-label="Algorithm lineage diagram">
          <defs>
            <marker id="arrowhead" markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto">
              <polygon points="0 0, 8 4, 0 8" fill="rgba(27,255,184,0.6)" />
            </marker>
          </defs>
          <line x1={cx(byId.lcs)} y1={byId.lcs.y + byId.lcs.h} x2={cx(byId.ed)} y2={byId.ed.y} stroke="rgba(27,255,184,0.35)" strokeWidth={2} markerEnd="url(#arrowhead)" />
          <line x1={cx(byId.ed)} y1={byId.ed.y + byId.ed.h} x2={cx(byId.nw)} y2={byId.nw.y} stroke="rgba(27,255,184,0.35)" strokeWidth={2} markerEnd="url(#arrowhead)" />
          {arrow(byId.nw, byId.sw)}
          {arrow(byId.nw, byId.hi)}
          {arrow(byId.nw, byId.go)}
          {arrow(byId.nw, byId.bn)}
          {nodes.map((n) => (
            <g key={n.id}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} fill="rgba(17,32,56,0.95)" stroke="rgba(27,255,184,0.35)" strokeWidth={1.5} />
              <text x={cx(n)} y={cy(n) + 5} textAnchor="middle" fill="#E8F5F0" fontSize={13} fontFamily="var(--font-mono), IBM Plex Mono, monospace">
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

const comparisonRows = [
  {
    algo: 'NW',
    type: 'Global',
    gap: 'Linear',
    space: 'O(m n)',
    time: 'O(m n)',
    best: 'Full-length homologs',
    worst: 'Very long sequences on low memory',
  },
  {
    algo: 'SW',
    type: 'Local',
    gap: 'Linear',
    space: 'O(m n)',
    time: 'O(m n)',
    best: 'Motifs, partial homology',
    worst: 'Needs careful gap tuning for domain joins',
  },
  {
    algo: 'Hirschberg',
    type: 'Global',
    gap: 'Linear',
    space: 'O(min(m,n)) aux.',
    time: 'O(m n)',
    best: 'Large genomes, memory-bound',
    worst: 'Still quadratic time; harder to visualise DP',
  },
  {
    algo: 'Gotoh',
    type: 'Global',
    gap: 'Affine',
    space: 'O(m n)',
    time: 'O(m n)',
    best: 'Proteins, long indels',
    worst: 'Extra parameters; three matrices',
  },
  {
    algo: 'Banded NW',
    type: 'Global',
    gap: 'Linear (in band)',
    space: 'O(k·min)',
    time: 'O(k·min) typical',
    best: 'Reads vs reference, similar strains',
    worst: 'Divergent sequences; wrong k loses optimum',
  },
];

export default function AlgorithmsExplainer() {
  return (
    <div className="space-y-12">
      <header className={`${introPanel} space-y-5`}>
        <h1 className={pageTitle}>Algorithms</h1>
        <p
          className={`max-w-2xl text-pretty text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base ${introBodyShadow}`}
        >
          Publication context, recurrence relations (KaTeX), complexity, and a toy runner per implementation. These mirror the modes available on the Align
          page.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
          <Link
            href="/align"
            className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-teal)_22%,transparent)] px-5 py-2.5 text-center text-sm font-semibold text-[var(--accent-teal)] shadow-[inset_0_1px_0_var(--card-shine)] transition-colors duration-150 hover:border-[color-mix(in_srgb,var(--accent-teal)_45%,var(--card-border))] sm:min-w-[11rem] sm:flex-none"
          >
            Open Align tool
          </Link>
          <Link
            href="/benchmark"
            className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_78%,transparent)] px-5 py-2.5 text-center text-sm font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_var(--card-shine)] transition-colors duration-150 hover:border-[color-mix(in_srgb,var(--accent-teal)_35%,var(--card-border))] sm:min-w-[11rem] sm:flex-none"
          >
            Benchmarks & complexity
          </Link>
        </div>
      </header>

      <LineageSvg />

      <section className="grid gap-6 lg:grid-cols-2">
        {cards.map((c) => (
          <article key={c.name} className={`${algoCardShell} flex flex-col space-y-4 rounded-2xl p-6`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className={algoCardTitle}>{c.name}</h2>
                <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">{c.authors}</p>
              </div>
              <span
                className={`shrink-0 rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${demoTagClass[c.demo]}`}
              >
                {c.type}
              </span>
            </div>
            <div className="space-y-2">
              {c.paragraphs.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {p}
                </p>
              ))}
            </div>
            <KatexBlock tex={c.tex} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg-deep)_88%,transparent)] p-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--accent-teal)]">Time</div>
                <div className="font-mono text-[var(--text-primary)] mt-1">{c.time}</div>
              </div>
              <div className="rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg-deep)_88%,transparent)] p-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--accent-teal)]">Space</div>
                <div className="font-mono text-[var(--text-primary)] mt-1">{c.space}</div>
              </div>
            </div>
            <div className="font-mono text-[11px] text-[var(--text-secondary)]">Journal landmark · {c.year}</div>
            <MiniAlignDemo kind={c.demo} title={`Try · ${c.name}`} />
          </article>
        ))}
      </section>

      <section className={`${algoCardShell} overflow-x-auto rounded-2xl p-6`}>
        <h2 className={`${sectionHeading} mb-4`}>Comparison</h2>
        <table className="w-full text-sm border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-[var(--card-border)] text-left">
              <th className="px-3 py-3 font-mono text-[10px] uppercase text-[var(--accent-teal)]">Algorithm</th>
              <th className="px-3 py-3 font-mono text-[10px] uppercase text-[var(--text-secondary)]">Type</th>
              <th className="px-3 py-3 font-mono text-[10px] uppercase text-[var(--text-secondary)]">Gap model</th>
              <th className="px-3 py-3 font-mono text-[10px] uppercase text-[var(--text-secondary)]">Space</th>
              <th className="px-3 py-3 font-mono text-[10px] uppercase text-[var(--text-secondary)]">Time</th>
              <th className="px-3 py-3 font-mono text-[10px] uppercase text-[var(--text-secondary)]">Best for</th>
              <th className="px-3 py-3 font-mono text-[10px] uppercase text-[var(--text-secondary)]">Worst for</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((r) => (
              <tr key={r.algo} className="border-b border-[var(--card-border)]/60 hover:bg-[color-mix(in_srgb,var(--bg-surface)_55%,transparent)]">
                <td className="px-3 py-3 font-mono font-medium text-[var(--text-primary)]">{r.algo}</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{r.type}</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{r.gap}</td>
                <td className="px-3 py-3 font-mono text-[var(--text-secondary)]">{r.space}</td>
                <td className="px-3 py-3 font-mono text-[var(--text-secondary)]">{r.time}</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{r.best}</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{r.worst}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
