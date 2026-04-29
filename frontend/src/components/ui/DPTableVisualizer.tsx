'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  dpTable: number[][];
  seqA: string;
  seqB: string;
  maxPos?: [number, number] | null;
  algorithm: string;
}

const CELL_SIZE = 40;
const HEADER_SIZE = 44;

export default function DPTableVisualizer({ dpTable, seqA, seqB, maxPos, algorithm }: Props) {
  const rows = dpTable.length;
  const cols = dpTable[0]?.length ?? 0;

  const [revealed, setRevealed] = useState(0); // number of cells revealed
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = rows * cols;

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setRevealed((prev) => {
        if (prev >= total - 1) {
          stop();
          return total;
        }
        return prev + 1;
      });
    }, 30);
  }, [total, stop]);

  const pause = useCallback(() => {
    stop();
  }, [stop]);

  const step = useCallback(() => {
    stop();
    setRevealed((prev) => Math.min(prev + 1, total));
  }, [total, stop]);

  const reset = useCallback(() => {
    stop();
    setRevealed(0);
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  const getColor = (i: number, j: number, value: number) => {
    if (maxPos && i === maxPos[0] && j === maxPos[1]) return 'bg-violet-500 text-white';
    if (i === 0 || j === 0) return 'bg-slate-700/60 text-slate-400';
    if (algorithm === 'smith_waterman' && value === 0) return 'bg-slate-800 text-slate-600';
    if (value > 0) return 'bg-emerald-900/50 text-emerald-300';
    if (value < 0) return 'bg-red-900/30 text-red-400';
    return 'bg-slate-800 text-slate-400';
  };

  const isFilled = (i: number, j: number) => i * cols + j < revealed;

  const canvasWidth  = HEADER_SIZE + cols * CELL_SIZE;
  const canvasHeight = HEADER_SIZE + rows * CELL_SIZE;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-colors"
        >
          Reset
        </button>
        {playing ? (
          <button
            onClick={pause}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={play}
            disabled={revealed >= total}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
          >
            Play
          </button>
        )}
        <button
          onClick={step}
          disabled={revealed >= total}
          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 text-sm font-medium transition-colors"
        >
          Step
        </button>
        <span className="text-slate-500 text-xs ml-2">
          {revealed} / {total} cells
        </span>
        <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all"
            style={{ width: `${(revealed / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl border border-slate-700 bg-slate-900/50">
        <div
          style={{ width: canvasWidth, height: canvasHeight, position: 'relative' }}
          className="font-mono text-xs select-none"
        >
          {/* Column headers (seq_b) */}
          <div
            style={{ position: 'absolute', top: 0, left: HEADER_SIZE, display: 'flex' }}
          >
            <div style={{ width: CELL_SIZE, height: HEADER_SIZE }} className="flex items-center justify-center text-slate-500 font-semibold">
              ε
            </div>
            {seqB.split('').map((ch, j) => (
              <div
                key={j}
                style={{ width: CELL_SIZE, height: HEADER_SIZE }}
                className="flex items-center justify-center text-sky-400 font-semibold uppercase"
              >
                {ch}
              </div>
            ))}
          </div>

          {/* Row headers (seq_a) + cells */}
          {dpTable.map((row, i) => (
            <div
              key={i}
              style={{ position: 'absolute', top: HEADER_SIZE + i * CELL_SIZE, left: 0, display: 'flex' }}
            >
              {/* Row header */}
              <div style={{ width: HEADER_SIZE, height: CELL_SIZE }} className="flex items-center justify-center text-sky-400 font-semibold uppercase">
                {i === 0 ? 'ε' : seqA[i - 1]}
              </div>
              {row.map((val, j) => (
                <div
                  key={j}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                  className={`flex items-center justify-center border border-slate-700/40 transition-all ${
                    isFilled(i, j)
                      ? `${getColor(i, j, val)} dp-cell-animate`
                      : 'opacity-0'
                  }`}
                >
                  {isFilled(i, j) ? val : ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-900/50 border border-emerald-700/40 inline-block" /> Positive</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-900/30 border border-red-700/40 inline-block" /> Negative</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-700 border border-slate-600 inline-block" /> Boundary</span>
        {maxPos && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-500 inline-block" /> Max score (SW)</span>}
      </div>
    </div>
  );
}
