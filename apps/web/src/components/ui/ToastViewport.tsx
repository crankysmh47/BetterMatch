'use client';

import { useToastStore } from '@/lib/toast-store';

function color(type: string) {
  if (type === 'success') return 'border-[var(--accent-green)]/30 bg-[var(--accent-green)]/10 text-[var(--text-primary)]';
  if (type === 'error') return 'border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 text-[var(--text-primary)]';
  return 'border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/10 text-[var(--text-primary)]';
}

export default function ToastViewport() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-32px)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border px-4 py-3 shadow-lg backdrop-blur-[12px] animate-[toast-in_180ms_ease-out] ${color(t.type)}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-sm">{t.title}</div>
              {t.detail && <div className="text-xs text-[var(--text-muted)] mt-1 break-words">{t.detail}</div>}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

