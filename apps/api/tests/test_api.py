"""FastAPI integration tests via httpx.AsyncClient + ASGITransport (≥10 cases)."""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_ok(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_align_global_nw(client: AsyncClient):
    r = await client.post(
        "/api/align/global",
        json={"seq_a": "GATTACA", "seq_b": "GCATGCU", "match": 1, "mismatch": -1, "gap": -2},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["algorithm"] == "needleman_wunsch"
    assert "aligned_a" in body


@pytest.mark.asyncio
async def test_align_local_sw(client: AsyncClient):
    r = await client.post(
        "/api/align/local",
        json={"seq_a": "TGTTACGG", "seq_b": "GGTTGACTA", "match": 3, "mismatch": -3, "gap": -2},
    )
    assert r.status_code == 200
    assert r.json()["algorithm"] == "smith_waterman"


@pytest.mark.asyncio
async def test_align_optimized_hirschberg(client: AsyncClient):
    r = await client.post(
        "/api/align/optimized",
        json={"seq_a": "AGCT", "seq_b": "AGTT", "match": 1, "mismatch": -1, "gap": -2},
    )
    assert r.status_code == 200
    assert r.json()["algorithm"] == "hirschberg"


@pytest.mark.asyncio
async def test_align_gotoh_endpoint(client: AsyncClient):
    r = await client.post(
        "/api/align/gotoh",
        json={
            "seq_a": "ACGTTGCA",
            "seq_b": "TGCAACGT",
            "match": 1,
            "mismatch": -1,
            "gap_open": -2,
            "gap_extend": -0.5,
        },
    )
    assert r.status_code == 200
    assert r.json()["score"] == -3.0


@pytest.mark.asyncio
async def test_align_unified_algorithm_sw(client: AsyncClient):
    r = await client.post(
        "/api/align",
        json={
            "algorithm": "sw",
            "seq_a": "ACGT",
            "seq_b": "ACGT",
            "match": 2,
            "mismatch": -1,
            "gap": -2,
        },
    )
    assert r.status_code == 200
    assert r.json()["algorithm"] == "smith_waterman"


@pytest.mark.asyncio
async def test_align_unified_algorithm_gotoh(client: AsyncClient):
    r = await client.post(
        "/api/align",
        json={
            "algorithm": "gotoh",
            "seq_a": "AA",
            "seq_b": "AA",
            "match": 1,
            "mismatch": -1,
            "gap_open": -2,
            "gap_extend": -0.5,
        },
    )
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_banded_fallback_sets_band_exceeded_flag(client: AsyncClient):
    """Narrow band + skewed lengths triggers band_exceeded and full NW fallback."""
    r = await client.post(
        "/api/align/global",
        json={
            "seq_a": "A" * 40,
            "seq_b": "A" * 10,
            "match": 1,
            "mismatch": -1,
            "gap": -2,
            "banded": True,
            "bandwidth": 5,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["band_exceeded"] is True
    assert body["algorithm"] == "needleman_wunsch"


@pytest.mark.asyncio
async def test_sequence_too_long_returns_400(client: AsyncClient):
    r = await client.post(
        "/api/align/global",
        json={"seq_a": "A" * 50001, "seq_b": "C", "match": 1, "mismatch": -1, "gap": -2},
    )
    assert r.status_code in (400, 422)


@pytest.mark.asyncio
async def test_list_matrices(client: AsyncClient):
    r = await client.get("/api/matrices")
    assert r.status_code == 200
    names = {m["name"] for m in r.json()["matrices"]}
    assert "BLOSUM62" in names


@pytest.mark.asyncio
async def test_benchmark_table_shape(client: AsyncClient):
    r = await client.get("/api/benchmark")
    assert r.status_code == 200
    assert "rows" in r.json()


@pytest.mark.asyncio
async def test_align_all_three_returns_bundle(client: AsyncClient):
    r = await client.post(
        "/api/align/all",
        json={"seq_a": "ACGT", "seq_b": "ACGT", "match": 2, "mismatch": -1, "gap": -2},
    )
    assert r.status_code == 200
    bundle = r.json()
    assert set(bundle.keys()) >= {"needleman_wunsch", "smith_waterman", "hirschberg"}
