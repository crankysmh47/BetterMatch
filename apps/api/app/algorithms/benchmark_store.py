"""In-memory benchmark job store (spec: POST run + poll GET)."""

from __future__ import annotations

import gc
import os
import random
import threading
import time
import tracemalloc
import uuid
from typing import Any

from algorithms import banded, gotoh, hirschberg, needleman_wunsch, smith_waterman

JOBS: dict[str, dict[str, Any]] = {}

# Serialize job creation / "already running" checks (HF Spaces OOM restarts lose RAM anyway).
_JOBS_LOCK = threading.Lock()

# Last successfully completed benchmark rows (serves GET /api/benchmark).
LAST_BENCHMARK_ROWS: list[dict[str, Any]] = []

_DEFAULT_LENGTHS = [100, 500, 1000, 2000, 5000, 10000]


def _parse_lengths() -> list[int]:
    raw = os.environ.get("BENCHMARK_LENGTHS", "").strip()
    if not raw:
        return list(_DEFAULT_LENGTHS)
    out: list[int] = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        n = int(part)
        if n > 0:
            out.append(n)
    return out if out else list(_DEFAULT_LENGTHS)


# Evaluated at import (container env must be set before uvicorn loads the app).
LENGTHS = _parse_lengths()


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


def compute_benchmark_rows() -> list[dict[str, Any]]:
    """Run all synthetic benchmark measurements (CPU-heavy). Used async job + sync HTTP handler."""
    rows: list[dict[str, Any]] = []
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

        ms, kb = measure(hirschberg.align, seq_a=a, seq_b=b, match=1, mismatch=-1, gap=-2, matrix=None)
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

        gc.collect()

    return rows


def materialize_benchmark_to_global_store() -> list[dict[str, Any]]:
    """Runs benchmarks synchronously and refreshes LAST_BENCHMARK_ROWS (Spaces-safe single-request path)."""
    global LAST_BENCHMARK_ROWS
    rows = compute_benchmark_rows()
    LAST_BENCHMARK_ROWS = list(rows)
    return rows


def run_benchmark_job() -> str:
    with _JOBS_LOCK:
        for jid, job in list(JOBS.items()):
            if job.get("status") == "running":
                return jid
        job_id = str(uuid.uuid4())
        JOBS[job_id] = {"status": "running", "started_at": time.time(), "rows": [], "error": None}

    def work():
        global LAST_BENCHMARK_ROWS
        try:
            rows = compute_benchmark_rows()
            JOBS[job_id]["rows"] = rows
            JOBS[job_id]["status"] = "done"
            LAST_BENCHMARK_ROWS = list(rows)
        except Exception as exc:
            JOBS[job_id]["status"] = "error"
            JOBS[job_id]["error"] = str(exc)

    threading.Thread(target=work, daemon=True).start()
    return job_id
