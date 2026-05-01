'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { HistoryRecord } from '@/types/alignment';
import Link from 'next/link';

const ALGO_LABELS: Record<string, string> = {
  needleman_wunsch: 'NW',
  banded_nw: 'NW*',
  smith_waterman: 'SW',
  hirschberg: 'HB',
  gotoh: 'GO',
};
const ALGO_COLORS: Record<string, string> = {
  needleman_wunsch: 'bg-sky-500/20 text-sky-300',
  banded_nw: 'bg-teal-500/20 text-teal-300',
  smith_waterman: 'bg-violet-500/20 text-violet-300',
  hirschberg: 'bg-emerald-500/20 text-emerald-300',
  gotoh: 'bg-amber-500/20 text-amber-200',
};

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [recs, st] = await Promise.all([api.getHistory(50), api.getStats()]);
      setRecords(recs);
      setStats(st);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    await api.deleteHistory(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const truncate = (s: string, n = 20) => s.length > n ? s.slice(0, n) + '…' : s;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Alignment History</h1>
          <p className="text-slate-400 mt-1">Runs saved in this browser (localStorage). Add Supabase later if you need cloud sync.</p>
        </div>
        <Link
          href="/align"
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors"
        >
          New Alignment
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Runs" value={stats.total} />
          {stats.by_algorithm?.map((a: any) => (
            <StatCard
              key={a.algorithm}
              label={ALGO_LABELS[a.algorithm] ?? a.algorithm}
              value={a.count}
              sub={`avg ${parseFloat(a.avg_ms).toFixed(1)} ms`}
            />
          ))}
        </div>
      )}

      {/* Table */}
      {loading && <p className="text-slate-500">Loading history…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && records.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          No alignments yet.{' '}
          <Link href="/align" className="text-sky-400 hover:underline">Run your first one.</Link>
        </div>
      )}
      {records.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/70">
                {['Algorithm', 'Seq A', 'Seq B', 'Score', 'Identity', 'Time', 'Date', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ALGO_COLORS[rec.algorithm] ?? 'bg-slate-700 text-slate-300'}`}>
                      {ALGO_LABELS[rec.algorithm] ?? rec.algorithm}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">{truncate(rec.seq_a)}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">{truncate(rec.seq_b)}</td>
                  <td className="py-3 px-4 text-sky-400 font-mono font-bold">{rec.result_score}</td>
                  <td className="py-3 px-4 text-emerald-400">{rec.identity}%</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{rec.elapsed_ms.toFixed(2)} ms</td>
                  <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(rec.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-1">
      <div className="text-2xl font-bold text-sky-400">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-600">{sub}</div>}
    </div>
  );
}
