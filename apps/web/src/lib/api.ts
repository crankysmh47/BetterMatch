'use client';

import type { AlignRequest, AlignResult, AllResults, HistoryRecord } from '@/types/alignment';
import {
  appendHistoryRecord as persistAppend,
  buildHistoryRecord as persistBuild,
  deleteHistoryRecord as persistDelete,
  getHistoryRecord as persistGet,
  historyStats as persistStats,
  listHistoryRecords as persistList,
} from '@/lib/history-local';

export type BenchmarkRow = {
  algorithm: string;
  length: number;
  time_ms: number;
  memory_kb: number;
  banded: boolean;
  bandwidth: number | null;
};

export type BenchmarkJob = {
  status: string;
  started_at?: number;
  rows?: BenchmarkRow[];
  error?: string | null;
};

/** FastAPI base URL including `/api`, e.g. http://localhost:8000/api or https://….hf.space/api */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string; message?: string };
    const detail = body.detail ?? body.message;
    throw new Error(typeof detail === 'string' ? detail : `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  alignGlobal: (body: AlignRequest) =>
    request<AlignResult>('/align/global', { method: 'POST', body: JSON.stringify(body) }),
  alignLocal: (body: AlignRequest) =>
    request<AlignResult>('/align/local', { method: 'POST', body: JSON.stringify(body) }),
  alignOptimized: (body: AlignRequest) =>
    request<AlignResult>('/align/optimized', { method: 'POST', body: JSON.stringify(body) }),
  alignGotoh: (body: AlignRequest) =>
    request<AlignResult>('/align/gotoh', { method: 'POST', body: JSON.stringify(body) }),
  alignAll: (body: AlignRequest) =>
    request<AllResults>('/align/all', { method: 'POST', body: JSON.stringify(body) }),

  parseFasta: async (file: File, mode: 'dna' | 'protein' = 'dna') => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/parse/fasta?mode=${mode}`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { detail?: string; message?: string };
      throw new Error(body.detail ?? body.message ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{
      sequences: Array<{ id: string; description: string; sequence: string; invalid_chars?: string[] }>;
      warning: string | null;
    }>;
  },

  getBenchmark: () => request<{ rows: BenchmarkRow[] }>('/benchmark'),
  runBenchmark: () => request<{ job_id: string }>('/benchmark/run', { method: 'POST', body: '{}' }),
  getBenchmarkJob: (id: string) => request<BenchmarkJob>(`/benchmark/job/${id}`),

  /** Browser-only alignment history (no NestJS). Optionally pair with Supabase later. */
  getHistory: async (limit = 20) => persistList(limit),
  getHistoryItem: async (id: string) => {
    const r = persistGet(id);
    if (!r) throw new Error('History entry not found');
    return r;
  },
  deleteHistory: async (id: string) => ({ deleted: persistDelete(id) }),
  getStats: async () => persistStats(),

  /** Call after a successful alignment to populate `/history` and the drawer. */
  saveAlignmentRun: (body: AlignRequest, rawSeqA: string, rawSeqB: string, result: AlignResult) => {
    persistAppend(persistBuild(body, rawSeqA, rawSeqB, result));
  },
};
