"""
Hirschberg's Algorithm — Space-Optimised Global Alignment
Time:  O(m × n)
Space: O(min(m, n))  — only two 1-D rows kept in memory at once
"""

from __future__ import annotations

from typing import Any, Union

from .banded import nw_score_last_row_banded
from . import needleman_wunsch
from .scoring import get_score
from .stats_utils import alignment_stats


def _nw_score_row(
    seq_a: str,
    seq_b: str,
    match: int,
    mismatch: int,
    gap: int,
    matrix: Union[dict, None],
    bandwidth: Union[int, None] = None,
) -> list[int]:
    if bandwidth is not None and bandwidth > 0:
        return nw_score_last_row_banded(
            seq_a, seq_b, match, mismatch, gap, matrix, bandwidth
        )
    n = len(seq_b)
    prev = [j * gap for j in range(n + 1)]
    curr = [0] * (n + 1)

    for i in range(1, len(seq_a) + 1):
        curr[0] = i * gap
        for j in range(1, n + 1):
            s = get_score(seq_a[i - 1], seq_b[j - 1], match, mismatch, matrix)
            curr[j] = max(
                prev[j - 1] + s,
                prev[j] + gap,
                curr[j - 1] + gap,
            )
        prev[:] = curr

    return prev


def _hirschberg_rec(
    seq_a: str,
    seq_b: str,
    match: int,
    mismatch: int,
    gap: int,
    matrix: Union[dict, None],
    depth: int,
    off_a: int,
    off_b: int,
    bandwidth: Union[int, None] = None,
) -> tuple[str, str, dict[str, Any]]:
    m, n = len(seq_a), len(seq_b)

    node: dict[str, Any] = {
        "depth": depth,
        "seq_a_range": [off_a, off_a + m],
        "seq_b_range": [off_b, off_b + n],
        "split_column": None,
        "mid_row": None,
        "children": [],
    }

    if m == 0:
        node["leaf"] = True
        return "-" * n, seq_b, node
    if n == 0:
        node["leaf"] = True
        return seq_a, "-" * m, node
    if m == 1 or n == 1:
        from . import needleman_wunsch as nw

        node["leaf"] = True
        result = nw.align(seq_a, seq_b, match, mismatch, gap, matrix)
        node["nw_score"] = result["score"]
        return result["aligned_a"], result["aligned_b"], node

    mid = m // 2

    score_fwd = _nw_score_row(seq_a[:mid], seq_b, match, mismatch, gap, matrix, bandwidth)
    score_rev = _nw_score_row(
        seq_a[mid:][::-1], seq_b[::-1], match, mismatch, gap, matrix, bandwidth
    )

    split = max(range(n + 1), key=lambda j: score_fwd[j] + score_rev[n - j])
    node["split_column"] = off_b + split
    node["mid_row"] = off_a + mid

    top_a, top_b, child_top = _hirschberg_rec(
        seq_a[:mid],
        seq_b[:split],
        match,
        mismatch,
        gap,
        matrix,
        depth + 1,
        off_a,
        off_b,
        bandwidth,
    )
    bot_a, bot_b, child_bot = _hirschberg_rec(
        seq_a[mid:],
        seq_b[split:],
        match,
        mismatch,
        gap,
        matrix,
        depth + 1,
        off_a + mid,
        off_b + split,
        bandwidth,
    )
    node["children"] = [child_top, child_bot]

    return top_a + bot_a, top_b + bot_b, node


def _pack_alignment(
    seq_a: str,
    seq_b: str,
    aligned_a: str,
    aligned_b: str,
    tree: dict[str, Any],
    match: int,
    mismatch: int,
    gap: int,
    matrix: Union[dict, None],
    band_exceeded: bool = False,
) -> dict[str, Any]:
    ops = []
    for a, b in zip(aligned_a, aligned_b):
        if a == "-":
            ops.append("I")
        elif b == "-":
            ops.append("D")
        elif a.upper() == b.upper():
            ops.append("M")
        else:
            ops.append("X")

    score = 0
    for a, b in zip(aligned_a, aligned_b):
        if a == "-" or b == "-":
            score += gap
        else:
            score += get_score(a, b, match, mismatch, matrix)

    matches = sum(1 for o in ops if o == "M")
    mismatches = sum(1 for o in ops if o == "X")
    gaps = sum(1 for o in ops if o in ("I", "D"))

    st = alignment_stats(aligned_a, aligned_b, match, mismatch, matrix)

    return {
        "score": score,
        "aligned_a": aligned_a,
        "aligned_b": aligned_b,
        "operations": ops,
        "matches": matches,
        "mismatches": mismatches,
        "gaps": gaps,
        "identity": round(matches / max(len(ops), 1) * 100, 2),
        "identity_pct": st["identity_pct"],
        "similarity_pct": st["similarity_pct"],
        "gap_pct": st["gap_pct"],
        "alignment_length": int(st["alignment_length"]),
        "dp_table": None,
        "recursion_tree": tree,
        "traceback_path": None,
        "seq_a_len": len(seq_a),
        "seq_b_len": len(seq_b),
        "band_exceeded": band_exceeded,
    }


def align(
    seq_a: str,
    seq_b: str,
    match: int = 1,
    mismatch: int = -1,
    gap: int = -2,
    matrix: Union[dict, None] = None,
    bandwidth: Union[int, None] = None,
) -> dict[str, Any]:
    bw = bandwidth if bandwidth is not None and bandwidth > 0 else None
    aligned_a, aligned_b, tree = _hirschberg_rec(
        seq_a, seq_b, match, mismatch, gap, matrix, 0, 0, 0, bw
    )
    out = _pack_alignment(seq_a, seq_b, aligned_a, aligned_b, tree, match, mismatch, gap, matrix, False)

    if bw is not None:
        nw_ref = needleman_wunsch.align(seq_a, seq_b, match, mismatch, gap, matrix)
        if int(out["score"]) != int(nw_ref["score"]):
            aligned_a2, aligned_b2, tree2 = _hirschberg_rec(
                seq_a, seq_b, match, mismatch, gap, matrix, 0, 0, 0, None
            )
            out = _pack_alignment(
                seq_a,
                seq_b,
                aligned_a2,
                aligned_b2,
                tree2,
                match,
                mismatch,
                gap,
                matrix,
                band_exceeded=True,
            )
    return out
