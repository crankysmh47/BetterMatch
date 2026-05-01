'use client';

import dynamic from 'next/dynamic';

const BenchmarkPageClient = dynamic(() => import('./BenchmarkPageClient'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-card)] p-8 text-[var(--text-muted)] text-sm">
      Loading benchmark UI…
    </div>
  ),
});

export default function BenchmarkLazy() {
  return <BenchmarkPageClient />;
}
