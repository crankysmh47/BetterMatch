"""GenAlign — Algorithms Microservice (FastAPI)"""

from __future__ import annotations

import io
import os
import re
import time
import tracemalloc
from typing import Any, Literal, Union

from Bio import SeqIO
from fastapi import Body, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from algorithms import banded, gotoh, hirschberg, needleman_wunsch, smith_waterman
from algorithms.benchmark_store import JOBS, LAST_BENCHMARK_ROWS, run_benchmark_job
from algorithms.scoring import MATRICES, MatrixName, get_matrix

app = FastAPI(
    title="GenAlign Algorithms Service",
    description="Needleman-Wunsch · Smith-Waterman · Hirschberg · Gotoh · Banded NW",
    version="2.0.0",
)

_cors_raw = os.getenv("CORS_ORIGINS", "").strip()
_cors_list = [o.strip() for o in _cors_raw.split(",") if o.strip()]
if _cors_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class AlignRequest(BaseModel):
    seq_a: str = Field(..., min_length=1, description="First sequence (raw or FASTA)")
    seq_b: str = Field(..., min_length=1, description="Second sequence (raw or FASTA)")
    algorithm: str = Field(
        "nw",
        description="nw | sw | hirschberg | gotoh (aliases: needleman_wunsch, smith_waterman, …)",
    )
    match: int = Field(1, description="Score for a match")
    mismatch: int = Field(-1, description="Penalty for a mismatch")
    gap: int = Field(-2, description="Linear gap penalty")
    use_blosum62: bool = Field(False, description="(Legacy) Apply BLOSUM62 substitution matrix")
    mode: Literal["dna", "protein"] = Field("dna", description="Scoring mode")
    matrix_name: Union[MatrixName, None] = Field(None, description="Protein substitution matrix")
    gap_open: float = Field(-2.0, description="Affine gap open penalty (Gotoh)")
    gap_extend: float = Field(-0.5, description="Affine gap extend penalty (Gotoh)")
    banded: bool = Field(False, description="Banded DP for NW; banded last-row scoring for Hirschberg (falls back if score ≠ full NW)")
    bandwidth: int = Field(50, description="Band width k")

    @model_validator(mode="after")
    def strip_fasta(self) -> "AlignRequest":
        self.seq_a = _parse_sequence(self.seq_a)
        self.seq_b = _parse_sequence(self.seq_b)
        if len(self.seq_a) > 50000 or len(self.seq_b) > 50000:
            raise ValueError("Sequence too long for web interface — use CLI.")
        if self.use_blosum62 and self.matrix_name is None:
            self.mode = "protein"
            self.matrix_name = "BLOSUM62"
        return self


class TraceStep(BaseModel):
    i: int
    j: int


class AlignResponse(BaseModel):
    algorithm: str
    score: float
    aligned_a: str
    aligned_b: str
    operations: list[str]
    matches: int
    mismatches: int
    gaps: int
    identity: float
    identity_pct: float = 0.0
    similarity_pct: float = 0.0
    gap_pct: float = 0.0
    alignment_length: int = 0
    seq_a_len: int
    seq_b_len: int
    elapsed_ms: float
    peak_memory_kb: float
    dp_table: Union[list[list[int]], list[list[float]], None] = None
    dp_active_region: Union[list[list[bool]], None] = None
    max_pos: Union[list[int], None] = None
    traceback_path: Union[list[dict[str, int]], None] = None
    predecessor: Union[list[list[Union[str, None]]], None] = None
    recursion_tree: Union[dict[str, Any], None] = None
    M_matrix: Union[list[list[float]], None] = None
    Ix_matrix: Union[list[list[float]], None] = None
    Iy_matrix: Union[list[list[float]], None] = None
    band_exceeded: bool = False
    summary: str = Field("", description="Human-readable summary")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_sequence(raw: str) -> str:
    lines = raw.strip().splitlines()
    seq_lines = [ln for ln in lines if not ln.startswith(">")]
    full_text = "".join(seq_lines).upper()
    return re.sub(r"[^A-Z]", "", full_text)


def _normalize_algorithm(name: str) -> Literal["nw", "sw", "hirschberg", "gotoh"]:
    k = (name or "nw").strip().lower().replace("-", "_")
    aliases = {
        "nw": "nw",
        "needleman_wunsch": "nw",
        "global": "nw",
        "sw": "sw",
        "smith_waterman": "sw",
        "local": "sw",
        "hirschberg": "hirschberg",
        "optimized": "hirschberg",
        "gotoh": "gotoh",
        "affine": "gotoh",
    }
    v = aliases.get(k, "nw")
    return v  # type: ignore[return-value]


def _validate_sequence_chars(seq: str, mode: str) -> list[str]:
    dna = set("ACGTUN")
    prot = set("ACDEFGHIKLMNPQRSTVWYBZJX*")
    bad: list[str] = []
    for ch in seq.upper():
        if ch == "-":
            continue
        if mode == "dna" and ch not in dna:
            bad.append(ch)
        elif mode == "protein" and ch not in prot:
            bad.append(ch)
    return bad


def _run_align(algo_module, request: AlignRequest, algorithm_name: str) -> AlignResponse:
    matrix = None
    if request.mode == "protein":
        chosen = request.matrix_name or "BLOSUM62"
        matrix = get_matrix(chosen)

    tracemalloc.start()
    t0 = time.perf_counter()

    if algorithm_name == "gotoh":
        result = algo_module.align(
            request.seq_a,
            request.seq_b,
            match=request.match,
            mismatch=request.mismatch,
            gap_open=request.gap_open,
            gap_extend=request.gap_extend,
            matrix=matrix,
        )
    elif algorithm_name == "banded_nw":
        result = algo_module.align(
            request.seq_a,
            request.seq_b,
            match=request.match,
            mismatch=request.mismatch,
            gap=request.gap,
            matrix=matrix,
            bandwidth=request.bandwidth,
        )
    elif algorithm_name == "hirschberg":
        result = algo_module.align(
            request.seq_a,
            request.seq_b,
            match=request.match,
            mismatch=request.mismatch,
            gap=request.gap,
            matrix=matrix,
            bandwidth=request.bandwidth if request.banded else None,
        )
    else:
        result = algo_module.align(
            request.seq_a,
            request.seq_b,
            match=request.match,
            mismatch=request.mismatch,
            gap=request.gap,
            matrix=matrix,
        )

    elapsed_ms = (time.perf_counter() - t0) * 1000
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    dp = result.get("dp_table")
    pred = result.get("predecessor")
    active = result.get("dp_active_region")
    Mm = result.get("M_matrix")
    Ixm = result.get("Ix_matrix")
    Iym = result.get("Iy_matrix")

    big = dp is not None and len(dp) > 51
    if big:
        dp = None
        pred = None
        active = None
        Mm = Ixm = Iym = None

    summary = (
        f"{result['matches']} matches, {result['mismatches']} mismatches, "
        f"{result['gaps']} gaps ({result['identity']}% identity). "
        f"Score: {result['score']}."
    )

    tb = result.get("traceback_path")
    if tb is not None and isinstance(tb, list):
        tb_out = tb
    else:
        tb_out = None

    return AlignResponse(
        algorithm=algorithm_name,
        score=float(result["score"]),
        aligned_a=result["aligned_a"],
        aligned_b=result["aligned_b"],
        operations=result["operations"],
        matches=result["matches"],
        mismatches=result["mismatches"],
        gaps=result["gaps"],
        identity=float(result["identity"]),
        identity_pct=float(result.get("identity_pct", result["identity"])),
        similarity_pct=float(result.get("similarity_pct", result["identity"])),
        gap_pct=float(result.get("gap_pct", 0.0)),
        alignment_length=int(result.get("alignment_length", len(result["operations"]))),
        seq_a_len=result["seq_a_len"],
        seq_b_len=result["seq_b_len"],
        elapsed_ms=round(elapsed_ms, 3),
        peak_memory_kb=round(peak / 1024, 2),
        dp_table=dp,
        dp_active_region=active,
        max_pos=result.get("max_pos"),
        traceback_path=tb_out,
        predecessor=pred,
        recursion_tree=result.get("recursion_tree"),
        M_matrix=Mm,
        Ix_matrix=Ixm,
        Iy_matrix=Iym,
        band_exceeded=bool(result.get("band_exceeded", False)),
        summary=summary,
    )


def align_global(req: AlignRequest) -> AlignResponse:
    if req.banded:
        banded_res = _run_align(banded, req, "banded_nw")
        if banded_res.band_exceeded:
            full = _run_align(needleman_wunsch, req, "needleman_wunsch")
            full.band_exceeded = True
            full.summary = (full.summary + " (Banded DP exceeded band; fell back to full NW.)").strip()
            return full
        return banded_res
    return _run_align(needleman_wunsch, req, "needleman_wunsch")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok", "service": "algorithms"}


@app.post("/api/align/global", response_model=AlignResponse, tags=["Alignment"])
def align_global_endpoint(req: AlignRequest):
    try:
        return align_global(req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/align", response_model=AlignResponse, tags=["Alignment"])
def align_unified(req: AlignRequest):
    """Unified align endpoint — algorithm comes from JSON body (`algorithm` field)."""
    try:
        a = _normalize_algorithm(req.algorithm)
        if a == "nw":
            return align_global(req)
        if a == "sw":
            return _run_align(smith_waterman, req, "smith_waterman")
        if a == "hirschberg":
            return _run_align(hirschberg, req, "hirschberg")
        return _run_align(gotoh, req, "gotoh")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/align/local", response_model=AlignResponse, tags=["Alignment"])
def align_local(req: AlignRequest):
    try:
        return _run_align(smith_waterman, req, "smith_waterman")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/align/optimized", response_model=AlignResponse, tags=["Alignment"])
def align_optimized(req: AlignRequest):
    try:
        return _run_align(hirschberg, req, "hirschberg")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/align/gotoh", response_model=AlignResponse, tags=["Alignment"])
def align_gotoh(req: AlignRequest):
    try:
        return _run_align(gotoh, req, "gotoh")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/align/all", tags=["Alignment"])
def align_all(req: AlignRequest):
    if len(req.seq_a) > 2000 or len(req.seq_b) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Sequences must be ≤ 2000 bp for the /all endpoint.",
        )
    try:
        return {
            "needleman_wunsch": _run_align(needleman_wunsch, req, "needleman_wunsch"),
            "smith_waterman": _run_align(smith_waterman, req, "smith_waterman"),
            "hirschberg": _run_align(hirschberg, req, "hirschberg"),
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/parse/fasta", tags=["Utilities"])
async def parse_fasta(
    mode: Literal["dna", "protein"] = Query("dna"),
    file: UploadFile | None = File(None),
    body: dict | None = Body(None),
):
    """Parse FASTA via BioPython; returns max 10 records + optional warning."""
    try:
        if file is not None:
            content = await file.read()
            text = content.decode("utf-8", errors="ignore")
        else:
            text = str(body.get("file", "")) if body else ""

        records = list(SeqIO.parse(io.StringIO(text), "fasta"))
        warning = None
        if len(records) > 10:
            records = records[:10]
            warning = "More than 10 sequences in file; returning first 10 only."

        out: list[dict[str, Any]] = []
        for rec in records:
            seq = str(rec.seq).upper().replace(" ", "")
            bad = _validate_sequence_chars(seq, mode)
            out.append(
                {
                    "id": rec.id,
                    "description": rec.description or rec.id,
                    "sequence": seq,
                    "invalid_chars": bad,
                }
            )

        return {"sequences": out, "count": len(out), "warning": warning}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/benchmark", tags=["Benchmark"])
def benchmark_table():
    return {"rows": LAST_BENCHMARK_ROWS}


@app.post("/api/benchmark/run", tags=["Benchmark"])
def benchmark_run():
    job_id = run_benchmark_job()
    return {"job_id": job_id}


@app.get("/api/benchmark/job/{job_id}", tags=["Benchmark"])
def benchmark_job(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown job_id")
    return job


@app.get("/api/matrices", tags=["Utilities"])
def list_matrices():
    return {
        "matrices": [
            {"name": name, "type": "protein", "description": name}
            for name in sorted(MATRICES.keys())
        ]
    }
