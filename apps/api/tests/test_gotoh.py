"""Gotoh (affine gap) unit tests."""

from algorithms import gotoh, needleman_wunsch
from algorithms.scoring_matrices import BLOSUM62


def test_gotoh_vs_linear_equivalence_when_open_equals_extend():
    g = gotoh.align("ACGT", "ACGT", 2, -1, gap_open=-2, gap_extend=-2)
    nw = needleman_wunsch.align("ACGT", "ACGT", 2, -1, -2)
    assert abs(g["score"] - nw["score"]) < 1e-6


def test_gotoh_spec_pair_score():
    r = gotoh.align("ACGTTGCA", "TGCAACGT", 1, -1, gap_open=-2, gap_extend=-0.5)
    assert r["score"] == -3.0
    assert "ACGTTGCA" in r["aligned_a"].replace("-", "")
    assert "TGCAACGT" in r["aligned_b"].replace("-", "")


def _gap_runs(al_a: str, al_b: str) -> int:
    n = 0
    in_gap = False
    for x, y in zip(al_a, al_b):
        g = x == "-" or y == "-"
        if g and not in_gap:
            n += 1
            in_gap = True
        elif not g:
            in_gap = False
    return n


def test_gotoh_affine_consolidates_fractured_insertions_vs_nw():
    s1 = "AAAAAACCCCCCCCCCCCCCCCCCCCCCCCCAAAAAAAA"
    s2 = "AAAAAACCCCACAACAACAACAACAACAACAACAACAACAACAACAACAACAACAACAACAACAAAAAAAA"
    nw_r = needleman_wunsch.align(s1, s2, 2, -2, -1)
    go_r = gotoh.align(s1, s2, 2, -2, gap_open=-2, gap_extend=-0.5)
    assert _gap_runs(go_r["aligned_a"], go_r["aligned_b"]) <= _gap_runs(nw_r["aligned_a"], nw_r["aligned_b"])


def test_gotoh_short_protein_finite_score():
    r = gotoh.align("MAFK", "MAFK", 1, -1, gap_open=-11, gap_extend=-1, matrix=BLOSUM62)
    assert r["score"] > -1e10


def test_gotoh_open_extend_penalty_reduces_score_on_heavy_gaps():
    """Affine model penalises opening many separate gaps more than extending one."""
    a = "AAAAAAAA"
    b = "AAAACCCCAAAAAAAA"
    sparse = gotoh.align(a, b, 1, -1, gap_open=-5, gap_extend=-0.5)
    harsh_open = gotoh.align(a, b, 1, -1, gap_open=-10, gap_extend=-0.5)
    assert harsh_open["score"] <= sparse["score"]
