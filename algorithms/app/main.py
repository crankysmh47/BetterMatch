"""BetterMatch — Algorithms Microservice (FastAPI)"""

import time
import tracemalloc
import io
from typing import Annotated, Literal, Union

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from algorithms import needleman_wunsch, smith_waterman, hirschberg
from algorithms.scoring import BLOSUM62

app = FastAPI(
    title="BetterMatch Algorithms Service",
    description="Needleman-Wunsch · Smith-Waterman · Hirschberg sequence alignment",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class AlignRequest(BaseModel):
    seq_a: str = Field(..., min_length=1, description="First sequence (raw or FASTA)")
    seq_b: str = Field(..., min_length=1, description="Second sequence (raw or FASTA)")
    match: int = Field(1, description="Score for a match")
    mismatch: int = Field(-1, description="Penalty for a mismatch")
    gap: int = Field(-2, description="Linear gap penalty")
    use_blosum62: bool = Field(False, description="Apply BLOSUM62 substitution matrix")

    @model_validator(mode="after")
    def strip_fasta(self) -> "AlignRequest":
        self.seq_a = _parse_sequence(self.seq_a)
        self.seq_b = _parse_sequence(self.seq_b)
        return self


class AlignResponse(BaseModel):
    algorithm: str
    score: int
    aligned_a: str
    aligned_b: str
    operations: list[str]
    matches: int
    mismatches: int
    gaps: int
    identity: float
    seq_a_len: int
    seq_b_len: int
    elapsed_ms: float
    peak_memory_kb: float
    dp_table: Union[list[list[int]], None] = None
    max_pos: Union[list[int], None] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_sequence(raw: str) -> str:
    """Strip FASTA headers and whitespace, returning a clean sequence string."""
    lines = raw.strip().splitlines()
    seq_lines = [ln.strip() for ln in lines if not ln.startswith(">")]
    return "".join(seq_lines).upper()


def _run_align(algo_module, request: AlignRequest, algorithm_name: str) -> AlignResponse:
    matrix = BLOSUM62 if request.use_blosum62 else None

    tracemalloc.start()
    t0 = time.perf_counter()

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

    # Truncate dp_table for large sequences to avoid huge payloads
    dp = result.get("dp_table")
    if dp and len(dp) > 51:
        dp = None  # frontend visualiser only supports ≤ 50 anyway

    return AlignResponse(
        algorithm=algorithm_name,
        score=result["score"],
        aligned_a=result["aligned_a"],
        aligned_b=result["aligned_b"],
        operations=result["operations"],
        matches=result["matches"],
        mismatches=result["mismatches"],
        gaps=result["gaps"],
        identity=result["identity"],
        seq_a_len=result["seq_a_len"],
        seq_b_len=result["seq_b_len"],
        elapsed_ms=round(elapsed_ms, 3),
        peak_memory_kb=round(peak / 1024, 2),
        dp_table=dp,
        max_pos=result.get("max_pos"),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "algorithms"}


@app.post("/api/align/global", response_model=AlignResponse, tags=["Alignment"])
def align_global(req: AlignRequest):
    """Needleman-Wunsch global alignment."""
    try:
        return _run_align(needleman_wunsch, req, "needleman_wunsch")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/align/local", response_model=AlignResponse, tags=["Alignment"])
def align_local(req: AlignRequest):
    """Smith-Waterman local alignment."""
    try:
        return _run_align(smith_waterman, req, "smith_waterman")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/align/optimized", response_model=AlignResponse, tags=["Alignment"])
def align_optimized(req: AlignRequest):
    """Hirschberg space-optimised global alignment."""
    try:
        return _run_align(hirschberg, req, "hirschberg")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/align/all", tags=["Alignment"])
def align_all(req: AlignRequest):
    """Run all three algorithms and return results for side-by-side comparison."""
    if len(req.seq_a) > 2000 or len(req.seq_b) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Sequences must be ≤ 2000 bp for the /all endpoint.",
        )
    return {
        "needleman_wunsch": _run_align(needleman_wunsch, req, "needleman_wunsch"),
        "smith_waterman":   _run_align(smith_waterman,   req, "smith_waterman"),
        "hirschberg":       _run_align(hirschberg,       req, "hirschberg"),
    }


@app.post("/api/parse/fasta", tags=["Utilities"])
async def parse_fasta(file: UploadFile = File(...)):
    """Parse an uploaded .fasta file and return the sequences found."""
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    sequences = []
    current_header = None
    current_seq: list[str] = []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith(">"):
            if current_header is not None:
                sequences.append({"header": current_header, "sequence": "".join(current_seq).upper()})
            current_header = line[1:]
            current_seq = []
        else:
            current_seq.append(line)
    if current_header is not None:
        sequences.append({"header": current_header, "sequence": "".join(current_seq).upper()})
    return {"sequences": sequences, "count": len(sequences)}
