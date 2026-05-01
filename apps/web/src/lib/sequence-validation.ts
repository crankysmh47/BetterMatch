/** Allowed letters after stripping FASTA header lines (>...) */

const DNA_LETTERS = new Set('ATGCUN');
const PROTEIN_LETTERS = new Set('ARNDCQEGHILKMFPSTWYVX*-'.split(''));

export type CharVisual = { ch: string; className: string };

/** Build per-character classes for overlay behind transparent textarea (FASTA-aware headers). */
export function sequenceCharOverlay(value: string, mode: 'dna' | 'protein'): CharVisual[] {
  let inHeader = false;
  const letters = mode === 'dna' ? DNA_LETTERS : PROTEIN_LETTERS;

  return value.split('').map((ch) => {
    if (ch === '\r') return { ch: '', className: '' };
    if (ch === '\n') {
      inHeader = false;
      return { ch: '\n', className: 'text-slate-600' };
    }
    if (ch === '>') {
      inHeader = true;
      return { ch: '>', className: 'text-slate-500' };
    }
    if (inHeader) return { ch, className: 'text-slate-500' };
    if (/\s/.test(ch)) return { ch: ch === ' ' ? '\u00a0' : ch, className: '' };

    const u = ch.toUpperCase();
    const ok = letters.has(u);
    if (!ok) return { ch: u, className: 'text-[color:var(--accent-coral)] font-semibold' };

    if (mode === 'dna') {
      if (u === 'A') return { ch: u, className: 'text-[color:var(--base-A)]' };
      if (u === 'T' || u === 'U') return { ch: u, className: 'text-[color:var(--base-T)]' };
      if (u === 'G') return { ch: u, className: 'text-[color:var(--base-G)]' };
      if (u === 'C') return { ch: u, className: 'text-[color:var(--base-C)]' };
      if (u === 'N') return { ch: u, className: 'text-[color:var(--text-muted)]' };
    }
    return { ch: u, className: 'text-slate-200' };
  });
}

/** Letters used for alignment after FASTA header strip + whitespace removal (uppercase). */
export function canonicalSequenceLetters(seq: string): string {
  const lines = seq.split(/\r?\n/);
  const parts: string[] = [];
  for (const ln of lines) {
    if (ln.startsWith('>')) continue;
    parts.push(ln.replace(/\s/g, ''));
  }
  return parts.join('').toUpperCase();
}

export function hasInvalidLetters(seq: string, mode: 'dna' | 'protein'): boolean {
  const body = canonicalSequenceLetters(seq);
  if (!body.length) return false;
  const letters = mode === 'dna' ? DNA_LETTERS : PROTEIN_LETTERS;
  for (const c of body) {
    if (!letters.has(c)) return true;
  }
  return false;
}
