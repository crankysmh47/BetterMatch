'use client';

import { useEffect, useRef } from 'react';
import {
  sequenceCharOverlay,
  hasInvalidLetters,
  canonicalSequenceLetters,
} from '@/lib/sequence-validation';

type Props = {
  label: string;
  seqId: 'A' | 'B';
  value: string;
  onChange: (v: string) => void;
  mode: 'dna' | 'protein';
  colourHighlight: boolean;
  onToggleColour: () => void;
  fastaBusy: boolean;
  onPickFasta: (file: File) => void;
  /** Scroll/select this 0-based character index (from alignment click) */
  highlightFocusIndex?: number | null;
};

export default function SequenceField({
  label,
  seqId,
  value,
  onChange,
  mode,
  colourHighlight,
  onToggleColour,
  fastaBusy,
  onPickFasta,
  highlightFocusIndex = null,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const invalid = hasInvalidLetters(value, mode);
  const len = canonicalSequenceLetters(value).length;
  const showOverlay = mode === 'dna' && colourHighlight;
  const visuals = showOverlay ? sequenceCharOverlay(value, mode) : null;

  useEffect(() => {
    if (highlightFocusIndex == null || highlightFocusIndex < 0) return;
    const el = taRef.current;
    if (!el) return;
    const len = value.length;
    if (!len) return;
    const pos = Math.min(highlightFocusIndex, len - 1);
    requestAnimationFrame(() => {
      el.focus({ preventScroll: false });
      const end = Math.min(pos + 1, len);
      el.setSelectionRange(pos, end);
      const before = value.slice(0, pos);
      const line = before.split('\n').length - 1;
      const lineHeight = 22;
      el.scrollTop = Math.max(0, line * lineHeight - 48);
      el.parentElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, [highlightFocusIndex, value]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {mode === 'dna' && (
            <button
              type="button"
              onClick={onToggleColour}
              className={`text-[10px] px-2 py-1 rounded-lg border font-mono uppercase tracking-wide duration-150 ${
                colourHighlight
                  ? 'border-[var(--accent-teal)]/50 bg-[var(--accent-teal)]/10 text-[var(--accent-teal)]'
                  : 'border-[var(--border-dim)] text-[var(--text-muted)] hover:border-[var(--accent-teal)]/30'
              }`}
            >
              Colour bases
            </button>
          )}
          <span className="text-[10px] font-mono text-[var(--text-muted)] tabular-nums">{len} bp</span>
        </div>
      </div>

      <div
        className={`relative rounded-xl border bg-[var(--bg-card)] min-h-[200px] transition-colors duration-150 focus-within:border-[var(--accent-teal)] focus-within:ring-1 focus-within:ring-[var(--accent-teal)]/25 ${
          invalid ? 'border-[color:var(--accent-coral)]/55' : 'border-[var(--border-dim)]'
        }`}
      >
        {showOverlay && visuals ? (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 px-4 py-3 font-mono text-sm whitespace-pre-wrap break-all leading-relaxed text-left rounded-xl overflow-hidden"
            >
              {visuals.map((v, i) =>
                v.ch === '' ? null : (
                  <span key={i} className={v.className}>
                    {v.ch}
                  </span>
                ),
              )}
            </div>
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              placeholder={`>seq_${seqId}\nACGTACGTACGT`}
              className="relative z-10 w-full min-h-[200px] bg-transparent text-transparent caret-[var(--text-primary)] selection:bg-[color:var(--accent-amber)]/45 resize-none px-4 py-3 font-mono text-sm leading-relaxed rounded-xl focus:outline-none block placeholder:text-[var(--text-muted)]/50 placeholder:opacity-90"
            />
          </>
        ) : (
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            placeholder={`>seq_${seqId}\nACGTACGTACGT`}
            className="w-full min-h-[200px] bg-transparent resize-none px-4 py-3 font-mono text-sm leading-relaxed rounded-xl focus:outline-none block text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 border-0 selection:bg-[color:var(--accent-amber)]/35"
          />
        )}
        <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] font-mono tabular-nums text-[var(--text-muted)] bg-[var(--bg-deep)]/80 px-1.5 py-0.5 rounded">
          {len}
        </span>
      </div>

      {invalid && len > 0 && (
        <div className="text-[10px] font-mono uppercase tracking-wide text-[color:var(--accent-coral)] flex items-center gap-1.5">
          <span className="inline-block size-1.5 rounded-full bg-[color:var(--accent-coral)]" aria-hidden />
          Invalid characters detected
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".fasta,.fa,.txt"
          ref={fileRef}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPickFasta(f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          disabled={fastaBusy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-dim)] text-[var(--text-muted)] hover:text-[var(--accent-teal)] hover:border-[var(--accent-teal)]/35 duration-150 disabled:opacity-60"
        >
          {fastaBusy ? (
            <>
              <span
                className="inline-block size-3.5 border-2 border-[var(--accent-teal)]/30 border-t-[var(--accent-teal)] rounded-full animate-spin"
                aria-hidden
              />
              Parsing…
            </>
          ) : (
            'Upload FASTA'
          )}
        </button>
      </div>
    </div>
  );
}
