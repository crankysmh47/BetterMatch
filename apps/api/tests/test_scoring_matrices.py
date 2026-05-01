"""Substitution matrix structural checks (BLOSUM62 etc.)."""

from algorithms.scoring_matrices import AA_ORDER, BLOSUM62, MATRICES


def test_blosum62_symmetric_all_ordered_pairs():
    order = list(AA_ORDER)
    for i, a in enumerate(order):
        for b in order[i:]:
            assert BLOSUM62[(a, b)] == BLOSUM62[(b, a)]


def test_blosum62_diagonal_positive():
    for aa in AA_ORDER:
        assert BLOSUM62[(aa, aa)] > 0


def test_blosum62_values_reasonable_range():
    for a in AA_ORDER:
        for b in AA_ORDER:
            v = BLOSUM62[(a, b)]
            assert -25 <= v <= 25


def test_blosum62_expected_corner_entries():
    assert BLOSUM62[("A", "A")] == 4
    assert BLOSUM62[("W", "W")] == 11


def test_additional_named_matrices_load():
    for name in ("BLOSUM45", "BLOSUM80", "PAM250"):
        m = MATRICES[name]
        assert m[("V", "V")] > 0
