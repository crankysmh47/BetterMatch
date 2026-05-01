'use client';

import { useCallback, useMemo, useState } from 'react';

export type TreeNode = {
  depth: number;
  seq_a_range: [number, number];
  seq_b_range: [number, number];
  split_column?: number | null;
  mid_row?: number | null;
  leaf?: boolean;
  children?: TreeNode[];
};

function pathKey(path: number[]): string {
  return path.join('/');
}

function treeMaxDepth(n: TreeNode): number {
  const kids = n.children ?? [];
  if (!kids.length) return n.depth;
  return Math.max(n.depth, ...kids.map(treeMaxDepth));
}

/** Root = darkest teal; deeper numerical depth → lighter (toward leaves). */
function depthFill(depth: number, maxDepth: number): string {
  const t = maxDepth <= 0 ? 0 : Math.min(1, depth / maxDepth);
  const r = Math.round(5 + (195 - 5) * t);
  const g = Math.round(32 + (255 - 32) * t);
  const b = Math.round(52 + (238 - 52) * t);
  return `rgb(${r},${g},${b})`;
}

function strokeForDepth(depth: number, maxDepth: number): string {
  const t = maxDepth <= 0 ? 0 : Math.min(1, depth / maxDepth);
  const alpha = 0.55 + 0.4 * (1 - t);
  return `rgba(27, 255, 184, ${alpha})`;
}

type LayoutRow = {
  id: string;
  parentId: string | null;
  path: number[];
  x: number;
  y: number;
  node: TreeNode;
};

const NODE_W = 224;
const NODE_H = 52;
const V_GAP = 12;
const H_DEPTH = 32;

function layoutRows(
  n: TreeNode,
  path: number[],
  collapsed: Set<string>,
  parentId: string | null,
  nextY: { v: number },
): LayoutRow[] {
  const id = pathKey(path);
  const depthIdx = Math.max(0, path.length - 1);
  const x = 16 + depthIdx * (NODE_W + H_DEPTH);
  const y = nextY.v;
  const row: LayoutRow = { id, parentId, path, x, y, node: n };
  const kids = n.children ?? [];
  if (!kids.length || collapsed.has(id)) {
    nextY.v += NODE_H + V_GAP;
    return [row];
  }
  const out: LayoutRow[] = [row];
  for (let i = 0; i < kids.length; i++) {
    out.push(...layoutRows(kids[i], [...path, i], collapsed, id, nextY));
  }
  return out;
}

function SubPreview({
  seq,
  range,
}: {
  seq: string;
  range: [number, number];
}) {
  const s = seq.slice(range[0], range[1]);
  const preview = s.length > 80 ? `${s.slice(0, 80)}…` : s;
  return <span className="text-[var(--text-primary)] break-all">{preview || '∅'}</span>;
}

export default function HirschbergTree({
  tree,
  seqA,
  seqB,
}: {
  tree: TreeNode | null | undefined;
  seqA: string;
  seqB: string;
}) {
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const toggleCollapsed = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const maxD = useMemo(() => (tree ? treeMaxDepth(tree) : 0), [tree]);

  const rows = useMemo(() => {
    if (!tree) return [];
    return layoutRows(tree, [0], collapsed, null, { v: 8 });
  }, [tree, collapsed]);

  const { svgW, svgH } = useMemo(() => {
    if (!rows.length) return { svgW: 400, svgH: 120 };
    let maxX = 0;
    let maxY = 0;
    for (const r of rows) {
      maxX = Math.max(maxX, r.x + NODE_W + 24);
      maxY = Math.max(maxY, r.y + NODE_H + 16);
    }
    return { svgW: maxX, svgH: maxY };
  }, [rows]);

  const rowMap = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  if (!tree) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-card)] p-4 space-y-4">
      <h3 className="font-bold text-[var(--text-primary)] font-[var(--font-display)] italic">
        Hirschberg recursion tree
      </h3>
      <p className="text-[11px] text-[var(--text-muted)] font-mono">
        SVG layout · click ▸ to collapse · node fill runs from dark (root) to light (deep leaves).
      </p>

      <div className="rounded-xl border border-[var(--border-dim)] bg-[var(--bg-deep)] overflow-auto max-h-[min(70vh,560px)]">
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="block min-w-full text-[12px] font-mono"
          role="img"
          aria-label="Hirschberg recursion tree"
        >
          {rows.map((r) => {
            const parent = r.parentId ? rowMap.get(r.parentId) : null;
            if (!parent) return null;
            const x1 = parent.x + NODE_W;
            const y1 = parent.y + NODE_H / 2;
            const x2 = r.x;
            const y2 = r.y + NODE_H / 2;
            const mx = (x1 + x2) / 2;
            return (
              <path
                key={`e-${r.id}`}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="rgba(27,255,184,0.35)"
                strokeWidth={1.5}
              />
            );
          })}

          {rows.map((r) => {
            const n = r.node;
            const kids = n.children ?? [];
            const hasKids = kids.length > 0;
            const isCollapsed = collapsed.has(r.id);
            const fill = depthFill(n.depth, maxD);
            const stroke = strokeForDepth(n.depth, maxD);
            const tx = r.x + (hasKids ? 32 : 12);

            return (
              <g key={r.id}>
                <rect
                  x={r.x}
                  y={r.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1.5}
                  pointerEvents="none"
                />
                <rect
                  x={r.x + (hasKids ? 28 : 0)}
                  y={r.y}
                  width={hasKids ? NODE_W - 28 : NODE_W}
                  height={NODE_H}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => setSelected(n)}
                />
                {hasKids && (
                  <rect
                    x={r.x}
                    y={r.y}
                    width={28}
                    height={NODE_H}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCollapsed(r.id);
                    }}
                  />
                )}
                {hasKids && (
                  <text
                    x={r.x + 14}
                    y={r.y + NODE_H / 2 + 5}
                    fill="rgba(232,245,240,0.95)"
                    fontSize={13}
                    fontFamily="var(--font-mono), IBM Plex Mono, monospace"
                    pointerEvents="none"
                  >
                    {isCollapsed ? '▸' : '▾'}
                  </text>
                )}
                <text
                  x={tx}
                  y={r.y + 17}
                  fill="#6B8FA8"
                  fontSize={9}
                  fontFamily="var(--font-mono), IBM Plex Mono, monospace"
                  pointerEvents="none"
                  style={{ textTransform: 'uppercase' }}
                >
                  depth {n.depth}
                  {n.leaf ? ' · leaf' : ''}
                </text>
                <text
                  x={tx}
                  y={r.y + 32}
                  fill="#E8F5F0"
                  fontSize={10}
                  fontFamily="var(--font-mono), IBM Plex Mono, monospace"
                  pointerEvents="none"
                >
                  {`A[${n.seq_a_range[0]}…${n.seq_a_range[1]}) · B[${n.seq_b_range[0]}…${n.seq_b_range[1]})`}
                </text>
                {n.split_column != null && (
                  <text
                    x={tx}
                    y={r.y + 46}
                    fill="#1BFFB8"
                    fontSize={9}
                    fontFamily="var(--font-mono), IBM Plex Mono, monospace"
                    pointerEvents="none"
                  >
                    {`split col ${n.split_column}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {selected && (
        <div className="text-xs font-mono border-t border-[var(--border-dim)] pt-3 space-y-2 text-[var(--text-muted)]">
          <div className="text-[var(--accent-teal)]">Sub-alignment at selected node</div>
          <div>
            <span className="text-[var(--text-muted)]">A: </span>
            <SubPreview seq={seqA} range={selected.seq_a_range} />
          </div>
          <div>
            <span className="text-[var(--text-muted)]">B: </span>
            <SubPreview seq={seqB} range={selected.seq_b_range} />
          </div>
        </div>
      )}
    </div>
  );
}
