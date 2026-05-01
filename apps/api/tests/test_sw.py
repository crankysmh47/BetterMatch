"""Smith–Waterman unit tests (≥6 cases including published example)."""

from algorithms import smith_waterman


def test_sw_classic_published_example():
    """TGTTACGG vs GGTTGACTA — widely cited tutorial score with match=3 mismatch=-3 gap=-2."""
    r = smith_waterman.align("TGTTACGG", "GGTTGACTA", match=3, mismatch=-3, gap=-2)
    assert r["score"] == 13
    assert len(r["dp_active_region"]) == len(r["dp_table"])


def test_sw_identity_segment_global_like_score():
    r = smith_waterman.align("ACGT", "ACGT", match=2, mismatch=-1, gap=-2)
    assert r["score"] == 8


def test_sw_no_positive_similarity_returns_zero():
    r = smith_waterman.align("AAAA", "CCCC", match=1, mismatch=-5, gap=-2)
    assert r["score"] == 0


def test_sw_local_substring_embedded_in_noise():
    r = smith_waterman.align("XXXXXXXXACGTYYYY", "ZZACGTZZ", match=2, mismatch=-2, gap=-4)
    assert r["score"] >= 8
    assert "ACGT" in r["aligned_a"].replace("-", "") or "ACGT" in r["aligned_b"].replace("-", "")


def test_sw_max_pos_within_bounds():
    r = smith_waterman.align("AGCT", "TGCA", match=1, mismatch=-1, gap=-2)
    mi, mj = r["max_pos"]
    assert 0 <= mi <= len(r["dp_table"]) - 1
    assert 0 <= mj <= len(r["dp_table"][0]) - 1


def test_sw_nonempty_alignment_when_shared_homology():
    r = smith_waterman.align("GCATGCU", "GATTACA", match=1, mismatch=-1, gap=-2)
    assert r["score"] > 0
    assert len(r["operations"]) >= 1
