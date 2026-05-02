import dynamic from 'next/dynamic';

const AlgorithmsExplainer = dynamic(() => import('./AlgorithmsExplainer'), {
  loading: () => (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_82%,transparent)] p-8 text-[var(--text-muted)] text-sm animate-pulse">
      Loading algorithms…
    </div>
  ),
});

export default function AlgorithmsPage() {
  return <AlgorithmsExplainer />;
}
