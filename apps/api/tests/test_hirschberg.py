"""Hirschberg unit tests — score parity with NW and memory sanity."""

import tracemalloc

from algorithms import hirschberg, needleman_wunsch


def test_hirschberg_matches_nw_score_small():
    a, b = "AGCT", "AGTT"
    nw = needleman_wunsch.align(a, b, 1, -1, -2)
    hi = hirschberg.align(a, b, 1, -1, -2)
    assert hi["score"] == nw["score"]


def test_hirschberg_empty_seq_a_all_gaps():
    r = hirschberg.align("", "ACGT", 1, -1, -2)
    nw = needleman_wunsch.align("", "ACGT", 1, -1, -2)
    assert r["score"] == nw["score"]
    assert r["aligned_a"].replace("-", "") == ""
    assert "ACGT" in r["aligned_b"].replace("-", "")


def test_hirschberg_single_row_base_case_matches_nw():
    a, b = "A", "ACGT"
    assert hirschberg.align(a, b, 2, -1, -2)["score"] == needleman_wunsch.align(a, b, 2, -1, -2)["score"]


def test_hirschberg_banded_last_row_matches_full_on_near_identical():
    import random

    def near(ref: str, rate: float, seed: int) -> str:
        rng = random.Random(seed + 7)
        bases = "ACGT"
        out = []
        for c in ref:
            if rng.random() < rate:
                out.append(rng.choice([x for x in bases if x != c]))
            else:
                out.append(c)
        return "".join(out)

    rng = random.Random(12345)
    a = "".join(rng.choice("ACGT") for _ in range(350))
    b = near(a, 0.01, 12345)
    nw_s = needleman_wunsch.align(a, b, 1, -1, -2)["score"]
    hb_s = hirschberg.align(a, b, 1, -1, -2, bandwidth=100)["score"]
    assert hb_s == nw_s


def test_tracemalloc_hirschberg_much_smaller_than_nw():
    n = 900
    a = "C" * n
    b = "C" * n

    tracemalloc.start()
    hirschberg.align(a, b, 1, -1, -2)
    _, hb_peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    tracemalloc.start()
    needleman_wunsch.align(a, b, 1, -1, -2)
    _, nw_peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    assert hb_peak < nw_peak * 0.35
