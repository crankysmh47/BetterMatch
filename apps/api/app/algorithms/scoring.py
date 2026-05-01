"""Scoring helpers: DNA/RNA match–mismatch and protein matrix lookup."""

from __future__ import annotations

from .scoring_matrices import MATRICES, MatrixName


def get_score(
    a: str,
    b: str,
    match: int = 1,
    mismatch: int = -1,
    matrix: dict[tuple[str, str], int] | None = None,
) -> int:
    """Return substitution score for characters a and b."""
    a = a.upper()
    b = b.upper()
    # Ambiguous nucleotide N matches anything neutrally
    if a == "N" or b == "N":
        return 0
    if matrix:
        key = (a, b)
        if key in matrix:
            return matrix[key]
        rev = (b, a)
        if rev in matrix:
            return matrix[rev]
        return mismatch
    return match if a == b else mismatch


def get_matrix(name: MatrixName) -> dict[tuple[str, str], int]:
    return MATRICES[name]


__all__ = ["MATRICES", "MatrixName", "get_matrix", "get_score"]
