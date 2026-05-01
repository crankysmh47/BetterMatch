/** GenAlign base colours — matches CSS tokens (--base-A etc.). */

export const DNA_BASE_HEX: Record<string, string> = {
  A: '#1BFFB8',
  T: '#FFB700',
  G: '#957FEF',
  C: '#FF5C57',
  U: '#FFB700',
};

export function dnaBaseHex(ch: string): string | null {
  const k = ch.toUpperCase();
  return DNA_BASE_HEX[k] ?? null;
}

/** Tailwind arbitrary colour using CSS variable (for JSX className). */
export function dnaBaseTextClass(ch: string): string {
  const k = ch.toUpperCase();
  if (k === 'A') return 'text-[color:var(--base-A)]';
  if (k === 'T' || k === 'U') return 'text-[color:var(--base-T)]';
  if (k === 'G') return 'text-[color:var(--base-G)]';
  if (k === 'C') return 'text-[color:var(--base-C)]';
  if (k === 'N') return 'text-[color:var(--text-muted)]';
  return '';
}
