import Link from 'next/link';

const algorithms = [
  {
    name: 'Needleman-Wunsch',
    tag: 'Global',
    complexity: 'O(m×n) time · O(m×n) space',
    description:
      'Guarantees a globally optimal alignment across the entire length of both sequences. Ideal for comparing similar-length, evolutionarily related sequences.',
    color: 'sky',
  },
  {
    name: 'Smith-Waterman',
    tag: 'Local',
    complexity: 'O(m×n) time · O(m×n) space',
    description:
      'Finds the highest-scoring local sub-sequence match. Essential for detecting conserved domains within otherwise divergent sequences.',
    color: 'violet',
  },
  {
    name: "Hirschberg's",
    tag: 'Optimized Global',
    complexity: 'O(m×n) time · O(n) space',
    description:
      'Divide-and-conquer variant of Needleman-Wunsch that reduces memory from quadratic to linear — enabling alignment of very long sequences.',
    color: 'emerald',
  },
];

const colorMap: Record<string, string> = {
  sky:     'border-sky-500/30 bg-sky-500/5 hover:border-sky-400/60',
  violet:  'border-violet-500/30 bg-violet-500/5 hover:border-violet-400/60',
  emerald: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/60',
};
const tagColorMap: Record<string, string> = {
  sky:     'bg-sky-500/20 text-sky-300',
  violet:  'bg-violet-500/20 text-violet-300',
  emerald: 'bg-emerald-500/20 text-emerald-300',
};

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium">
          DAA Project · Bioinformatics Visualization
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          <span className="text-sky-400">Better</span>
          <span className="text-white">Match</span>
        </h1>
        <p className="max-w-2xl mx-auto text-slate-400 text-lg leading-relaxed">
          An educational white-box visualizer for sequence alignment algorithms.
          Watch the dynamic programming matrix fill in real time, step through
          every decision, and understand <em>why</em> the optimal alignment is computed the way it is.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/align"
            className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-colors shadow-lg shadow-sky-500/20"
          >
            Start Aligning
          </Link>
          <Link
            href="/history"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors"
          >
            View History
          </Link>
        </div>
      </section>

      {/* Algorithm Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-100">Supported Algorithms</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {algorithms.map((algo) => (
            <div
              key={algo.name}
              className={`rounded-2xl border p-6 transition-all cursor-default space-y-4 ${colorMap[algo.color]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-lg text-slate-100">{algo.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${tagColorMap[algo.color]}`}>
                  {algo.tag}
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{algo.description}</p>
              <code className="text-xs text-slate-500 font-mono">{algo.complexity}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'DP Table Visualizer', desc: 'Animated matrix fill with Play / Pause / Step controls (sequences ≤ 50 bp).' },
          { title: 'Color-coded Output', desc: 'Matches in green, mismatches in orange, gaps in grey — instantly readable.' },
          { title: 'FASTA Support', desc: 'Paste raw sequences or upload .fasta files directly from NCBI.' },
          { title: 'Benchmark Metrics', desc: 'Every run records elapsed time and peak memory so you can compare algorithms.' },
        ].map(({ title, desc }) => (
          <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-2">
            <h4 className="font-semibold text-slate-200">{title}</h4>
            <p className="text-slate-500 text-sm">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
