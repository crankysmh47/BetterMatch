import Link from 'next/link';
import DNAAnimation from '@/components/ui/DNAAnimation';

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
  emerald: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/60 hover:bg-emerald-500/10',
  green:   'border-green-500/30 bg-green-500/5 hover:border-green-400/60 hover:bg-green-500/10',
  lime:    'border-lime-500/30 bg-lime-500/5 hover:border-lime-400/60 hover:bg-lime-500/10',
};
const tagColorMap: Record<string, string> = {
  emerald: 'text-emerald-400 border border-emerald-500/30',
  green:   'text-green-400 border border-green-500/30',
  lime:    'text-lime-400 border border-lime-500/30',
};

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-8 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-widest bg-emerald-500/5 backdrop-blur-sm rounded-sm">
          [ DAA Project // Bioinformatics Visualization ]
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          <span className="text-emerald-400">Better</span>
          <span className="text-white">Match</span>
        </h1>
        <p className="max-w-2xl mx-auto text-slate-300 text-lg leading-relaxed">
          An educational white-box visualizer for sequence alignment algorithms.
          Watch the dynamic programming matrix fill in real time, step through
          every decision, and understand <em>why</em> the optimal alignment is computed the way it is.
        </p>
        
        {/* DNA Animation */}
        <DNAAnimation />

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="/align"
            className="px-8 py-3 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white font-mono uppercase tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)]"
          >
            Start Aligning
          </Link>
          <Link
            href="/history"
            className="px-8 py-3 rounded-sm bg-transparent hover:bg-white/5 text-slate-300 font-mono uppercase tracking-widest text-sm border border-slate-700 transition-colors"
          >
            View History
          </Link>
        </div>
      </section>

      {/* Algorithm Cards */}
      <section className="space-y-6">
        <h2 className="text-xl font-mono uppercase tracking-widest text-slate-300 mb-8 border-b border-slate-800 pb-2">Supported Algorithms</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {algorithms.map((algo) => (
            <div
              key={algo.name}
              className={`rounded-sm border p-6 transition-all cursor-default space-y-4 ${colorMap[algo.color]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-lg text-slate-100 font-display">{algo.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-sm font-mono uppercase tracking-widest whitespace-nowrap ${tagColorMap[algo.color]}`}>
                  {algo.tag}
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{algo.description}</p>
              <code className="text-xs text-slate-500 font-mono block pt-4 border-t border-slate-800/50">{algo.complexity}</code>
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
          <div key={title} className="border-l-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent p-5 space-y-2">
            <h4 className="font-mono text-sm uppercase tracking-wide text-emerald-300">{title}</h4>
            <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
