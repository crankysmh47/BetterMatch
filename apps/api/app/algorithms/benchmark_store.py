"""In-memory benchmark job store (spec: POST run + poll GET)."""

from __future__ import annotations

import random
import threading
import time
import tracemalloc
import uuid
from typing import Any

from algorithms import banded, gotoh, hirschberg, needleman_wunsch, smith_waterman

JOBS: dict[str, dict[str, Any]] = {}

# Last successfully completed benchmark rows (serves GET /api/benchmark).
LAST_BENCHMARK_ROWS: list[dict[str, Any]] = []

LENGTHS = [100, 500, 1000, 2000, 5000, 10000]


def _random_dna(n: int, seed: int = 42) -> str:
    rng = random.Random(seed)
    bases = "ACGT"
    return "".join(rng.choice(bases) for _ in range(n))


def _near_identical(ref: str, rate: float, seed: int) -> str:
    rng = random.Random(seed + 7)
    bases = "ACGT"
    out = []
    for c in ref:
        if rng.random() < rate:
            out.append(rng.choice([b for b in bases if b != c]))
        else:
            out.append(c)
    return "".join(out)


def run_benchmark_job() -> str:
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"status": "running", "started_at": time.time(), "rows": [], "error": None}

    def work():
        global LAST_BENCHMARK_ROWS
        rows: list[dict[str, Any]] = []
        try:
            for ln in LENGTHS:
                a = _random_dna(ln)
                b = _near_identical(a, 0.01, ln)

                def measure(fn, **kw):
                    tracemalloc.start()
                    t0 = time.perf_counter()
                    fn(**kw)
                    ms = (time.perf_counter() - t0) * 1000
                    _, peak = tracemalloc.get_traced_memory()
                    tracemalloc.stop()
                    return round(ms, 3), round(peak / 1024, 2)

                ms, kb = measure(
                    needleman_wunsch.align, seq_a=a, seq_b=b, match=1, mismatch=-1, gap=-2, matrix=None
                )
                rows.append({"algorithm": "nw", "length": ln, "time_ms": ms, "memory_kb": kb, "banded": False, "bandwidth": None})

                ms, kb = measure(
                    smith_waterman.align, seq_a=a, seq_b=b, match=1, mismatch=-1, gap=-2, matrix=None
                )
                rows.append({"algorithm": "sw", "length": ln, "time_ms": ms, "memory_kb": kb, "banded": False, "bandwidth": None})

                ms, kb = measure(
                    hirschberg.align, seq_a=a, seq_b=b, match=1, mismatch=-1, gap=-2, matrix=None
                )
                rows.append({"algorithm": "hirschberg", "length": ln, "time_ms": ms, "memory_kb": kb, "banded": False, "bandwidth": None})

                ms, kb = measure(
                    hirschberg.align,
                    seq_a=a,
                    seq_b=b,
                    match=1,
                    mismatch=-1,
                    gap=-2,
                    matrix=None,
                    bandwidth=50,
                )
                rows.append(
                    {
                        "algorithm": "banded_hirschberg",
                        "length": ln,
                        "time_ms": ms,
                        "memory_kb": kb,
                        "banded": True,
                        "bandwidth": 50,
                    }
                )

                ms, kb = measure(
                    gotoh.align,
                    seq_a=a,
                    seq_b=b,
                    match=1,
                    mismatch=-1,
                    gap_open=-2,
                    gap_extend=-0.5,
                    matrix=None,
                )
                rows.append({"algorithm": "gotoh", "length": ln, "time_ms": ms, "memory_kb": kb, "banded": False, "bandwidth": None})

                for k in (50, 100, 200, 500):
                    ms, kb = measure(
                        banded.align,
                        seq_a=a,
                        seq_b=b,
                        match=1,
                        mismatch=-1,
                        gap=-2,
                        matrix=None,
                        bandwidth=k,
                    )
                    rows.append(
                        {"algorithm": "banded_nw", "length": ln, "time_ms": ms, "memory_kb": kb, "banded": True, "bandwidth": k}
                    )

            JOBS[job_id]["rows"] = rows
            JOBS[job_id]["status"] = "done"
            LAST_BENCHMARK_ROWS = list(rows)
        except Exception as exc:
            JOBS[job_id]["status"] = "error"
            JOBS[job_id]["error"] = str(exc)

    threading.Thread(target=work, daemon=True).start()
    return job_id
