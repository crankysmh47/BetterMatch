"""Needleman–Wunsch unit tests (≥8 cases per course spec)."""

from algorithms import needleman_wunsch
from algorithms.scoring_matrices import BLOSUM62


def test_nw_gattaca_known():
    a, b = "GATTACA", "GCATGCU"
    r = needleman_wunsch.align(a, b, match=1, mismatch=-1, gap=-1)
    assert r["score"] == 0
    assert len(r["aligned_a"]) == len(r["aligned_b"])
    assert r["traceback_path"][0] == {"i": 0, "j": 0}


def test_nw_empty_seq_a():
    r = needleman_wunsch.align("", "ACGT", match=1, mismatch=-1, gap=-2)
    assert r["aligned_a"] == "----"
    assert r["aligned_b"] == "ACGT"
    assert r["score"] == 4 * (-2)


def test_nw_identical_sequences():
    r = needleman_wunsch.align("ACGTAC", "ACGTAC", match=2, mismatch=-1, gap=-2)
    assert r["gaps"] == 0
    assert r["score"] == 12


def test_nw_single_character_match():
    r = needleman_wunsch.align("G", "G", match=5, mismatch=-3, gap=-4)
    assert r["aligned_a"] == "G"
    assert r["aligned_b"] == "G"
    assert r["score"] == 5


def test_nw_single_character_prefers_gap_alignment_when_costly():
    r = needleman_wunsch.align("A", "C", match=1, mismatch=-1, gap=-1)
    assert len(r["aligned_a"]) == len(r["aligned_b"])
    assert r["score"] == max(-1, 2 * (-1))


def test_nw_protein_blosum_identity():
    r = needleman_wunsch.align("MAFK", "MAFK", match=1, mismatch=-1, gap=-10, matrix=BLOSUM62)
    assert r["gaps"] == 0
    assert r["score"] > 0


def test_nw_protein_blosum_substitution_penalty():
    r = needleman_wunsch.align("AA", "KK", match=1, mismatch=-1, gap=-10, matrix=BLOSUM62)
    assert BLOSUM62[("A", "K")] < 0
    assert r["score"] == BLOSUM62[("A", "K")] + BLOSUM62[("A", "K")]


def test_nw_alignment_heavy_indels_long_strings():
    """Long prefix/suffix match with forced central insertion — many gap ops."""
    a = "AAAAAACGTAAAAAA"
    b = "AAAAAACGTACGTAAAAAA"
    r = needleman_wunsch.align(a, b, match=2, mismatch=-2, gap=-1)
    assert r["gaps"] >= 2
    assert r["score"] is not None
