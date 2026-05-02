'use client';

import Link from 'next/link';
import BetterMatchLogo from '@/components/ui/BetterMatchLogo';

const algorithms = [
  {
    name: 'Needleman-Wunsch',
    tag: 'Global',
    complexity: 'O(m×n) time · O(m×n) space',
    description:
      'Guarantees a globally optimal alignment across the entire length of both sequences. Ideal for comparing similar-length, evolutionarily related sequences.',
    color: 'emerald',
  },
  {
    name: 'Smith-Waterman',
    tag: 'Local',
    complexity: 'O(m×n) time · O(m×n) space',
    description:
      'Finds the highest-scoring local sub-sequence match. Essential for detecting conserved domains within otherwise divergent sequences.',
    color: 'green',
  },
  {
    name: "Hirschberg's",
    tag: 'Optimized Global',
    complexity: 'O(m×n) time · O(n) space',
    description:
      'Divide-and-conquer variant of Needleman-Wunsch that reduces memory from quadratic to linear — enabling alignment of very long sequences.',
    color: 'lime',
  },
];

const colorMap: Record<string, string> = {
  emerald:
    'border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_92%,transparent)] shadow-[inset_0_1px_0_var(--card-shine)] hover:border-[color-mix(in_srgb,var(--accent-mint)_42%,var(--border-rose))] hover:bg-[color-mix(in_srgb,var(--card-bg-hover)_88%,transparent)]',
  green:
    'border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_92%,transparent)] shadow-[inset_0_1px_0_var(--card-shine)] hover:border-[color-mix(in_srgb,var(--accent-teal)_38%,var(--border-dim))] hover:bg-[color-mix(in_srgb,var(--card-bg-hover)_88%,transparent)]',
  lime:
    'border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_92%,transparent)] shadow-[inset_0_1px_0_var(--card-shine)] hover:border-[color-mix(in_srgb,var(--accent-lime)_45%,var(--border-dim))] hover:bg-[color-mix(in_srgb,var(--card-bg-hover)_88%,transparent)]',
};
const tagColorMap: Record<string, string> = {
  emerald: 'text-[var(--accent-mint)] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-rose)_12%,transparent)]',
  green: 'text-[var(--accent-teal)] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-green)_10%,transparent)]',
  lime: 'text-[var(--accent-lime)] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-amber)_10%,transparent)]',
};

const heroPanel =
  'rounded-3xl border border-[color-mix(in_srgb,var(--card-border)_50%,transparent)] bg-[color-mix(in_srgb,var(--bg-card)_52%,transparent)] px-6 py-10 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:px-10 sm:py-12';

const heroTextShadow =
  '[text-shadow:0_1px_2px_rgba(0,0,0,0.75),0_0_20px_rgba(12,28,22,0.55)]';

export default function HomePage() {
  return (
    <div className="space-y-20">
      <section className="isolate flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div
          className={`${heroPanel} mx-auto flex w-full max-w-2xl flex-col items-center space-y-8 text-center lg:max-w-3xl`}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_70%,transparent)] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--accent-lime)] shadow-[inset_0_1px_0_var(--card-shine)] sm:text-xs">
            CS-251 DAA · NUST · 2026
          </div>

          <div className="flex flex-col items-center gap-5">
            <BetterMatchLogo size={108} className="drop-shadow-[0_0_32px_rgba(74,222,128,0.75)] rounded-xl" />
            <h1
              className={`font-[var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-6xl md:text-7xl ${heroTextShadow}`}
            >
              <span className="text-[#d9f99d]">Better</span>
              <span>Match</span>
            </h1>
          </div>

          <p className={`font-[var(--font-display)] text-lg italic text-[var(--accent-teal)] sm:text-xl ${heroTextShadow}`}>
            Where sequences meet.
          </p>

          <p className={`max-w-xl text-balance text-[var(--text-secondary)] sm:text-lg ${heroTextShadow}`}>
            Educational sequence-alignment workbench: step through DP, see scoring and traceback in the open, and
            benchmark runs — a white-box view of how optimal alignments are built.
          </p>

          <div className="flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/align"
              className="rounded-xl bg-[color-mix(in_srgb,#bef264_75%,#166534)] px-8 py-3 text-center font-mono text-sm font-semibold uppercase tracking-widest text-[#14532d] shadow-[0_0_24px_rgba(190,246,100,0.45)] transition-all hover:bg-[#d9f99d] hover:text-[#14532d] hover:shadow-[0_0_36px_rgba(217,249,157,0.55)]"
            >
              Start aligning
            </Link>
            <Link
              href="/history"
              className="rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_82%,transparent)] px-8 py-3 text-center font-mono text-sm uppercase tracking-widest text-[var(--text-secondary)] shadow-[inset_0_1px_0_var(--card-shine)] transition-colors hover:bg-[color-mix(in_srgb,var(--card-bg-hover)_78%,transparent)]"
            >
              View history
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2 pt-2 opacity-80">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent-lime)]">Scroll for overview</p>
            <div className="h-8 w-px animate-pulse bg-gradient-to-b from-[var(--accent-amber)]/70 to-transparent" />
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 space-y-5 px-4 sm:px-0">
        <h2 className="border-b border-[var(--card-border)] pb-2 font-mono text-xl font-semibold uppercase tracking-widest text-[var(--heading-accent)]">
          What you get
        </h2>
        <div className="max-w-3xl space-y-4 rounded-2xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_94%,transparent)] p-6 leading-relaxed text-[var(--text-primary)] shadow-[inset_0_1px_0_var(--card-shine)] backdrop-blur-md">
          <p>
            BetterMatch (GenAlign) is built for learning: Needleman–Wunsch, Smith–Waterman, Hirschberg, Gotoh, and
            banded NW — each with an interactive DP view so you can relate matrix cells to traceback and scoring.
            Benchmark hooks help compare time and memory without hiding the mechanism.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Use the align tool for hands-on runs; algorithms and benchmark pages go deeper on complexity and metrics.
          </p>
          <Link
            href="/align"
            className="inline-flex rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-teal)_18%,transparent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-teal)] duration-150 hover:bg-[color-mix(in_srgb,var(--accent-teal)_28%,transparent)]"
          >
            Open align tool
          </Link>
        </div>
      </section>

      <section className="space-y-6 px-4 sm:px-0">
        <h2 className="border-b border-[var(--card-border)] pb-2 font-mono text-xl font-semibold uppercase tracking-widest text-[var(--heading-cheer)]">
          Supported algorithms
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {algorithms.map((algo) => (
            <div
              key={algo.name}
              className={`cursor-default space-y-4 rounded-sm border p-6 backdrop-blur-sm transition-all ${colorMap[algo.color]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-[color-mix(in_srgb,var(--accent-mint)_88%,var(--accent-lime))]">
                  {algo.name}
                </h3>
                <span
                  className={`rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest whitespace-nowrap ${tagColorMap[algo.color]}`}
                >
                  {algo.tag}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{algo.description}</p>
              <code className="block border-t border-[var(--card-border)] pt-4 font-mono text-xs text-[var(--text-muted)]/90">
                {algo.complexity}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 px-4 pb-16 sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
        {[
          { title: 'DP table visualizer', desc: 'Animated matrix fill with Play / Pause / Step (sequences ≤ 50 bp).' },
          { title: 'Color-coded output', desc: 'Matches, mismatches, and gaps read at a glance.' },
          { title: 'FASTA support', desc: 'Paste sequences or upload .fasta from NCBI-style sources.' },
          { title: 'Benchmark metrics', desc: 'Elapsed time and peak memory per run for fair comparisons.' },
        ].map(({ title, desc }, i) => (
          <div
            key={title}
            className="space-y-2 rounded-sm border border-[var(--card-border)] border-l-[3px] border-l-[color-mix(in_srgb,var(--accent-coral)_55%,var(--accent-green))] bg-gradient-to-br from-[color-mix(in_srgb,var(--card-bg)_78%,transparent)] to-[color-mix(in_srgb,var(--tint-rose)_32%,transparent)] p-5 shadow-[inset_0_1px_0_var(--card-shine)] backdrop-blur-sm"
          >
            <h4
              className={`font-mono text-sm font-semibold uppercase tracking-wide ${
                i % 4 === 0
                  ? 'text-[var(--accent-lime)]'
                  : i % 4 === 1
                    ? 'text-[var(--accent-teal)]'
                    : i % 4 === 2
                      ? 'text-[var(--accent-amber)]'
                      : 'text-[var(--accent-rose)]'
              }`}
            >
              {title}
            </h4>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
