"""
Banded Needleman-Wunsch (global alignment).

Only computes cells where |i - j| <= k. Cells outside are treated as -inf.
If the final cell is unreachable within the band, callers should fall back to
full NW.
"""

from __future__ import annotations

from typing import Union

from .scoring import get_score
from .stats_utils import alignment_stats

NEG_INF = -10**15


def nw_score_last_row_banded(
    seq_a: str,
    seq_b: str,
    match: int,
    mismatch: int,
    gap: int,
    matrix: Union[dict, None],
    bandwidth: int,
) -> list[int]:
    """Last row of NW DP restricted to |i−j| ≤ k (same recurrence as full banded NW).

    Used by banded Hirschberg for forward/backward row scoring with O(n) memory per row.
    """
    m, n = len(seq_a), len(seq_b)
    k = max(0, int(bandwidth))
    prev = [NEG_INF] * (n + 1)
    curr = [NEG_INF] * (n + 1)

    prev[0] = 0
    for j in range(1, n + 1):
        if abs(0 - j) <= k:
            prev[j] = prev[j - 1] + gap
        else:
            prev[j] = NEG_INF

    for i in range(1, m + 1):
        curr = [NEG_INF] * (n + 1)
        if abs(i - 0) <= k:
            curr[0] = prev[0] + gap if prev[0] > NEG_INF / 2 else NEG_INF

        j_start = max(1, i - k)
        j_end = min(n, i + k)
        for j in range(j_start, j_end + 1):
            s = get_score(seq_a[i - 1], seq_b[j - 1], match, mismatch, matrix)
            diag = prev[j - 1]
            up = prev[j]
            left = curr[j - 1]
            best = max(
                diag + s if diag > NEG_INF / 2 else int(NEG_INF),
                up + gap if up > NEG_INF / 2 else int(NEG_INF),
                left + gap if left > NEG_INF / 2 else int(NEG_INF),
            )
            curr[j] = best
        prev, curr = curr, prev

    return prev


def align(
    seq_a: str,
    seq_b: str,
    match: int = 1,
    mismatch: int = -1,
    gap: int = -2,
    matrix: Union[dict, None] = None,
    bandwidth: int = 50,
) -> dict:
    m, n = len(seq_a), len(seq_b)
    k = max(0, int(bandwidth))

    dp: list[list[int]] = [[int(NEG_INF)] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = 0

    # Initialise within band along boundaries
    for i in range(1, m + 1):
        if abs(i - 0) <= k:
            dp[i][0] = dp[i - 1][0] + gap
    for j in range(1, n + 1):
        if abs(0 - j) <= k:
            dp[0][j] = dp[0][j - 1] + gap

    # Fill only inside band
    for i in range(1, m + 1):
        j_start = max(1, i - k)
        j_end = min(n, i + k)
        for j in range(j_start, j_end + 1):
            s = get_score(seq_a[i - 1], seq_b[j - 1], match, mismatch, matrix)
            diag = dp[i - 1][j - 1]
            up = dp[i - 1][j]
            left = dp[i][j - 1]
            best = max(
                diag + s if diag > NEG_INF / 2 else int(NEG_INF),
                up + gap if up > NEG_INF / 2 else int(NEG_INF),
                left + gap if left > NEG_INF / 2 else int(NEG_INF),
            )
            dp[i][j] = best

    # If unreachable, signal caller to fall back
    if dp[m][n] <= NEG_INF / 2:
        return {
            "score": int(NEG_INF),
            "aligned_a": "",
            "aligned_b": "",
            "operations": [],
            "matches": 0,
            "mismatches": 0,
            "gaps": 0,
            "identity": 0.0,
            "dp_table": None,
            "seq_a_len": m,
            "seq_b_len": n,
            "band_exceeded": True,
        }

    # Traceback (stays inside band by construction, but be defensive)
    aligned_a: list[str] = []
    aligned_b: list[str] = []
    ops: list[str] = []
    traceback_path: list[list[int]] = []
    i, j = m, n
    traceback_path.append([i, j])
    while i > 0 or j > 0:
        if i > 0 and j > 0 and dp[i - 1][j - 1] > NEG_INF / 2:
            s = get_score(seq_a[i - 1], seq_b[j - 1], match, mismatch, matrix)
            if dp[i][j] == dp[i - 1][j - 1] + s:
                aligned_a.append(seq_a[i - 1])
                aligned_b.append(seq_b[j - 1])
                ops.append("M" if seq_a[i - 1].upper() == seq_b[j - 1].upper() else "X")
                i -= 1
                j -= 1
                traceback_path.append([i, j])
                continue

        if i > 0 and dp[i - 1][j] > NEG_INF / 2 and dp[i][j] == dp[i - 1][j] + gap:
            aligned_a.append(seq_a[i - 1])
            aligned_b.append("-")
            ops.append("D")
            i -= 1
            traceback_path.append([i, j])
            continue

        if j > 0 and dp[i][j - 1] > NEG_INF / 2 and dp[i][j] == dp[i][j - 1] + gap:
            aligned_a.append("-")
            aligned_b.append(seq_b[j - 1])
            ops.append("I")
            j -= 1
            traceback_path.append([i, j])
            continue

        # If we cannot traceback cleanly, treat as band exceeded
        return {
            "score": int(NEG_INF),
            "aligned_a": "",
            "aligned_b": "",
            "operations": [],
            "matches": 0,
            "mismatches": 0,
            "gaps": 0,
            "identity": 0.0,
            "dp_table": None,
            "seq_a_len": m,
            "seq_b_len": n,
            "band_exceeded": True,
        }

    aligned_a_str = "".join(reversed(aligned_a))
    aligned_b_str = "".join(reversed(aligned_b))
    ops = list(reversed(ops))
    traceback_path.reverse()

    matches = sum(1 for o in ops if o == "M")
    mismatches = sum(1 for o in ops if o == "X")
    gaps = sum(1 for o in ops if o in ("I", "D"))

    st = alignment_stats(aligned_a_str, aligned_b_str, match, mismatch, matrix)

    # For visualisation, return the full table including -inf sentinel values.
    dp_int = [[int(v) for v in row] for row in dp]

    return {
        "score": int(dp[m][n]),
        "aligned_a": aligned_a_str,
        "aligned_b": aligned_b_str,
        "operations": ops,
        "matches": matches,
        "mismatches": mismatches,
        "gaps": gaps,
        "identity": round(matches / max(len(ops), 1) * 100, 2),
        "identity_pct": st["identity_pct"],
        "similarity_pct": st["similarity_pct"],
        "gap_pct": st["gap_pct"],
        "alignment_length": int(st["alignment_length"]),
        "traceback_path": [{"i": a, "j": b} for a, b in traceback_path],
        "dp_table": dp_int,
        "seq_a_len": m,
        "seq_b_len": n,
        "band_exceeded": False,
    }

