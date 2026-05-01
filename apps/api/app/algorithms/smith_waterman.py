"""
Smith-Waterman Local Alignment
Time:  O(m × n)
Space: O(m × n)  — full matrix retained for visualisation
"""

from __future__ import annotations

from typing import Union

from .scoring import get_score
from .stats_utils import alignment_stats


def align(
    seq_a: str,
    seq_b: str,
    match: int = 1,
    mismatch: int = -1,
    gap: int = -2,
    matrix: Union[dict, None] = None,
) -> dict:
    m, n = len(seq_a), len(seq_b)

    dp: list[list[int]] = [[0] * (n + 1) for _ in range(m + 1)]
    ptr: list[list[str | None]] = [[None] * (n + 1) for _ in range(m + 1)]

    max_score = 0
    max_pos = (0, 0)

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            s = get_score(seq_a[i - 1], seq_b[j - 1], match, mismatch, matrix)
            diag = dp[i - 1][j - 1] + s
            up = dp[i - 1][j] + gap
            left = dp[i][j - 1] + gap
            best = max(0, diag, up, left)
            dp[i][j] = best
            if best == 0:
                ptr[i][j] = None
            elif best == diag:
                ptr[i][j] = "diag"
            elif best == up:
                ptr[i][j] = "up"
            else:
                ptr[i][j] = "left"

            if dp[i][j] > max_score:
                max_score = dp[i][j]
                max_pos = (i, j)

    active_region = [[dp[i][j] > 0 for j in range(n + 1)] for i in range(m + 1)]

    aligned_a, aligned_b, ops = [], [], []
    traceback_path: list[list[int]] = []
    i, j = max_pos
    traceback_path.append([i, j])
    while i > 0 and j > 0 and dp[i][j] > 0:
        s = get_score(seq_a[i - 1], seq_b[j - 1], match, mismatch, matrix)
        if dp[i][j] == dp[i - 1][j - 1] + s:
            aligned_a.append(seq_a[i - 1])
            aligned_b.append(seq_b[j - 1])
            ops.append("M" if seq_a[i - 1].upper() == seq_b[j - 1].upper() else "X")
            i -= 1
            j -= 1
            traceback_path.append([i, j])
        elif dp[i][j] == dp[i - 1][j] + gap:
            aligned_a.append(seq_a[i - 1])
            aligned_b.append("-")
            ops.append("D")
            i -= 1
            traceback_path.append([i, j])
        elif dp[i][j] == dp[i][j - 1] + gap:
            aligned_a.append("-")
            aligned_b.append(seq_b[j - 1])
            ops.append("I")
            j -= 1
            traceback_path.append([i, j])
        else:
            break

    aligned_a = "".join(reversed(aligned_a))
    aligned_b = "".join(reversed(aligned_b))
    ops = list(reversed(ops))
    traceback_path.reverse()

    matches = sum(1 for o in ops if o == "M")
    mismatches = sum(1 for o in ops if o == "X")
    gaps = sum(1 for o in ops if o in ("I", "D"))

    st = alignment_stats(aligned_a, aligned_b, match, mismatch, matrix)

    return {
        "score": max_score,
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
        "dp_table": dp,
        "dp_active_region": active_region,
        "max_pos": list(max_pos),
        "traceback_path": [{"i": a, "j": b} for a, b in traceback_path],
        "predecessor": ptr,
        "seq_a_len": m,
        "seq_b_len": n,
    }
