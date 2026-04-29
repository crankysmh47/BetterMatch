"""Scoring matrix utilities — supports simple match/mismatch/gap and BLOSUM62."""

from typing import Union

# Minimal BLOSUM62 subset (symmetric, common amino acids)
BLOSUM62: dict[tuple[str, str], int] = {
    ("A", "A"): 4,  ("A", "R"): -1, ("A", "N"): -2, ("A", "D"): -2, ("A", "C"): 0,
    ("A", "Q"): -1, ("A", "E"): -1, ("A", "G"): 0,  ("A", "H"): -2, ("A", "I"): -1,
    ("A", "L"): -1, ("A", "K"): -1, ("A", "M"): -1, ("A", "F"): -2, ("A", "P"): -1,
    ("A", "S"): 1,  ("A", "T"): 0,  ("A", "W"): -3, ("A", "Y"): -2, ("A", "V"): 0,
    ("R", "R"): 5,  ("R", "N"): 0,  ("R", "D"): -2, ("R", "C"): -3, ("R", "Q"): 1,
    ("R", "E"): 0,  ("R", "G"): -2, ("R", "H"): 0,  ("R", "I"): -3, ("R", "L"): -2,
    ("R", "K"): 2,  ("R", "M"): -1, ("R", "F"): -3, ("R", "P"): -2, ("R", "S"): -1,
    ("R", "T"): -1, ("R", "W"): -3, ("R", "Y"): -2, ("R", "V"): -3,
    ("N", "N"): 6,  ("N", "D"): 1,  ("N", "C"): -3, ("N", "Q"): 0,  ("N", "E"): 0,
    ("N", "G"): 0,  ("N", "H"): 1,  ("N", "I"): -3, ("N", "L"): -3, ("N", "K"): 0,
    ("N", "M"): -2, ("N", "F"): -3, ("N", "P"): -2, ("N", "S"): 1,  ("N", "T"): 0,
    ("N", "W"): -4, ("N", "Y"): -2, ("N", "V"): -3,
    # Nucleotide defaults handled via simple scoring below
}


def get_score(
    a: str,
    b: str,
    match: int = 1,
    mismatch: int = -1,
    matrix: Union[dict, None] = None,
) -> int:
    """Return substitution score for characters a and b."""
    if matrix:
        key = (a.upper(), b.upper())
        rev = (b.upper(), a.upper())
        if key in matrix:
            return matrix[key]
        if rev in matrix:
            return matrix[rev]
    return match if a.upper() == b.upper() else mismatch
