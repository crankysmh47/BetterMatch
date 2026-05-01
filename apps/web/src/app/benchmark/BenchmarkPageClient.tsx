'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { api, type BenchmarkRow } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Filler);

/** Chart.js line datasets for our charts (allows optional theory overlays without full parity). */
type LineDatasetConfig = {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
  spanGaps: boolean;
  fill: boolean;
  borderDash?: number[];
  borderWidth?: number;
  pointRadius: number;
};

const LENGTH_AXIS = [100, 500, 1000, 2000, 5000, 10000];

function uniqSortedLens(rows: BenchmarkRow[]): number[] {
  const u = [...new Set(rows.map((r) => r.length))].sort((a, b) => a - b);
  return u.length ? u : LENGTH_AXIS;
}

type VisibleKey = 'nw' | 'sw' | 'hirschberg' | 'gotoh' | 'banded_nw' | 'banded_hirschberg';

const PALETTE: Record<string, string> = {
  nw: '#1BFFB8',
  sw: '#FFB700',
  hirschberg: '#957FEF',
  gotoh: '#FF5C57',
  banded_nw: '#00E676',
  banded_hirschberg: '#00E676',
};

/** Prefer bandwidth 50 for banded rows when multiple k exist per length (matches job defaults). */
function rowMean(
  rows: BenchmarkRow[],
  alg: string,
  L: number,
  opts?: { banded?: boolean; bandwidth?: number | null },
): number | null {
  let hit = rows.filter((r) => r.algorithm === alg && r.length === L);
  if (opts?.banded !== undefined) hit = hit.filter((r) => r.banded === opts.banded);
  if (opts?.bandwidth != null) hit = hit.filter((r) => r.bandwidth === opts.bandwidth);
  if (!hit.length) return null;
  return hit.reduce((s, r) => s + r.time_ms, 0) / hit.length;
}

function rowMeanMem(
  rows: BenchmarkRow[],
  alg: string,
  L: number,
  opts?: { banded?: boolean; bandwidth?: number | null },
): number | null {
  let hit = rows.filter((r) => r.algorithm === alg && r.length === L);
  if (opts?.banded !== undefined) hit = hit.filter((r) => r.banded === opts.banded);
  if (opts?.bandwidth != null) hit = hit.filter((r) => r.bandwidth === opts.bandwidth);
  if (!hit.length) return null;
  return hit.reduce((s, r) => s + r.memory_kb, 0) / hit.length;
}

export default function BenchmarkPageClient() {
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobBusy, setJobBusy] = useState(false);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobMsg, setJobMsg] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<
    'algorithm' | 'length' | 'time_ms' | 'memory_kb' | 'bandwidth' | 'banded'
  >('length');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [visible, setVisible] = useState<Record<VisibleKey, boolean>>({
    nw: true,
    sw: true,
    hirschberg: true,
    gotoh: true,
    banded_nw: true,
    banded_hirschberg: true,
  });
  const [showTheory, setShowTheory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBenchmark();
      setRows(data.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lengths = useMemo(() => uniqSortedLens(rows), [rows]);

  const maxLen = lengths[lengths.length - 1] ?? 10000;

  const chartTime = useMemo(() => {
    const labels = lengths.map(String);
    const mkDs = (
      key: VisibleKey,
      label: string,
      style: { dashed?: boolean; dotted?: boolean },
    ) => {
      if (!visible[key]) return null;
      const alg =
        key === 'banded_nw' ? 'banded_nw' : key === 'banded_hirschberg' ? 'banded_hirschberg' : key;
      const dataPts = lengths.map((L) => {
        if (key === 'banded_nw')
          return rowMean(rows, 'banded_nw', L, { banded: true, bandwidth: 50 });
        if (key === 'banded_hirschberg')
          return rowMean(rows, 'banded_hirschberg', L, { banded: true, bandwidth: 50 });
        return rowMean(rows, alg, L, { banded: false });
      });
      const col = PALETTE[key] ?? '#888';
      return {
        label,
        data: dataPts.map((v) => (v == null ? NaN : v)),
        borderColor: col,
        backgroundColor: `${col}22`,
        tension: 0.15,
        spanGaps: true,
        fill: false,
        borderDash: style.dotted ? [2, 4] : style.dashed ? [8, 5] : undefined,
        borderWidth: key.startsWith('banded') ? 2 : 2,
        pointRadius: 3,
      };
    };

    const datasets: LineDatasetConfig[] = [
      mkDs('nw', 'NW', {}),
      mkDs('sw', 'SW', {}),
      mkDs('hirschberg', 'Hirschberg', {}),
      mkDs('gotoh', 'Gotoh', {}),
      mkDs('banded_nw', 'Banded NW (k=50)', { dashed: true }),
      mkDs('banded_hirschberg', 'Banded Hirschberg (k=50)', { dotted: true }),
    ].filter(Boolean) as LineDatasetConfig[];

    if (showTheory && lengths.length) {
      const refL = maxLen;
      const nwAtMax = rowMean(rows, 'nw', refL, { banded: false });
      const hirMemProxy = rowMean(rows, 'hirschberg', refL, { banded: false });
      if (nwAtMax != null) {
        const quad = lengths.map((L) => (Math.pow(L / refL, 2) * nwAtMax));
        datasets.push({
          label: 'Theory ∝ n² (scaled to NW @ max L)',
          data: quad,
          borderColor: 'rgba(232,245,240,0.35)',
          backgroundColor: 'transparent',
          tension: 0.05,
          borderDash: [6, 6],
          pointRadius: 0,
          spanGaps: true,
          fill: false,
        });
      }
      if (hirMemProxy != null) {
        const lin = lengths.map((L) => (L / refL) * hirMemProxy * 0.85);
        datasets.push({
          label: 'Theory ∝ n (scaled, illustrative)',
          data: lin,
          borderColor: 'rgba(149,127,239,0.45)',
          backgroundColor: 'transparent',
          tension: 0.05,
          borderDash: [4, 4],
          pointRadius: 0,
          spanGaps: true,
          fill: false,
        });
      }
    }

    return { labels, datasets };
  }, [rows, lengths, visible, showTheory, maxLen]);

  const chartMemory = useMemo(() => {
    const labels = lengths.map(String);
    const mkDs = (
      key: VisibleKey,
      label: string,
      style: { dashed?: boolean; dotted?: boolean },
    ) => {
      if (!visible[key]) return null;
      const alg =
        key === 'banded_nw' ? 'banded_nw' : key === 'banded_hirschberg' ? 'banded_hirschberg' : key;
      const dataPts = lengths.map((L) => {
        if (key === 'banded_nw')
          return rowMeanMem(rows, 'banded_nw', L, { banded: true, bandwidth: 50 });
        if (key === 'banded_hirschberg')
          return rowMeanMem(rows, 'banded_hirschberg', L, { banded: true, bandwidth: 50 });
        return rowMeanMem(rows, alg, L, { banded: false });
      });
      const col = PALETTE[key] ?? '#888';
      return {
        label,
        data: dataPts.map((v) => (v == null ? NaN : v)),
        borderColor: col,
        backgroundColor: `${col}18`,
        tension: 0.15,
        spanGaps: true,
        fill: false,
        borderDash: style.dotted ? [2, 4] : style.dashed ? [8, 5] : undefined,
        pointRadius: 3,
      };
    };

    const datasets: LineDatasetConfig[] = [
      mkDs('nw', 'NW', {}),
      mkDs('sw', 'SW', {}),
      mkDs('hirschberg', 'Hirschberg', {}),
      mkDs('gotoh', 'Gotoh', {}),
      mkDs('banded_nw', 'Banded NW (k=50)', { dashed: true }),
      mkDs('banded_hirschberg', 'Banded Hirschberg (k=50)', { dotted: true }),
    ].filter(Boolean) as LineDatasetConfig[];

    if (showTheory && lengths.length) {
      const refL = maxLen;
      const nwM = rowMeanMem(rows, 'nw', refL, { banded: false });
      const hirM = rowMeanMem(rows, 'hirschberg', refL, { banded: false });
      if (nwM != null) {
        datasets.push({
          label: 'Theory aux ∝ n² (scaled to NW memory)',
          data: lengths.map((L) => Math.pow(L / refL, 2) * nwM),
          borderColor: 'rgba(232,245,240,0.35)',
          backgroundColor: 'transparent',
          tension: 0.05,
          borderDash: [6, 6],
          pointRadius: 0,
          spanGaps: true,
          fill: false,
        });
      }
      if (hirM != null) {
        datasets.push({
          label: 'Theory aux ∝ n (scaled to Hirschberg)',
          data: lengths.map((L) => (L / refL) * hirM),
          borderColor: 'rgba(149,127,239,0.5)',
          backgroundColor: 'transparent',
          tension: 0.05,
          borderDash: [4, 4],
          pointRadius: 0,
          spanGaps: true,
          fill: false,
        });
      }
    }

    return { labels, datasets };
  }, [rows, lengths, visible, showTheory, maxLen]);

  /** Speedup analysis at a representative length where banded rows exist */
  const bandedAnalysis = useMemo(() => {
    const target =
      lengths.find((L) => rows.some((r) => r.algorithm === 'banded_nw' && r.length === L)) ??
      lengths[lengths.length - 1] ??
      1000;
    const nwT = rowMean(rows, 'nw', target, { banded: false });
    /** Matches band widths emitted by `benchmark_store.py` (50, 100, 200, 500). */
    const ks = [50, 100, 200, 500] as const;
    const points: { k: string; t: number | null }[] = [];
    for (const k of ks) {
      const v = rowMean(rows, 'banded_nw', target, { banded: true, bandwidth: k });
      points.push({ k: String(k), t: v });
    }
    points.push({ k: 'full NW', t: nwT });
    const crossover =
      nwT != null
        ? ks.find((k) => {
            const bt = rowMean(rows, 'banded_nw', target, { banded: true, bandwidth: k });
            return bt != null && bt >= nwT * 0.98;
          })
        : undefined;
    return { target, points, crossover, nwT };
  }, [rows, lengths]);

  const bandedChartData = useMemo(() => {
    const labels = bandedAnalysis.points.map((p) => p.k);
    const data = bandedAnalysis.points.map((p) => (p.t == null ? NaN : p.t));
    return {
      labels,
      datasets: [
        {
          label: `Banded NW time @ length ${bandedAnalysis.target}`,
          data,
          borderColor: '#00E676',
          backgroundColor: 'rgba(0,230,118,0.15)',
          tension: 0.2,
          fill: true,
          spanGaps: false,
          pointRadius: 5,
        },
      ],
    };
  }, [bandedAnalysis]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'banded') {
        return (Number(a.banded) - Number(b.banded)) * mul;
      }
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul;
      return String(av ?? '').localeCompare(String(bv ?? '')) * mul;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir('asc');
    }
  };

  const exportCsv = () => {
    const header = 'algorithm,length,time_ms,memory_kb,banded,bandwidth\n';
    const body = sortedRows
      .map((r) => `${r.algorithm},${r.length},${r.time_ms},${r.memory_kb},${r.banded},${r.bandwidth ?? ''}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'benchmark_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runLive = async () => {
    setJobBusy(true);
    setJobProgress(4);
    setJobMsg('Starting benchmark job…');
    try {
      const { job_id } = await api.runBenchmark();
      for (let i = 0; i < 600; i++) {
        setJobProgress(Math.min(94, 4 + Math.round((i / 600) * 90)));
        const job = await api.getBenchmarkJob(job_id);
        if (job.status === 'done') {
          setJobProgress(100);
          setJobMsg('Benchmark finished.');
          await load();
          break;
        }
        if (job.status === 'error') {
          setJobMsg(job.error ?? 'Benchmark failed');
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (e: unknown) {
      setJobMsg(e instanceof Error ? e.message : 'Benchmark error');
    } finally {
      setJobBusy(false);
      setTimeout(() => setJobProgress(0), 600);
    }
  };

  const chartOpts = useCallback(
    (yTitle: string) => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 450, easing: 'easeOutQuad' as const },
      transitions: { show: { animations: { numbers: { duration: 400 } } } },
      scales: {
        x: {
          title: { display: true, text: 'Sequence length', color: '#6B8FA8' },
          ticks: { color: '#6B8FA8' },
          grid: { color: 'rgba(27,255,184,0.08)' },
        },
        y: {
          title: { display: true, text: yTitle, color: '#6B8FA8' },
          ticks: { color: '#6B8FA8' },
          grid: { color: 'rgba(27,255,184,0.08)' },
        },
      },
      plugins: {
        legend: {
          labels: { color: '#E8F5F0', boxWidth: 12 },
          position: 'bottom' as const,
        },
      },
    }),
    [],
  );

  const bandedOpts = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      scales: {
        x: {
          title: { display: true, text: 'Bandwidth k (or full NW)', color: '#6B8FA8' },
          ticks: { color: '#6B8FA8' },
          grid: { color: 'rgba(27,255,184,0.08)' },
        },
        y: {
          title: { display: true, text: 'Time (ms)', color: '#6B8FA8' },
          ticks: { color: '#6B8FA8' },
          grid: { color: 'rgba(27,255,184,0.08)' },
        },
      },
      plugins: { legend: { labels: { color: '#E8F5F0' } } },
    }),
    [],
  );

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[var(--font-display)] italic">
          Benchmark & complexity
        </h1>
        <p className="text-[var(--text-muted)] max-w-2xl text-sm leading-relaxed">
          Synthetic near-identical DNA pairs at lengths {LENGTH_AXIS.join(', ')} bp (job defaults). Lines aggregate duplicate rows by mean; banded series use{' '}
          <span className="font-mono text-[var(--accent-teal)]">k = 50</span> when multiple bandwidths exist.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            disabled={jobBusy}
            onClick={() => void runLive()}
            className="px-4 py-2 rounded-xl bg-[var(--accent-teal)]/20 text-[var(--accent-teal)] border border-[var(--border-dim)] disabled:opacity-40 text-sm font-medium"
          >
            Run live benchmark
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="px-4 py-2 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm"
          >
            Refresh data
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm"
          >
            Download CSV
          </button>
          <label className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] cursor-pointer ml-2">
            <input type="checkbox" checked={showTheory} onChange={(e) => setShowTheory(e.target.checked)} />
            Show theoretical overlays
          </label>
        </div>
        {jobBusy && (
          <div className="space-y-1 max-w-md">
            <div className="h-2 rounded-full bg-[var(--bg-deep)] border border-[var(--border-dim)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent-teal)]/75 transition-[width] duration-500 ease-out rounded-full"
                style={{ width: `${jobProgress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--accent-amber)] font-mono">{jobMsg}</p>
          </div>
        )}
        {!jobBusy && jobMsg && <p className="text-sm text-[var(--accent-amber)]">{jobMsg}</p>}
      </header>

      <section className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-card)] p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Toggle series</span>
          {(Object.keys(visible) as VisibleKey[]).map((k) => (
            <label key={k} className="text-xs font-mono flex items-center gap-2 cursor-pointer text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={visible[k]}
                onChange={(e) => setVisible((v) => ({ ...v, [k]: e.target.checked }))}
              />
              {k === 'banded_hirschberg' ? 'banded_Hirschberg' : k}
            </label>
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-[300px] space-y-2">
            <div className="text-xs font-mono text-[var(--accent-teal)]">Wall time (ms)</div>
            {loading ? (
              <div className="text-[var(--text-muted)] text-sm">Loading…</div>
            ) : (
              <Line data={chartTime} options={chartOpts('Time (ms)')} />
            )}
          </div>
          <div className="h-[300px] space-y-2">
            <div className="text-xs font-mono text-[var(--accent-teal)]">Peak memory (KB)</div>
            {loading ? (
              <div className="text-[var(--text-muted)] text-sm">Loading…</div>
            ) : (
              <Line data={chartMemory} options={chartOpts('Memory (KB)')} />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-card)] p-6 space-y-4">
        <h2 className="font-bold text-[var(--text-primary)] font-[var(--font-display)] italic">Banded NW vs bandwidth</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-3xl">
          Slice at sequence length <span className="font-mono text-[var(--text-primary)]">{bandedAnalysis.target}</span>. Compare banded runs across{' '}
          <span className="font-mono">k ∈ {'{'}50, 100, 200, 500{'}'}</span> plus full NW. Missing bars mean that job has not completed yet.
          {bandedAnalysis.crossover != null && (
            <>
              {' '}
              <span className="text-[var(--text-primary)]">
                Banded NW equals full NW around{' '}
                <span className="font-mono text-[var(--accent-amber)]">k ≈ {bandedAnalysis.crossover}</span>
              </span>{' '}
              (empirical).
            </>
          )}
          {!bandedAnalysis.crossover && bandedAnalysis.nwT != null && (
            <span className="block mt-2 font-mono text-[11px] text-[var(--text-muted)]">
              Rule of thumb: Banded NW matches full NW when k approaches sequence length N — here N = {bandedAnalysis.target}.
            </span>
          )}
        </p>
        <div className="h-[260px]">
          {!loading && <Line data={bandedChartData} options={bandedOpts} />}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-card)] p-6 overflow-x-auto">
        <h2 className="font-bold text-[var(--text-primary)] mb-4">Results table</h2>
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-[var(--border-dim)]">
              {(
                [
                  ['algorithm', 'Algorithm'],
                  ['length', 'Seq length'],
                  ['time_ms', 'Time (ms)'],
                  ['memory_kb', 'Memory (KB)'],
                  ['banded', 'Banded'],
                  ['bandwidth', 'Bandwidth'],
                ] as const
              ).map(([col, label]) => (
                <th key={col} className="text-left py-2 px-3">
                  <button
                    type="button"
                    className="text-[var(--accent-teal)] font-mono text-xs uppercase hover:underline"
                    onClick={() => toggleSort(col)}
                  >
                    {label}
                    {sortKey === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r, idx) => (
              <tr key={`${r.algorithm}-${r.length}-${r.bandwidth}-${idx}`} className="border-b border-[var(--border-dim)]/50 hover:bg-[var(--bg-surface)]">
                <td className="py-2 px-3 font-mono">{r.algorithm}</td>
                <td className="py-2 px-3 font-mono">{r.length}</td>
                <td className="py-2 px-3 font-mono text-[var(--accent-amber)]">{r.time_ms}</td>
                <td className="py-2 px-3 font-mono">{r.memory_kb}</td>
                <td className="py-2 px-3 font-mono">{r.banded ? 'yes' : 'no'}</td>
                <td className="py-2 px-3 font-mono">{r.bandwidth ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!sortedRows.length && !loading && (
          <p className="text-[var(--text-muted)] text-sm mt-4">
            No rows loaded. Start the algorithms Docker service and run a benchmark job from the API (or click Run live benchmark).
          </p>
        )}
      </section>
    </div>
  );
}
