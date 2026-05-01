'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { dnaBaseHex } from '@/lib/dna-colors';

type TraceStep = { i: number; j: number };

export type GotohTab = 'M' | 'Ix' | 'Iy';

export type GotohLayers = {
  M: (number | null)[][];
  Ix: (number | null)[][];
  Iy: (number | null)[][];
};

interface Props {
  dpTable: (number | null)[][];
  seqA: string;
  seqB: string;
  algorithm: string;
  maxPos?: [number, number] | null;
  predecessor?: (string | null)[][] | null;
  tracebackPath?: TraceStep[] | null;
  dpActiveRegion?: boolean[][] | null;
  match?: number;
  mismatch?: number;
  gap?: number;
  gapExtend?: number;
  /** Three stacked canvases with opacity crossfade (Gotoh only) */
  gotohLayers?: GotohLayers | null;
  gotohTab?: GotohTab;
  onGotohTabChange?: (t: GotohTab) => void;
}

const BASE_CELL = 36;
const HEADER = 44;

const COL_DIAG = '#1BFFB8';
const COL_UP = '#FFB700';
const COL_LEFT = '#957FEF';

function predLabel(p: string | null | undefined): string {
  if (p === 'diag') return 'diagonal (match/mismatch)';
  if (p === 'up') return 'up (gap in seq B)';
  if (p === 'left') return 'left (gap in seq A)';
  return '—';
}

function fmtCell(v: number | null | undefined): string {
  return v === null || v === undefined || !Number.isFinite(Number(v)) ? '−∞' : String(Math.round(Number(v)));
}

function formatFormulaLine(
  algorithm: string,
  i: number,
  j: number,
  dp: (number | null)[][],
  seqA: string,
  seqB: string,
  match: number,
  mismatch: number,
  gap: number,
  pred: string | null | undefined,
  gotohExtra?: {
    layer: GotohTab;
    M: (number | null)[][];
    Ix: (number | null)[][];
    Iy: (number | null)[][];
    gapOpen: number;
    gapExtend: number;
  },
): string {
  const algo = algorithm.toLowerCase();
  if (gotohExtra && algo.includes('gotoh')) {
    const { layer, M, Ix, Iy, gapOpen, gapExtend } = gotohExtra;
    if (i <= 0 || j <= 0) {
      return `${layer}[${i},${j}]: boundary — initialise affine penalties along edges (see M / Ix / Iy tabs).`;
    }
    const ca = seqA[i - 1]?.toUpperCase() ?? '';
    const cb = seqB[j - 1]?.toUpperCase() ?? '';
    const sub =
      ca.length && cb.length && ca === cb ? match : mismatch;
    if (layer === 'M') {
      const m = M[i - 1]?.[j - 1];
      const x = Ix[i - 1]?.[j - 1];
      const y = Iy[i - 1]?.[j - 1];
      const vm = Number(m ?? NaN);
      const vx = Number(x ?? NaN);
      const vy = Number(y ?? NaN);
      let via = 'M−';
      if (Number.isFinite(vm) && Number.isFinite(vx) && Number.isFinite(vy)) {
        if (vm >= vx && vm >= vy) via = 'M−';
        else if (vx >= vy) via = 'Ix−';
        else via = 'Iy−';
      }
      return `M[${i},${j}] = max(${fmtCell(m)}M₋, ${fmtCell(x)}Ix₋, ${fmtCell(y)}Iy₋) + (${sub}) = ${fmtCell(M[i]?.[j])} · entered from ${via}`;
    }
    if (layer === 'Ix') {
      const fromM = M[i - 1]?.[j];
      const fromIx = Ix[i - 1]?.[j];
      const cM = Number(fromM ?? NaN) + gapOpen;
      const cIx = Number(fromIx ?? NaN) + gapExtend;
      const via = cM >= cIx ? 'M↑+open' : 'Ix↑+ext';
      return `Ix[${i},${j}] = max(${fmtCell(fromM)}+(${gapOpen}), ${fmtCell(fromIx)}+(${gapExtend})) = ${fmtCell(Ix[i]?.[j])} · ${via}`;
    }
    const fromM = M[i]?.[j - 1];
    const fromIy = Iy[i]?.[j - 1];
    const cM = Number(fromM ?? NaN) + gapOpen;
    const cIy = Number(fromIy ?? NaN) + gapExtend;
    const via = cM >= cIy ? 'M←+open' : 'Iy←+ext';
    return `Iy[${i},${j}] = max(${fmtCell(fromM)}+(${gapOpen}), ${fmtCell(fromIy)}+(${gapExtend})) = ${fmtCell(Iy[i]?.[j])} · ${via}`;
  }
  if (algo.includes('gotoh')) {
    return `Affine (Gotoh): open the M / Ix / Iy canvas tabs above — formula follows the active layer.`;
  }
  if (i <= 0 || j <= 0) {
    return 'Boundary row/column: initialise with cumulative gap penalties (or 0 for SW interior edges).';
  }
  const diag = dp[i - 1]?.[j - 1];
  const up = dp[i - 1]?.[j];
  const left = dp[i]?.[j - 1];
  const cur = dp[i]?.[j];
  const ca = seqA[i - 1]?.toUpperCase() ?? '';
  const cb = seqB[j - 1]?.toUpperCase() ?? '';
  const sub = ca.length && cb.length && ca === cb ? match : mismatch;
  const inner = `max(diag+s, up+g, left+g) = max(${fmtCell(diag)}+(${sub}), ${fmtCell(up)}+(${gap}), ${fmtCell(left)}+(${gap}))`;
  if (algo.includes('smith')) {
    return `SW: max(0, ${inner}) = ${fmtCell(cur)} · traceback prefers ${pred ?? '—'}`;
  }
  return `NW: ${inner} = ${fmtCell(cur)} · traceback prefers ${pred ?? '—'}`;
}

function cellColor(
  algorithm: string,
  val: number | null,
  i: number,
  j: number,
  maxPos: [number, number] | undefined,
  active: boolean | undefined,
  pulseBoost: number,
): { fill: string; text: string } {
  if (val === null) return { fill: 'rgba(17,32,56,0.9)', text: '#6B8FA8' };
  if (maxPos && i === maxPos[0] && j === maxPos[1]) {
    const pulse = 0.35 + 0.35 * pulseBoost;
    return { fill: `rgba(149,127,239,${pulse})`, text: '#ffffff' };
  }
  if (i === 0 || j === 0) return { fill: 'rgba(12,26,46,0.95)', text: '#6B8FA8' };
  if (algorithm.includes('smith') && val === 0)
    return { fill: 'rgba(28,35,48,0.98)', text: '#8899aa' };
  if (active === false && algorithm.includes('smith'))
    return { fill: 'rgba(20,28,42,0.85)', text: '#6B8FA8' };

  const t = Math.max(-50, Math.min(50, val));
  const u = (t + 50) / 100;
  const r = Math.round(5 + (27 - 5) * (1 - u));
  const g = Math.round(14 + (255 - 14) * u);
  const b = Math.round(42 + (184 - 42) * (1 - u));
  return { fill: `rgba(${r},${g},${b},0.85)`, text: val >= 0 ? '#E8F5F0' : '#FF5C57' };
}

function inferGotohWinnerM(
  M: (number | null)[][],
  Ix: (number | null)[][],
  Iy: (number | null)[][],
  i: number,
  j: number,
): 'M' | 'Ix' | 'Iy' {
  const m = Number(M[i - 1]?.[j - 1] ?? NaN);
  const x = Number(Ix[i - 1]?.[j - 1] ?? NaN);
  const y = Number(Iy[i - 1]?.[j - 1] ?? NaN);
  if (!Number.isFinite(m) || !Number.isFinite(x) || !Number.isFinite(y)) return 'M';
  if (m >= x && m >= y) return 'M';
  if (x >= y) return 'Ix';
  return 'Iy';
}

function inferGotohWinnerIx(M: (number | null)[][], Ix: (number | null)[][], i: number, j: number, go: number, ge: number): 'M' | 'Ix' {
  const cM = Number(M[i - 1]?.[j] ?? NaN) + go;
  const cIx = Number(Ix[i - 1]?.[j] ?? NaN) + ge;
  return cM >= cIx ? 'M' : 'Ix';
}

function inferGotohWinnerIy(M: (number | null)[][], Iy: (number | null)[][], i: number, j: number, go: number, ge: number): 'M' | 'Iy' {
  const cM = Number(M[i]?.[j - 1] ?? NaN) + go;
  const cIy = Number(Iy[i]?.[j - 1] ?? NaN) + ge;
  return cM >= cIy ? 'M' : 'Iy';
}

export default function DPCanvasVisualizer({
  dpTable,
  seqA,
  seqB,
  algorithm,
  maxPos,
  predecessor,
  tracebackPath,
  dpActiveRegion,
  match = 2,
  mismatch = -1,
  gap = -2,
  gapExtend = -0.5,
  gotohLayers,
  gotohTab = 'M',
  onGotohTabChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasGotohRefs = useRef<Record<GotohTab, HTMLCanvasElement | null>>({
    M: null,
    Ix: null,
    Iy: null,
  });

  const gotohMode = Boolean(gotohLayers && onGotohTabChange);
  const activeGrid = gotohMode ? gotohLayers![gotohTab] : dpTable;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ ax: number; ay: number; px: number; py: number } | null>(null);
  const [hover, setHover] = useState<{ i: number; j: number } | null>(null);
  const [pinned, setPinned] = useState<{ i: number; j: number } | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(20);
  const [glowTick, setGlowTick] = useState(0);
  const [traceProgress, setTraceProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rows = activeGrid.length;
  const cols = activeGrid[0]?.length ?? 0;
  const totalCells = rows * cols;
  const hideValues = rows > 202 || cols > 202;

  const cell = Math.max(14, BASE_CELL * zoom);
  const innerW = HEADER + cols * cell;
  const innerH = HEADER + rows * cell;

  const pulseBoost =
    algorithm.toLowerCase().includes('smith') && maxPos ? Math.sin(glowTick * 0.15) * 0.5 + 0.5 : 0;

  useEffect(() => {
    if (!algorithm.toLowerCase().includes('smith') || maxPos == null) return;
    const id = setInterval(() => setGlowTick((t) => t + 1), 90);
    return () => clearInterval(id);
  }, [algorithm, maxPos]);

  const matrixComplete = revealed >= totalCells && totalCells > 0;
  useEffect(() => {
    if (!matrixComplete || !tracebackPath || tracebackPath.length < 2) {
      setTraceProgress(0);
      return;
    }
    setTraceProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / 600);
      setTraceProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [matrixComplete, tracebackPath]);

  const currentFillIdx = revealed > 0 ? revealed - 1 : -1;
  const curI = currentFillIdx >= 0 ? Math.floor(currentFillIdx / cols) : -1;
  const curJ = currentFillIdx >= 0 ? currentFillIdx % cols : -1;

  const paintMatrix = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      grid: (number | null)[][],
      paintTab: GotohTab | null,
    ) => {
      const sr = scrollRef.current;
      const sl = sr?.scrollLeft ?? 0;
      const st = sr?.scrollTop ?? 0;
      const c = ctx.canvas;
      const vw = sr?.clientWidth ?? c.width;
      const vh = sr?.clientHeight ?? c.height;
      const margin = cell * 2;

      const visibleCell = (i: number, j: number) => {
        const bx = pan.x + HEADER + j * cell;
        const by = pan.y + HEADER + i * cell;
        return (
          bx + cell >= sl - margin &&
          bx <= sl + vw + margin &&
          by + cell >= st - margin &&
          by <= st + vh + margin
        );
      };

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#112038';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.save();
      ctx.translate(pan.x, pan.y);

      const mp = maxPos ?? undefined;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const x = HEADER + j * cell;
          const y = HEADER + i * cell;
          if (!visibleCell(i, j)) continue;

          const v = grid[i][j];
          const active = dpActiveRegion?.[i]?.[j];
          const { fill, text } = cellColor(algorithm, v, i, j, mp, active, pulseBoost);
          const showFill = i * cols + j < revealed;
          ctx.fillStyle = showFill ? fill : 'rgba(17,32,56,0.35)';
          ctx.fillRect(x, y, cell - 1, cell - 1);

          if (
            algorithm.toLowerCase().includes('smith') &&
            mp &&
            i === mp[0] &&
            j === mp[1] &&
            showFill &&
            v !== null
          ) {
            const pulse = 6 + pulseBoost * 12;
            ctx.strokeStyle = `rgba(255,183,0,${0.5 + pulseBoost * 0.45})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255,183,0,0.55)';
            ctx.shadowBlur = pulse;
            ctx.strokeRect(x + 1, y + 1, cell - 4, cell - 4);
            ctx.shadowBlur = 0;
          }

          if (showFill && v !== null && !hideValues) {
            ctx.fillStyle = text;
            ctx.font = `${Math.min(14, cell * 0.35)}px IBM Plex Mono, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(Math.round(v as number)), x + cell / 2, y + cell / 2);
          }
        }
      }

      /* Step-through: predecessor cell halos + current teal rim */
      const drawPredHalo = (pi: number, pj: number, stroke: string, glow: boolean) => {
        if (pi < 0 || pj < 0 || !visibleCell(pi, pj)) return;
        const px = HEADER + pj * cell;
        const py = HEADER + pi * cell;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = glow ? 2.5 : 2;
        ctx.shadowColor = glow ? stroke : 'transparent';
        ctx.shadowBlur = glow ? 8 : 0;
        ctx.strokeRect(px + 2, py + 2, cell - 5, cell - 5);
        ctx.shadowBlur = 0;
        ctx.fillStyle = glow ? `${stroke}22` : `${stroke}18`;
        ctx.fillRect(px + 2, py + 2, cell - 5, cell - 5);
      };

      const algoLow = algorithm.toLowerCase();
      const gotoh = algoLow.includes('gotoh') && gotohLayers && paintTab;

      if (curI >= 0 && curJ >= 0 && revealed > 0 && revealed <= totalCells && visibleCell(curI, curJ)) {
        const cx = HEADER + curJ * cell + cell / 2;
        const cy = HEADER + curI * cell + cell / 2;

        if (gotoh && curI > 0 && curJ > 0) {
          const { M, Ix, Iy } = gotohLayers;
          const go = gap;
          const ge = gapExtend;
          if (paintTab === 'M') {
            const wm = inferGotohWinnerM(M, Ix, Iy, curI, curJ);
            const col = wm === 'M' ? COL_DIAG : wm === 'Ix' ? COL_UP : COL_LEFT;
            drawPredHalo(curI - 1, curJ - 1, col, true);
          } else if (paintTab === 'Ix' && curI > 0) {
            const winIx = inferGotohWinnerIx(M, Ix, curI, curJ, go, ge);
            drawPredHalo(curI - 1, curJ, winIx === 'M' ? COL_DIAG : COL_UP, true);
          } else if (paintTab === 'Iy' && curJ > 0) {
            const winIy = inferGotohWinnerIy(M, Iy, curI, curJ, go, ge);
            drawPredHalo(curI, curJ - 1, winIy === 'M' ? COL_DIAG : COL_LEFT, true);
          }
        } else if (!gotoh && curI > 0 && curJ > 0) {
          const pred = predecessor?.[curI]?.[curJ];
          drawPredHalo(curI - 1, curJ - 1, COL_DIAG, pred === 'diag');
          drawPredHalo(curI - 1, curJ, COL_UP, pred === 'up');
          drawPredHalo(curI, curJ - 1, COL_LEFT, pred === 'left');
        }

        ctx.strokeStyle = 'rgba(27,255,184,0.98)';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(27,255,184,0.55)';
        ctx.shadowBlur = 10;
        ctx.strokeRect(HEADER + curJ * cell + 1, HEADER + curI * cell + 1, cell - 3, cell - 3);
        ctx.shadowBlur = 0;

        const pred = predecessor?.[curI]?.[curJ];

        const strokeArrow = (
          fx: number,
          fy: number,
          bold: boolean,
          colorBold: string,
          colorDim: string,
        ) => {
          ctx.strokeStyle = bold ? colorBold : colorDim;
          ctx.lineWidth = bold ? 3 : 1.35;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(cx, cy);
          ctx.stroke();
          const ang = Math.atan2(cy - fy, cx - fx);
          const ah = 0.35;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 9 * Math.cos(ang - ah), cy - 9 * Math.sin(ang - ah));
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 9 * Math.cos(ang + ah), cy - 9 * Math.sin(ang + ah));
          ctx.stroke();
        };

        if (gotoh && paintTab && curI > 0 && curJ > 0) {
          const { M, Ix, Iy } = gotohLayers;
          const go = gap;
          const ge = gapExtend;
          const bx = HEADER + (curJ - 1) * cell + cell / 2;
          const by = HEADER + (curI - 1) * cell + cell / 2;
          const dx = cx - bx;
          const dy = cy - by;
          const len = Math.max(1e-6, Math.hypot(dx, dy));
          const ox = (-dy / len) * 10;
          const oy = (dx / len) * 10;

          if (paintTab === 'M') {
            const w = inferGotohWinnerM(M, Ix, Iy, curI, curJ);
            strokeArrow(bx - ox, by - oy, w === 'M', COL_DIAG, '#3d4f60');
            strokeArrow(bx, by, w === 'Ix', COL_UP, '#3d4f60');
            strokeArrow(bx + ox, by + oy, w === 'Iy', COL_LEFT, '#3d4f60');
          } else if (paintTab === 'Ix' && curI > 0) {
            const ux = HEADER + curJ * cell + cell / 2;
            const uy = HEADER + (curI - 1) * cell + cell / 2;
            const w = inferGotohWinnerIx(M, Ix, curI, curJ, go, ge);
            strokeArrow(ux - 5, uy, w === 'M', COL_DIAG, '#3d4f60');
            strokeArrow(ux + 5, uy, w === 'Ix', COL_UP, '#3d4f60');
          } else if (paintTab === 'Iy' && curJ > 0) {
            const lx = HEADER + (curJ - 1) * cell + cell / 2;
            const ly = HEADER + curI * cell + cell / 2;
            const w = inferGotohWinnerIy(M, Iy, curI, curJ, go, ge);
            strokeArrow(lx, ly - 5, w === 'M', COL_DIAG, '#3d4f60');
            strokeArrow(lx, ly + 5, w === 'Iy', COL_LEFT, '#3d4f60');
          }
        } else if (!gotoh && predecessor && curI > 0 && curJ > 0) {
          const drawArrow = (fi: number, fj: number, kind: 'diag' | 'up' | 'left') => {
            if (!visibleCell(fi, fj)) return;
            const fx = HEADER + fj * cell + cell / 2;
            const fy = HEADER + fi * cell + cell / 2;
            const win = pred === kind;
            strokeArrow(
              fx,
              fy,
              win,
              kind === 'diag' ? COL_DIAG : kind === 'up' ? COL_UP : COL_LEFT,
              '#3d4f60',
            );
          };
          drawArrow(curI - 1, curJ - 1, 'diag');
          drawArrow(curI - 1, curJ, 'up');
          drawArrow(curI, curJ - 1, 'left');
        }
      }

      ctx.font = `${Math.min(13, cell * 0.32)}px IBM Plex Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let j = 0; j < cols; j++) {
        if (!visibleCell(0, j)) continue;
        const ch = j === 0 ? 'ε' : seqB[j - 1] ?? '';
        const hex = ch.length === 1 ? dnaBaseHex(ch) : null;
        ctx.fillStyle = hex ?? '#6B8FA8';
        ctx.fillText(ch, HEADER + j * cell + cell / 2, HEADER / 2);
      }
      for (let i = 0; i < rows; i++) {
        if (!visibleCell(i, 0)) continue;
        const ch = i === 0 ? 'ε' : seqA[i - 1] ?? '';
        const hex = ch.length === 1 ? dnaBaseHex(ch) : null;
        ctx.fillStyle = hex ?? '#6B8FA8';
        ctx.fillText(ch, HEADER / 2, HEADER + i * cell + cell / 2);
      }

      /* Traceback: 2px luminous line, reveal from optimal/end cell back toward origin */
      if (
        tracebackPath &&
        tracebackPath.length > 1 &&
        revealed >= totalCells &&
        traceProgress > 0 &&
        (!gotohMode || paintTab === 'M')
      ) {
        const pts = [...tracebackPath].reverse();
        const floatIdx = traceProgress * (pts.length - 1);
        const lo = Math.floor(floatIdx);
        const frac = floatIdx - lo;
        ctx.strokeStyle = 'rgba(27,255,184,0.92)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(27,255,184,0.55)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let idx = 0; idx <= lo; idx++) {
          const p = pts[idx];
          const px = HEADER + p.j * cell + cell / 2;
          const py = HEADER + p.i * cell + cell / 2;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        if (frac > 1e-4 && lo < pts.length - 1) {
          const a = pts[lo];
          const b = pts[lo + 1];
          const ax = HEADER + a.j * cell + cell / 2;
          const ay = HEADER + a.i * cell + cell / 2;
          const bx = HEADER + b.j * cell + cell / 2;
          const by = HEADER + b.i * cell + cell / 2;
          ctx.lineTo(ax + frac * (bx - ax), ay + frac * (by - ay));
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    },
    [
      algorithm,
      cols,
      rows,
      cell,
      revealed,
      pan,
      hideValues,
      pulseBoost,
      traceProgress,
      totalCells,
      tracebackPath,
      predecessor,
      curI,
      curJ,
      maxPos,
      dpActiveRegion,
      seqA,
      seqB,
      gap,
      gapExtend,
      gotohLayers,
      gotohMode,
    ],
  );

  const draw = useCallback(() => {
    if (gotohMode) {
      (['M', 'Ix', 'Iy'] as const).forEach((tab) => {
        const el = canvasGotohRefs.current[tab];
        const ctx = el?.getContext('2d');
        if (!ctx || !gotohLayers) return;
        paintMatrix(ctx, gotohLayers[tab], tab);
      });
      return;
    }
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!ctx) return;
    paintMatrix(ctx, dpTable, null);
  }, [dpTable, gotohLayers, gotohMode, paintMatrix]);

  useEffect(() => {
    draw();
  }, [draw, innerW, innerH, zoom]);

  useEffect(() => {
    const sr = scrollRef.current;
    if (!sr) return;
    const onScroll = () => draw();
    sr.addEventListener('scroll', onScroll, { passive: true });
    return () => sr.removeEventListener('scroll', onScroll);
  }, [draw]);

  useEffect(() => {
    if (gotohMode) {
      (['M', 'Ix', 'Iy'] as const).forEach((tab) => {
        const el = canvasGotohRefs.current[tab];
        if (el) {
          el.width = Math.floor(innerW);
          el.height = Math.floor(innerH);
        }
      });
    } else {
      const c = canvasRef.current;
      if (c) {
        c.width = Math.floor(innerW);
        c.height = Math.floor(innerH);
      }
    }
    draw();
  }, [innerW, innerH, draw, gotohMode]);

  const stopPlay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
  };

  const play = () => {
    stopPlay();
    setPlaying(true);
    timerRef.current = setInterval(() => {
      setRevealed((r) => {
        if (r >= totalCells) {
          stopPlay();
          return totalCells;
        }
        return r + 1;
      });
    }, Math.max(1, Math.min(500, speedMs)));
  };

  const stepNext = () => {
    stopPlay();
    setRevealed((r) => Math.min(r + 1, totalCells));
  };

  const stepPrev = () => {
    stopPlay();
    setRevealed((r) => Math.max(0, r - 1));
  };

  const resetAnim = () => {
    stopPlay();
    setRevealed(0);
    setTraceProgress(0);
  };

  const cellTipPosition = (i: number, j: number) => {
    const sr = scrollRef.current;
    if (!sr) return null;
    const srRect = sr.getBoundingClientRect();
    const cx =
      srRect.left + pan.x + HEADER + j * cell + cell / 2 - sr.scrollLeft;
    const cy =
      srRect.top + pan.y + HEADER + i * cell + cell / 2 - sr.scrollTop;
    return { left: cx, top: cy };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const sr = scrollRef.current;
    if (!sr) return;
    const srRect = sr.getBoundingClientRect();
    const mx = e.clientX - srRect.left + sr.scrollLeft - pan.x;
    const my = e.clientY - srRect.top + sr.scrollTop - pan.y;
    if (mx < HEADER || my < HEADER || mx > innerW || my > innerH) {
      setHover(null);
      return;
    }
    const j = Math.floor((mx - HEADER) / cell);
    const i = Math.floor((my - HEADER) / cell);
    if (i >= 0 && i < rows && j >= 0 && j < cols) setHover({ i, j });
    else setHover(null);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { ax: e.clientX, ay: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseUp = () => {
    drag.current = null;
  };
  const onMouseMovePan = (e: React.MouseEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.ax;
    const dy = e.clientY - drag.current.ay;
    setPan({ x: drag.current.px + dx, y: drag.current.py + dy });
  };

  const tip = pinned ?? hover;
  const tipVal = tip ? activeGrid[tip.i]?.[tip.j] : null;
  const tipPred =
    tip && predecessor?.[tip.i]?.[tip.j] != null ? predecessor[tip.i][tip.j] : null;

  const handleCanvasClick = () => {
    if (!hover) return;
    setPinned((p) =>
      p && p.i === hover.i && p.j === hover.j ? null : { i: hover.i, j: hover.j },
    );
  };

  const tooltipPos = tip ? cellTipPosition(tip.i, tip.j) : null;

  const exportCsv = () => {
    const grid = activeGrid;
    const lines = grid.map((row) => row.map((v) => (v === null ? '' : String(v))).join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dp_matrix_${gotohMode ? gotohTab : 'main'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const gotohExtra =
    gotohLayers && algorithm.toLowerCase().includes('gotoh')
      ? {
          layer: gotohTab,
          M: gotohLayers.M,
          Ix: gotohLayers.Ix,
          Iy: gotohLayers.Iy,
          gapOpen: gap,
          gapExtend,
        }
      : undefined;

  const formulaLine =
    curI >= 0 && curJ >= 0 && revealed > 0
      ? formatFormulaLine(
          algorithm,
          curI,
          curJ,
          activeGrid,
          seqA,
          seqB,
          match,
          mismatch,
          gap,
          predecessor?.[curI]?.[curJ],
          gotohExtra,
        )
      : revealed >= totalCells
        ? 'Matrix fill complete — traceback animates from the optimal cell back toward the origin (600ms).'
        : 'Step through with Previous / Next or Play; predecessor halos and arrows show competing transitions.';

  const setZoomClamped = (z: number) => setZoom(Math.min(4, Math.max(1, Math.round(z * 100) / 100)));

  const canvasHandlers = {
    onMouseMove: (e: React.MouseEvent) => {
      onMouseMove(e);
      onMouseMovePan(e);
    },
    onMouseDown,
    onMouseUp,
    onMouseLeave: () => {
      setHover(null);
      drag.current = null;
    },
    onClick: handleCanvasClick,
  };

  return (
    <div ref={wrapRef} className="space-y-3">
      {hideValues && (
        <div className="text-xs text-[var(--accent-amber)] border border-[var(--border-dim)] rounded-lg px-3 py-2 bg-[var(--bg-card)]">
          Matrix too large to display cell values — showing colour map only (sequences &gt; 200×200).
        </div>
      )}
      {gotohMode && onGotohTabChange && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
            Canvas layer
          </span>
          {(['M', 'Ix', 'Iy'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onGotohTabChange(t)}
              className={`text-xs px-3 py-1.5 rounded-lg border duration-200 transition-colors ${
                gotohTab === t
                  ? 'border-[var(--accent-teal)]/55 bg-[var(--accent-teal)]/12 text-[var(--accent-teal)]'
                  : 'border-[var(--border-dim)] bg-[var(--bg-deep)] text-[var(--text-muted)] hover:border-[var(--accent-teal)]/25'
              }`}
            >
              {t}
            </button>
          ))}
          <span className="text-[10px] text-[var(--text-muted)] ml-1">
            Inactive layers stay mounted; opacity crossfades (200ms).
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={resetAnim}
          className="text-xs px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-dim)]"
        >
          Reset
        </button>
        {playing ? (
          <button
            type="button"
            onClick={stopPlay}
            className="text-xs px-3 py-1 rounded-lg bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] border border-[var(--border-dim)]"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={play}
            disabled={revealed >= totalCells}
            className="text-xs px-3 py-1 rounded-lg bg-[var(--accent-teal)]/20 text-[var(--accent-teal)] border border-[var(--border-dim)] disabled:opacity-40"
          >
            Play
          </button>
        )}
        <button
          type="button"
          onClick={stepPrev}
          disabled={revealed <= 0}
          className="text-xs px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-dim)] disabled:opacity-40"
        >
          Previous step
        </button>
        <button
          type="button"
          onClick={stepNext}
          className="text-xs px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-dim)]"
        >
          Next step
        </button>
        <label className="text-xs text-[var(--text-muted)] flex items-center gap-2 min-w-[140px]">
          <span className="whitespace-nowrap">Speed</span>
          <input
            type="range"
            min={1}
            max={500}
            value={speedMs}
            onChange={(e) => setSpeedMs(+e.target.value)}
            className="flex-1 accent-[var(--accent-teal)]"
          />
          <span className="font-mono tabular-nums w-9">{speedMs}ms</span>
        </label>
        <div className="flex items-center gap-1 border border-[var(--border-dim)] rounded-lg px-1 bg-[var(--bg-card)]">
          <button
            type="button"
            className="text-xs px-2 py-1 rounded disabled:opacity-40"
            disabled={zoom <= 1}
            onClick={() => setZoomClamped(zoom - 0.25)}
          >
            −
          </button>
          <label className="text-xs text-[var(--text-muted)] flex items-center gap-1 px-1">
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoomClamped(+e.target.value)}
              className="w-24 accent-[var(--accent-teal)]"
            />
          </label>
          <button
            type="button"
            className="text-xs px-2 py-1 rounded disabled:opacity-40"
            disabled={zoom >= 4}
            onClick={() => setZoomClamped(zoom + 0.25)}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="text-xs px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-dim)] ml-auto"
        >
          Export CSV
        </button>
      </div>

      <div
        ref={scrollRef}
        className="relative rounded-xl border border-[var(--border-dim)] overflow-auto bg-[var(--bg-card)] max-h-[min(72vh,720px)]"
      >
        <div className="relative inline-block" style={{ width: innerW, height: innerH }}>
          {gotohMode ? (
            (['M', 'Ix', 'Iy'] as const).map((tab) => (
              <div
                key={tab}
                className="absolute left-0 top-0 transition-opacity duration-200 ease-out"
                style={{
                  width: innerW,
                  height: innerH,
                  opacity: gotohTab === tab ? 1 : 0,
                  pointerEvents: gotohTab === tab ? 'auto' : 'none',
                  zIndex: gotohTab === tab ? 2 : 1,
                }}
              >
                <canvas
                  ref={(el) => {
                    canvasGotohRefs.current[tab] = el;
                  }}
                  className="cursor-grab active:cursor-grabbing block"
                  {...canvasHandlers}
                />
              </div>
            ))
          ) : (
            <canvas
              ref={canvasRef}
              className="cursor-grab active:cursor-grabbing block"
              {...canvasHandlers}
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border-dim)] bg-[var(--bg-deep)] px-3 py-2 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--accent-teal)]">
          Recurrence (current step)
        </div>
        <p className="text-xs font-mono text-[var(--text-primary)] leading-relaxed">{formulaLine}</p>
      </div>

      {tip && tipVal !== null && tooltipPos && (
        <div
          className="fixed z-50 text-xs rounded-lg px-3 py-2 shadow-xl border border-[var(--border-dim)] bg-[#0a1628] text-white font-mono pointer-events-none max-w-[min(90vw,280px)]"
          style={{
            left: Math.max(8, tooltipPos.left - 90),
            top: Math.max(8, tooltipPos.top - 72),
          }}
        >
          <div>
            ({tip.i},{tip.j}) value={String(tipVal)}
          </div>
          <div className="text-slate-300 mt-0.5">from {predLabel(tipPred)}</div>
        </div>
      )}
    </div>
  );
}
