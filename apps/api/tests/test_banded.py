"""Banded Needleman–Wunsch tests — parity with NW when band covers optimum + band_exceeded."""

import random

from algorithms import banded, needleman_wunsch
from algorithms.banded import nw_score_last_row_banded


def test_banded_equals_full_when_k_large():
    a = "A" * 30
    b = "A" * 30
    full = needleman_wunsch.align(a, b, 1, -1, -2)
    ban = banded.align(a, b, 1, -1, -2, bandwidth=500)
    assert not ban["band_exceeded"]
    assert ban["score"] == full["score"]


def test_banded_last_row_matches_dp_bottom_row():
    a = "ACGTACGTACGT"
    b = "ACGTACGTACGT"
    k = 5
    full = banded.align(a, b, 1, -1, -2, bandwidth=k)
    row = nw_score_last_row_banded(a, b, 1, -1, -2, None, k)
    m = len(a)
    assert full["dp_table"][m] == row


def test_banded_near_identical_matches_full_nw():
    rng = random.Random(77)
    ref = "".join(rng.choices("ACGT", k=450))

    def mutate(ref_: str, rate: float, seed: int) -> str:
        r2 = random.Random(seed + 7)
        bases = "ACGT"
        out: list[str] = []
        for c in ref_:
            if r2.random() < rate:
                out.append(r2.choice([x for x in bases if x != c]))
            else:
                out.append(c)
        return "".join(out)

    mut = mutate(ref, 0.01, 77)
    full = needleman_wunsch.align(ref, mut, 1, -1, -2)
    ban = banded.align(ref, mut, 1, -1, -2, bandwidth=100)
    assert not ban["band_exceeded"]
    assert ban["score"] == full["score"]


def test_banded_unreachable_sets_band_exceeded():
    """Strong length skew makes optimal alignment leave narrow band."""
    a = "A" * 40
    b = "A" * 10
    r = banded.align(a, b, 1, -1, -2, bandwidth=5)
    assert r["band_exceeded"]
