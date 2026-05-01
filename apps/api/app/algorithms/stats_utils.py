"""Alignment statistics helpers (identity / similarity / gap %)."""

from __future__ import annotations

from typing import Union

from .scoring import get_score


def alignment_stats(
    aligned_a: str,
    aligned_b: str,
    match: int,
    mismatch: int,
    matrix: Union[dict[tuple[str, str], int], None],
) -> dict[str, float]:
    """Compute identity %, similarity %, gap % from an aligned pair."""
    length = len(aligned_a)
    if length == 0:
        return {"identity_pct": 0.0, "similarity_pct": 0.0, "gap_pct": 0.0, "alignment_length": 0}

    matches = 0
    similar = 0
    gaps = 0
    for a, b in zip(aligned_a, aligned_b):
        if a == "-" or b == "-":
            gaps += 1
            continue
        if a.upper() == b.upper():
            matches += 1
            similar += 1
            continue
        if matrix:
            sc = get_score(a, b, match, mismatch, matrix)
            if sc > 0:
                similar += 1
        # DNA mode (no matrix): similarity counts only identities

    al = float(length)
    return {
        "identity_pct": round(100.0 * matches / al, 4),
        "similarity_pct": round(100.0 * similar / al, 4),
        "gap_pct": round(100.0 * gaps / al, 4),
        "alignment_length": float(length),
    }
