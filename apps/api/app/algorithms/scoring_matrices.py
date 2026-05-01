"""Substitution matrices (BLOSUM62 / BLOSUM45 / BLOSUM80 / PAM250).

Published tables embedded as whitespace-separated squares (NCBI-style order).
DNA/RNA match–mismatch scoring lives in ``scoring.get_score``.
"""

from __future__ import annotations

from typing import Final, Literal

MatrixName = Literal["BLOSUM62", "BLOSUM45", "BLOSUM80", "PAM250"]

AA_ORDER: Final[str] = "ARNDCQEGHILKMFPSTWYV"


def _parse_square_matrix(text: str, order: str = AA_ORDER) -> dict[tuple[str, str], int]:
    """Parse an NxN matrix encoded as whitespace-separated rows.

    Expected format:
      A  R  N ...
    A  4 -1 -2 ...
    R -1  5  0 ...
    """
    lines = [ln.strip() for ln in text.strip().splitlines() if ln.strip() and not ln.strip().startswith("#")]
    header = lines[0].split()
    if "".join(header) != order:
        # Allow explicit header but keep safety checks.
        raise ValueError(f"Matrix header does not match expected order {order!r}. Got {''.join(header)!r}")
    mat: dict[tuple[str, str], int] = {}
    for row in lines[1:]:
        parts = row.split()
        aa = parts[0]
        vals = parts[1:]
        if aa not in order or len(vals) != len(order):
            raise ValueError("Invalid matrix row")
        for bb, v in zip(order, vals):
            mat[(aa, bb)] = int(float(v))
    return mat


# Full matrices (canonical AA order). Values sourced from standard published tables.
# Stored as embedded text to keep the service self-contained.
BLOSUM62: Final[dict[tuple[str, str], int]] = _parse_square_matrix(
    """
      A  R  N  D  C  Q  E  G  H  I  L  K  M  F  P  S  T  W  Y  V
    A  4 -1 -2 -2  0 -1 -1  0 -2 -1 -1 -1 -1 -2 -1  1  0 -3 -2  0
    R -1  5  0 -2 -3  1  0 -2  0 -3 -2  2 -1 -3 -2 -1 -1 -3 -2 -3
    N -2  0  6  1 -3  0  0  0  1 -3 -3  0 -2 -3 -2  1  0 -4 -2 -3
    D -2 -2  1  6 -3  0  2 -1 -1 -3 -4 -1 -3 -3 -1  0 -1 -4 -3 -3
    C  0 -3 -3 -3  9 -3 -4 -3 -3 -1 -1 -3 -1 -2 -3 -1 -1 -2 -2 -1
    Q -1  1  0  0 -3  5  2 -2  0 -3 -2  1  0 -3 -1  0 -1 -2 -1 -2
    E -1  0  0  2 -4  2  5 -2  0 -3 -3  1 -2 -3 -1  0 -1 -3 -2 -2
    G  0 -2  0 -1 -3 -2 -2  6 -2 -4 -4 -2 -3 -3 -2  0 -2 -2 -3 -3
    H -2  0  1 -1 -3  0  0 -2  8 -3 -3 -1 -2 -1 -2 -1 -2 -2  2 -3
    I -1 -3 -3 -3 -1 -3 -3 -4 -3  4  2 -3  1  0 -3 -2 -1 -3 -1  3
    L -1 -2 -3 -4 -1 -2 -3 -4 -3  2  4 -2  2  0 -3 -2 -1 -2 -1  1
    K -1  2  0 -1 -3  1  1 -2 -1 -3 -2  5 -1 -3 -1  0 -1 -3 -2 -2
    M -1 -1 -2 -3 -1  0 -2 -3 -2  1  2 -1  5  0 -2 -1 -1 -1 -1  1
    F -2 -3 -3 -3 -2 -3 -3 -3 -1  0  0 -3  0  6 -4 -2 -2  1  3 -1
    P -1 -2 -2 -1 -3 -1 -1 -2 -2 -3 -3 -1 -2 -4  7 -1 -1 -4 -3 -2
    S  1 -1  1  0 -1  0  0  0 -1 -2 -2  0 -1 -2 -1  4  1 -3 -2 -2
    T  0 -1  0 -1 -1 -1 -1 -2 -2 -1 -1 -1 -1 -2 -1  1  5 -2 -2  0
    W -3 -3 -4 -4 -2 -2 -3 -2 -2 -3 -2 -3 -1  1 -4 -3 -2 11  2 -3
    Y -2 -2 -2 -3 -2 -1 -2 -3  2 -1 -1 -2 -1  3 -3 -2 -2  2  7 -1
    V  0 -3 -3 -3 -1 -2 -2 -3 -3  3  1 -2  1 -1 -2 -2  0 -3 -1  4
    """
)

# BLOSUM45
BLOSUM45: Final[dict[tuple[str, str], int]] = _parse_square_matrix(
    """
      A  R  N  D  C  Q  E  G  H  I  L  K  M  F  P  S  T  W  Y  V
    A  5 -2 -1 -2 -1 -1 -1  0 -2 -1 -2 -1 -1 -2 -1  1  0 -2 -2  0
    R -2  7  0 -1 -3  1  0 -2  0 -3 -2  3 -1 -2 -2 -1 -1 -2 -1 -2
    N -1  0  6  2 -2  0  0  0  1 -2 -3  0 -2 -2 -2  1  0 -4 -2 -3
    D -2 -1  2  7 -3  0  2 -1  0 -4 -3  0 -3 -4 -1  0 -1 -4 -2 -3
    C -1 -3 -2 -3 12 -3 -3 -3 -3 -3 -2 -3 -2 -2 -4 -1 -1 -5 -3 -1
    Q -1  1  0  0 -3  6  2 -2  1 -2 -2  1  0 -4 -1  0 -1 -2 -1 -3
    E -1  0  0  2 -3  2  6 -2  0 -3 -2  1 -2 -3  0  0 -1 -3 -2 -3
    G  0 -2  0 -1 -3 -2 -2  7 -2 -4 -3 -2 -2 -3 -2  0 -2 -2 -3 -3
    H -2  0  1  0 -3  1  0 -2 10 -3 -2 -1  0 -2 -2 -1 -2 -3  2 -3
    I -1 -3 -2 -4 -3 -2 -3 -4 -3  5  2 -3  2  0 -3 -2 -1 -2 -1  3
    L -2 -2 -3 -3 -2 -2 -2 -3 -2  2  5 -3  2  1 -3 -3 -1 -2 -1  1
    K -1  3  0  0 -3  1  1 -2 -1 -3 -3  5 -1 -3 -1  0 -1 -3 -2 -2
    M -1 -1 -2 -3 -2  0 -2 -2  0  2  2 -1  6  0 -2 -2 -1 -2  0  1
    F -2 -2 -2 -4 -2 -4 -3 -3 -2  0  1 -3  0  8 -5 -2 -2  1  3  0
    P -1 -2 -2 -1 -4 -1  0 -2 -2 -3 -3 -1 -2 -5  9 -1 -1 -3 -3 -3
    S  1 -1  1  0 -1  0  0  0 -1 -2 -3  0 -2 -2 -1  4  2 -4 -2 -1
    T  0 -1  0 -1 -1 -1 -1 -2 -2 -1 -1 -1 -1 -2 -1  2  5 -3 -1  0
    W -2 -2 -4 -4 -5 -2 -3 -2 -3 -2 -2 -3 -2  1 -3 -4 -3 15  3 -3
    Y -2 -1 -2 -2 -3 -1 -2 -3  2 -1 -1 -2  0  3 -3 -2 -1  3  8 -1
    V  0 -2 -3 -3 -1 -3 -3 -3 -3  3  1 -2  1  0 -3 -1  0 -3 -1  5
    """
)

# BLOSUM80
BLOSUM80: Final[dict[tuple[str, str], int]] = _parse_square_matrix(
    """
      A  R  N  D  C  Q  E  G  H  I  L  K  M  F  P  S  T  W  Y  V
    A  5 -2 -2 -2 -1 -1 -1  0 -2 -2 -2 -1 -1 -3 -1  1  0 -3 -2  0
    R -2  6 -1 -2 -4  1 -1 -3  0 -3 -3  2 -2 -4 -2 -1 -1 -4 -3 -3
    N -2 -1  6  1 -3  0 -1 -1  0 -4 -4  0 -3 -4 -3  0  0 -4 -3 -4
    D -2 -2  1  6 -4 -1  1 -2 -2 -4 -5 -1 -4 -4 -2 -1 -1 -6 -4 -4
    C -1 -4 -3 -4  9 -4 -5 -4 -4 -2 -2 -4 -2 -3 -4 -2 -1 -3 -3 -1
    Q -1  1  0 -1 -4  6  2 -2  1 -3 -3  1  0 -4 -2  0 -1 -3 -2 -3
    E -1 -1 -1  1 -5  2  6 -3  0 -4 -4  1 -3 -4 -2  0 -1 -4 -3 -3
    G  0 -3 -1 -2 -4 -2 -3  6 -3 -5 -4 -2 -4 -4 -3 -1 -2 -4 -4 -4
    H -2  0  0 -2 -4  1  0 -3  8 -4 -3 -1 -2 -2 -3 -1 -2 -3  2 -4
    I -2 -3 -4 -4 -2 -3 -4 -5 -4  5  1 -3  1 -1 -4 -3 -1 -3 -2  3
    L -2 -3 -4 -5 -2 -3 -4 -4 -3  1  4 -3  2  0 -4 -3 -2 -2 -2  1
    K -1  2  0 -1 -4  1  1 -2 -1 -3 -3  5 -2 -4 -1 -1 -1 -4 -3 -3
    M -1 -2 -3 -4 -2  0 -3 -4 -2  1  2 -2  6 -1 -3 -2 -1 -2 -2  1
    F -3 -4 -4 -4 -3 -4 -4 -4 -2 -1  0 -4 -1  6 -4 -3 -2  0  3 -1
    P -1 -2 -3 -2 -4 -2 -2 -3 -3 -4 -4 -1 -3 -4  8 -1 -2 -5 -4 -3
    S  1 -1  0 -1 -2  0  0 -1 -1 -3 -3 -1 -2 -3 -1  5  1 -4 -2 -2
    T  0 -1  0 -1 -1 -1 -1 -2 -2 -1 -2 -1 -1 -2 -2  1  5 -4 -2  0
    W -3 -4 -4 -6 -3 -3 -4 -4 -3 -3 -2 -4 -2  0 -5 -4 -4 11  2 -3
    Y -2 -3 -3 -4 -3 -2 -3 -4  2 -2 -2 -3 -2  3 -4 -2 -2  2  7 -2
    V  0 -3 -4 -4 -1 -3 -3 -4 -4  3  1 -3  1 -1 -3 -2  0 -3 -2  4
    """
)

# PAM250 (canonical AA order mapped to same order for convenience)
PAM250: Final[dict[tuple[str, str], int]] = _parse_square_matrix(
    """
      A  R  N  D  C  Q  E  G  H  I  L  K  M  F  P  S  T  W  Y  V
    A  2 -2  0  0 -2  0  0  1 -1 -1 -2 -1 -1 -3  1  1  1 -6 -3  0
    R -2  6  0 -1 -4  1 -1 -3  2 -2 -3  3  0 -4  0  0 -1  2 -4 -2
    N  0  0  2  2 -4  1  1  0  2 -2 -3  1 -2 -3  0  1  0 -4 -2 -2
    D  0 -1  2  4 -5  2  3  1  1 -2 -4  0 -3 -6 -1  0  0 -7 -4 -2
    C -2 -4 -4 -5 12 -5 -5 -3 -3 -2 -6 -5 -5 -4 -3  0 -2 -8  0 -2
    Q  0  1  1  2 -5  4  2 -1  3 -2 -2  1 -1 -5  0 -1 -1 -5 -4 -2
    E  0 -1  1  3 -5  2  4  0  1 -2 -3  0 -2 -5 -1  0  0 -7 -4 -2
    G  1 -3  0  1 -3 -1  0  5 -2 -3 -4 -2 -3 -5  0  1  0 -7 -5 -1
    H -1  2  2  1 -3  3  1 -2  6 -2 -2  0 -2 -2  0 -1 -1 -3  0 -2
    I -1 -2 -2 -2 -2 -2 -2 -3 -2  5  2 -2  2  1 -2 -1  0 -5 -1  4
    L -2 -3 -3 -4 -6 -2 -3 -4 -2  2  6 -3  4  2 -3 -3 -2 -2 -1  2
    K -1  3  1  0 -5  1  0 -2  0 -2 -3  5  0 -5 -1  0  0 -3 -4 -2
    M -1  0 -2 -3 -5 -1 -2 -3 -2  2  4  0  6  0 -2 -2 -1 -4 -2  2
    F -3 -4 -3 -6 -4 -5 -5 -5 -2  1  2 -5  0  9 -5 -3 -3  0  7 -1
    P  1  0  0 -1 -3  0 -1  0  0 -2 -3 -1 -2 -5  6  1  0 -6 -5 -1
    S  1  0  1  0  0 -1  0  1 -1 -1 -3  0 -2 -3  1  2  1 -2 -3 -1
    T  1 -1  0  0 -2 -1  0  0 -1  0 -2  0 -1 -3  0  1  3 -5 -3  0
    W -6  2 -4 -7 -8 -5 -7 -7 -3 -5 -2 -3 -4  0 -6 -2 -5 17  0 -6
    Y -3 -4 -2 -4  0 -4 -4 -5  0 -1 -1 -4 -2  7 -5 -3 -3  0 10 -2
    V  0 -2 -2 -2 -2 -2 -2 -1 -2  4  2 -2  2 -1 -1 -1  0 -6 -2  4
    """
)

MATRICES: Final[dict[MatrixName, dict[tuple[str, str], int]]] = {
    "BLOSUM62": BLOSUM62,
    "BLOSUM45": BLOSUM45,
    "BLOSUM80": BLOSUM80,
    "PAM250": PAM250,
}
