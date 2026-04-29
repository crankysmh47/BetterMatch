import type { AlignRequest, AlignResult, AllResults, HistoryRecord } from '@/types/alignment';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  alignGlobal:    (body: AlignRequest) => request<AlignResult>('/align/global',    { method: 'POST', body: JSON.stringify(body) }),
  alignLocal:     (body: AlignRequest) => request<AlignResult>('/align/local',     { method: 'POST', body: JSON.stringify(body) }),
  alignOptimized: (body: AlignRequest) => request<AlignResult>('/align/optimized', { method: 'POST', body: JSON.stringify(body) }),
  alignAll:       (body: AlignRequest) => request<AllResults>('/align/all',        { method: 'POST', body: JSON.stringify(body) }),

  getHistory:   (limit = 20) => request<HistoryRecord[]>(`/history?limit=${limit}`),
  getHistoryItem: (id: string)  => request<HistoryRecord>(`/history/${id}`),
  deleteHistory:  (id: string)  => request<{ deleted: boolean }>(`/history/${id}`, { method: 'DELETE' }),
  getStats:       ()            => request<any>('/history/stats'),
};
