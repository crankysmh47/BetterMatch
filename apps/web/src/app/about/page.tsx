import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="genalign-enter-panel-1 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[var(--font-display)] italic tracking-tight">
          About GenAlign
        </h1>
        <p className="text-[var(--text-muted)] mt-2 font-mono text-xs uppercase tracking-wide">
          CS-251 DAA · NUST · 2026
        </p>
      </div>
      <div className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-card)] p-6 space-y-4 text-[var(--text-primary)] leading-relaxed">
        <p>
          GenAlign is an educational sequence-alignment workbench: dynamic-programming algorithms (NW, SW,
          Hirschberg, Gotoh, banded NW), interactive DP visualisation, and benchmarking hooks aimed at a clear,
          white-box view of scoring and traceback.
        </p>
        <p className="text-[var(--text-muted)] text-sm">
          Tagline: <span className="text-[var(--accent-teal)] font-[var(--font-display)] italic">Where sequences meet.</span>
        </p>
      </div>
      <Link
        href="/align"
        className="inline-flex px-5 py-2.5 rounded-xl bg-[var(--accent-teal)]/20 text-[var(--accent-teal)] border border-[var(--border-dim)] font-semibold text-sm duration-150 hover:bg-[var(--accent-teal)]/30"
      >
        Open Align tool
      </Link>
    </div>
  );
}
