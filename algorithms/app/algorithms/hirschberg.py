"""
Hirschberg's Algorithm — Space-Optimised Global Alignment
Time:  O(m × n)
Space: O(min(m, n))  — only two 1-D rows kept in memory at once

The divide-and-conquer structure finds the optimal split point at the midpoint
row of seq_a, then recurses on both halves until base cases are resolved with
standard NW on tiny sub-problems.
"""

from typing import Union
from .scoring import get_score


# ---------------------------------------------------------------------------
# Linear-space scorer: returns only the last score row of the NW fill
# ---------------------------------------------------------------------------

def _nw_score_row(
    seq_a: str,
    seq_b: str,
    match: int,
    mismatch: int,
    gap: int,
    matrix: Union[dict, None],
) -> list[int]:
    """Return the final row of NW scores using only O(n) space."""
    n = len(seq_b)
    prev = [j * gap for j in range(n + 1)]

    for i in range(1, len(seq_a) + 1):
        curr = [0] * (n + 1)
        curr[0] = i * gap
        for j in range(1, n + 1):
            s = get_score(seq_a[i - 1], seq_b[j - 1], match, mismatch, matrix)
            curr[j] = max(
                prev[j - 1] + s,
                prev[j] + gap,
                curr[j - 1] + gap,
            )
        prev = curr

    return prev


# ---------------------------------------------------------------------------
# Main Hirschberg recursive alignment
# ---------------------------------------------------------------------------

def _hirschberg_rec(
    seq_a: str,
    seq_b: str,
    match: int,
    mismatch: int,
    gap: int,
    matrix: Union[dict, None],
) -> tuple[str, str]:
    """Recursively compute aligned strings."""
    m, n = len(seq_a), len(seq_b)

    # --- Base cases ---
    if m == 0:
        return "-" * n, seq_b
    if n == 0:
        return seq_a, "-" * m
    if m == 1 or n == 1:
        # Fall back to standard NW for tiny sub-problems
        from . import needleman_wunsch as nw
        result = nw.align(seq_a, seq_b, match, mismatch, gap, matrix)
        return result["aligned_a"], result["aligned_b"]

    # --- Divide: find optimal split column at row mid ---
    mid = m // 2

    score_fwd = _nw_score_row(seq_a[:mid], seq_b, match, mismatch, gap, matrix)
    score_rev = _nw_score_row(
        seq_a[mid:][::-1], seq_b[::-1], match, mismatch, gap, matrix
    )

    # Best split column: maximise fwd[j] + rev[n-j]
    split = max(range(n + 1), key=lambda j: score_fwd[j] + score_rev[n - j])

    # --- Conquer ---
    top_a, top_b = _hirschberg_rec(
        seq_a[:mid], seq_b[:split], match, mismatch, gap, matrix
    )
    bot_a, bot_b = _hirschberg_rec(
        seq_a[mid:], seq_b[split:], match, mismatch, gap, matrix
    )

    return top_a + bot_a, top_b + bot_b


def align(
    seq_a: str,
    seq_b: str,
    match: int = 1,
    mismatch: int = -1,
    gap: int = -2,
    matrix: Union[dict, None] = None,
) -> dict:
    aligned_a, aligned_b = _hirschberg_rec(seq_a, seq_b, match, mismatch, gap, matrix)

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

    # Compute final score by replaying the alignment
    score = 0
    for a, b in zip(aligned_a, aligned_b):
        if a == "-" or b == "-":
            score += gap
        else:
            score += get_score(a, b, match, mismatch, matrix)

    matches    = sum(1 for o in ops if o == "M")
    mismatches = sum(1 for o in ops if o == "X")
    gaps       = sum(1 for o in ops if o in ("I", "D"))

    return {
        "score": score,
        "aligned_a": aligned_a,
        "aligned_b": aligned_b,
        "operations": ops,
        "matches": matches,
        "mismatches": mismatches,
        "gaps": gaps,
        "identity": round(matches / max(len(ops), 1) * 100, 2),
        "dp_table": None,    # O(n) space — no full matrix available
        "seq_a_len": len(seq_a),
        "seq_b_len": len(seq_b),
    }
