"""
Gotoh algorithm (global alignment with affine gap penalties).

Uses three DP matrices:
  M  : alignment ends with a match/mismatch
  Ix : alignment ends with a gap in seq_b (i.e., character from seq_a aligned to '-')
  Iy : alignment ends with a gap in seq_a (i.e., '-' aligned to character from seq_b)
"""

from __future__ import annotations

from typing import Literal

from .scoring import get_score
from .stats_utils import alignment_stats


NEG_INF = -10**15
State = Literal["M", "Ix", "Iy"]


def align(
    seq_a: str,
    seq_b: str,
    match: int = 1,
    mismatch: int = -1,
    gap_open: float = -2.0,
    gap_extend: float = -0.5,
    matrix: dict[tuple[str, str], int] | None = None,
) -> dict:
    m, n = len(seq_a), len(seq_b)

    # DP matrices
    M: list[list[float]] = [[NEG_INF] * (n + 1) for _ in range(m + 1)]
    Ix: list[list[float]] = [[NEG_INF] * (n + 1) for _ in range(m + 1)]
    Iy: list[list[float]] = [[NEG_INF] * (n + 1) for _ in range(m + 1)]

    # Traceback pointers: store previous state
    tbM: list[list[State | None]] = [[None] * (n + 1) for _ in range(m + 1)]
    tbIx: list[list[State | None]] = [[None] * (n + 1) for _ in range(m + 1)]
    tbIy: list[list[State | None]] = [[None] * (n + 1) for _ in range(m + 1)]

    # Initialise
    M[0][0] = 0.0
    tbM[0][0] = None

    # First column: gaps in seq_b (use Ix)
    for i in range(1, m + 1):
        score = gap_open + (i - 1) * gap_extend
        M[i][0] = score
        Ix[i][0] = score
        tbM[i][0] = "Ix" if i > 1 else "M"
        tbIx[i][0] = "Ix" if i > 1 else "M"
        # Iy[i][0] remains -inf

    # First row: gaps in seq_a (use Iy)
    for j in range(1, n + 1):
        score = gap_open + (j - 1) * gap_extend
        M[0][j] = score
        Iy[0][j] = score
        tbM[0][j] = "Iy" if j > 1 else "M"
        tbIy[0][j] = "Iy" if j > 1 else "M"
        # Ix[0][j] remains -inf

    # Fill
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            sub = float(get_score(seq_a[i - 1], seq_b[j - 1], match, mismatch, matrix))

            # M
            prevM = M[i - 1][j - 1]
            prevIx = Ix[i - 1][j - 1]
            prevIy = Iy[i - 1][j - 1]
            best_prev = max(prevM, prevIx, prevIy)
            if best_prev == prevM:
                tbM[i][j] = "M"
            elif best_prev == prevIx:
                tbM[i][j] = "Ix"
            else:
                tbM[i][j] = "Iy"
            M[i][j] = best_prev + sub

            # Ix: gap in seq_b (consume seq_a)
            cand_from_M = M[i - 1][j] + gap_open
            cand_from_Ix = Ix[i - 1][j] + gap_extend
            if cand_from_M >= cand_from_Ix:
                Ix[i][j] = cand_from_M
                tbIx[i][j] = "M"
            else:
                Ix[i][j] = cand_from_Ix
                tbIx[i][j] = "Ix"

            # Iy: gap in seq_a (consume seq_b)
            cand_from_M = M[i][j - 1] + gap_open
            cand_from_Iy = Iy[i][j - 1] + gap_extend
            if cand_from_M >= cand_from_Iy:
                Iy[i][j] = cand_from_M
                tbIy[i][j] = "M"
            else:
                Iy[i][j] = cand_from_Iy
                tbIy[i][j] = "Iy"

    # Choose best end state
    endM, endIx, endIy = M[m][n], Ix[m][n], Iy[m][n]
    score = max(endM, endIx, endIy)
    if score == endM:
        state: State = "M"
    elif score == endIx:
        state = "Ix"
    else:
        state = "Iy"

    # Traceback
    aligned_a: list[str] = []
    aligned_b: list[str] = []
    ops: list[str] = []

    i, j = m, n
    while i > 0 or j > 0:
        if state == "M":
            prev = tbM[i][j]
            if i == 0:
                # Must consume from seq_b as gap in seq_a
                state = "Iy"
                continue
            if j == 0:
                state = "Ix"
                continue
            aligned_a.append(seq_a[i - 1])
            aligned_b.append(seq_b[j - 1])
            ops.append("M" if seq_a[i - 1].upper() == seq_b[j - 1].upper() else "X")
            i -= 1
            j -= 1
            state = prev or "M"
        elif state == "Ix":
            prev = tbIx[i][j]
            if i == 0:
                # Shouldn't happen, but keep safe
                state = "Iy"
                continue
            aligned_a.append(seq_a[i - 1])
            aligned_b.append("-")
            ops.append("D")
            i -= 1
            state = prev or "M"
        else:  # Iy
            prev = tbIy[i][j]
            if j == 0:
                state = "Ix"
                continue
            aligned_a.append("-")
            aligned_b.append(seq_b[j - 1])
            ops.append("I")
            j -= 1
            state = prev or "M"

    aligned_a_str = "".join(reversed(aligned_a))
    aligned_b_str = "".join(reversed(aligned_b))
    ops = list(reversed(ops))

    matches = sum(1 for o in ops if o == "M")
    mismatches = sum(1 for o in ops if o == "X")
    gaps = sum(1 for o in ops if o in ("I", "D"))

    st = alignment_stats(aligned_a_str, aligned_b_str, match, mismatch, matrix)

    return {
        "score": float(score),
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
        "traceback_path": None,
        # For Gotoh we return the three matrices; caller can decide what to visualise.
        "M_matrix": M,
        "Ix_matrix": Ix,
        "Iy_matrix": Iy,
        "dp_table": None,
        "seq_a_len": m,
        "seq_b_len": n,
    }

