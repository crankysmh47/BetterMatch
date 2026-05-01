"""Scoring helpers."""

from algorithms.scoring import get_score, get_matrix
from algorithms.scoring_matrices import BLOSUM62


def test_ambiguous_n_scores_zero_dna():
    assert get_score("N", "A", 5, -4) == 0
    assert get_score("G", "N", 5, -4) == 0


def test_matrix_lookup_reverse_symmetric():
    assert get_score("W", "F", 1, -1, BLOSUM62) == BLOSUM62[("W", "F")]
    assert get_score("F", "W", 1, -1, BLOSUM62) == BLOSUM62[("W", "F")]


def test_unknown_aa_pair_falls_back_to_mismatch_penalty():
    assert get_score("@", "A", 1, -99, BLOSUM62) == -99


def test_get_matrix_returns_blosum62():
    m = get_matrix("BLOSUM62")
    assert m[("L", "L")] > 0
