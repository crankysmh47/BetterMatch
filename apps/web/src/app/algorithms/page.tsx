import dynamic from 'next/dynamic';

const AlgorithmsExplainer = dynamic(() => import('./AlgorithmsExplainer'), {
  loading: () => (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-slate-500 text-sm">
      Loading algorithms…
    </div>
  ),
});

export default function AlgorithmsPage() {
  return <AlgorithmsExplainer />;
}
