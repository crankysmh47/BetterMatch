/** Top-left 6×6 (ARNDCQ) substitution scores — mirrors algorithms scoring_matrices (subset). */

export type MatrixName = 'BLOSUM62' | 'BLOSUM45' | 'BLOSUM80' | 'PAM250';

const LABELS = ['A', 'R', 'N', 'D', 'C', 'Q'] as const;

const PREVIEW: Record<MatrixName, number[][]> = {
  BLOSUM62: [
    [4, -1, -2, -2, 0, -1],
    [-1, 5, 0, -2, -3, 1],
    [-2, 0, 6, 1, -3, 0],
    [-2, -2, 1, 6, -3, 0],
    [0, -3, -3, -3, 9, -3],
    [-1, 1, 0, 0, -3, 5],
  ],
  BLOSUM45: [
    [5, -2, -1, -2, -1, -1],
    [-2, 7, 0, -1, -3, 1],
    [-1, 0, 6, 2, -2, 0],
    [-2, -1, 2, 7, -3, 0],
    [-1, -3, -2, -3, 12, -3],
    [-1, 1, 0, 0, -3, 6],
  ],
  BLOSUM80: [
    [5, -2, -2, -2, -1, -1],
    [-2, 6, -1, -2, -4, 1],
    [-2, -1, 6, 1, -3, 0],
    [-2, -2, 1, 6, -4, -1],
    [-1, -4, -3, -4, 9, -4],
    [-1, 1, 0, -1, -4, 6],
  ],
  PAM250: [
    [2, -2, 0, 0, -2, 0],
    [-2, 6, 0, -1, -4, 1],
    [0, 0, 2, 2, -4, 1],
    [0, -1, 2, 4, -5, 2],
    [-2, -4, -4, -5, 12, -5],
    [0, 1, 1, 2, -5, 4],
  ],
};

export function matrixPreviewGrid(name: MatrixName): { labels: readonly string[]; grid: number[][] } {
  return { labels: LABELS as unknown as string[], grid: PREVIEW[name] };
}
