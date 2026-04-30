"""
Needleman-Wunsch Global Alignment
Time:  O(m × n)
Space: O(m × n)  — full DP matrix retained for traceback and visualisation
"""

from typing import Union
from .scoring import get_score


def align(
    seq_a: str,
    seq_b: str,
    match: int = 1,
    mismatch: int = -1,
    gap: int = -2,
    matrix: Union[dict, None] = None,
) -> dict:
    m, n = len(seq_a), len(seq_b)

    # --- Initialise DP table ---
    dp: list[list[int]] = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        dp[i][0] = dp[i - 1][0] + gap
    for j in range(1, n + 1):
        dp[0][j] = dp[0][j - 1] + gap

    # --- Fill ---
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            s = get_score(seq_a[i - 1], seq_b[j - 1], match, mismatch, matrix)
            dp[i][j] = max(
                dp[i - 1][j - 1] + s,   # diagonal (match/mismatch)
                dp[i - 1][j] + gap,      # up (gap in seq_b)
                dp[i][j - 1] + gap,      # left (gap in seq_a)
            )

    # --- Traceback ---
    aligned_a, aligned_b, ops = [], [], []
    i, j = m, n
    while i > 0 or j > 0:
        if i > 0 and j > 0:
            s = get_score(seq_a[i - 1], seq_b[j - 1], match, mismatch, matrix)
            if dp[i][j] == dp[i - 1][j - 1] + s:
                aligned_a.append(seq_a[i - 1])
                aligned_b.append(seq_b[j - 1])
                ops.append("M" if seq_a[i - 1].upper() == seq_b[j - 1].upper() else "X")
                i -= 1
                j -= 1
                continue
        
        if i > 0 and dp[i][j] == dp[i - 1][j] + gap:
            aligned_a.append(seq_a[i - 1])
            aligned_b.append("-")
            ops.append("D")
            i -= 1
        elif j > 0:
            aligned_a.append("-")
            aligned_b.append(seq_b[j - 1])
            ops.append("I")
            j -= 1

    aligned_a = "".join(reversed(aligned_a))
    aligned_b = "".join(reversed(aligned_b))
    ops = list(reversed(ops))

    matches    = sum(1 for o in ops if o == "M")
    mismatches = sum(1 for o in ops if o == "X")
    gaps       = sum(1 for o in ops if o in ("I", "D"))

    return {
        "score": dp[m][n],
        "aligned_a": aligned_a,
        "aligned_b": aligned_b,
        "operations": ops,
        "matches": matches,
        "mismatches": mismatches,
        "gaps": gaps,
        "identity": round(matches / max(len(ops), 1) * 100, 2),
        "dp_table": dp,                # full matrix for visualisation
        "seq_a_len": m,
        "seq_b_len": n,
    }
