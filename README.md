# BetterMatch — Sequence Alignment Visualizer

An educational “white-box” web application for biological sequence alignment, built as a DAA (Design and Analysis of Algorithms) project.

## Repository layout

```
BetterMatch/
├── apps/
│   ├── api/           Python FastAPI — NW · SW · Hirschberg · Gotoh · Banded NW · benchmarks
│   └── web/           Next.js 16 (App Router + Tailwind) — UI & DP table visualizer
├── datasets/          Biological FASTAs, synthetic pairs, experiment scripts
├── docs/
│   ├── spec/          Course specification (`genalign_full_spec.html`)
│   ├── CORRECTNESS_PROOFS.md
│   └── QA_CHECKLIST.md
├── hf-space/          Dockerfile + README for Hugging Face Spaces (API image only)
├── scripts/           Small Node helpers (spec task IDs, verified-marker emission)
├── docker-compose.yml
└── README.md
```

| Deploy target | Role |
|---------------|------|
| **Vercel** | Next.js app in `apps/web` (`NEXT_PUBLIC_API_URL` → HF Space `/api`) |
| **Hugging Face Space** | Docker image from `hf-space/Dockerfile`; public FastAPI |
| **Local** | `docker compose` — **web 3000**, **API 8000** |

There is **no NestJS** layer: the browser calls FastAPI directly. Alignment history is stored in **localStorage** until/unless you add a backend store.

## Quick start (Docker — recommended)

```bash
# From the repository root
docker compose up --build
```

Open http://localhost:3000 (the web container uses `NEXT_PUBLIC_API_URL=http://localhost:8000/api`).

### Docker prerequisites (Windows)

If you see `open //./pipe/dockerDesktopLinuxEngine`:

- Start **Docker Desktop** with **Linux containers + WSL2**.
- Check: `docker info` and `docker compose version`.

## Deployment

### Hugging Face (API)

1. Create a **Docker** Space from this repo.
2. Set **Dockerfile path** to `hf-space/Dockerfile` (build context = repository root).
3. Set **`CORS_ORIGINS`** to your Vercel origin(s), comma-separated, e.g. `https://your-app.vercel.app`.

### Vercel (web)

1. Point the Vercel project root at **`apps/web`** (or deploy from that directory).
2. Set **`NEXT_PUBLIC_API_URL`** = `https://<your-space>.hf.space/api` (must include `/api`, no trailing slash).

See **`apps/web/.env.example`** and **`hf-space/README.md`**.

## Local development

### 1. API (`apps/api`)

```bash
cd apps/api
pip install -r requirements.txt
cd app
uvicorn main:app --reload --port 8000
```

(Optional: `set CORS_ORIGINS=http://localhost:3000` in PowerShell.)

### 2. Web (`apps/web`)

```bash
cd apps/web
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm install
npm run dev
```

## Biological datasets & experiments

Assets live under [`datasets/`](datasets/).

```bash
pip install -r apps/api/requirements.txt
python datasets/fetch_biological.py
python datasets/run_biological_experiments.py
python datasets/generate_synthetic.py
```

## Testing & proofs

```bash
cd apps/api
pip install -r requirements.txt
pytest -v --cov=algorithms --cov-config=.coveragerc --cov-fail-under=90
```

- **`docs/CORRECTNESS_PROOFS.md`** — NW substructure / recurrence / Hirschberg score equivalence.
- **`docs/QA_CHECKLIST.md`** — manual browser QA.

## Algorithms implemented

### Needleman–Wunsch (global)

- O(m × n) time, O(m × n) space — full DP matrix for visualisation (short sequences in UI).

### Smith–Waterman (local)

- Scores floored at 0; traceback from max-score cell.

### Hirschberg (space-efficient global)

- O(m × n) time, **O(n)** auxiliary space — divide-and-conquer; score matches NW.

### Gotoh (affine gaps)

- Three DP layers (M / Ix / Iy).

### Banded NW

- Band-limited DP with fallback when the band is exceeded.

## API reference (FastAPI, port 8000)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/align/global` | Needleman–Wunsch (+ optional banded fallback) |
| POST | `/api/align/local` | Smith–Waterman |
| POST | `/api/align/optimized` | Hirschberg |
| POST | `/api/align/gotoh` | Gotoh |
| POST | `/api/align` | Unified (`algorithm` in JSON body) |
| POST | `/api/align/all` | NW + SW + HB bundle (length limit enforced) |
| POST | `/api/parse/fasta` | Multipart FASTA parse |
| GET | `/api/benchmark` | Benchmark rows |
| POST | `/api/benchmark/run` | Start benchmark job |
| GET | `/api/benchmark/job/{id}` | Poll job |
| GET | `/api/matrices` | Matrix metadata |

### Example request body

```json
{
  "seq_a": "AGCTGAC",
  "seq_b": "AGCGAC",
  "match": 1,
  "mismatch": -1,
  "gap": -2,
  "use_blosum62": false
}
```

## Web app features

- Algorithm selector (NW / SW / Hirschberg / Gotoh / Compare all)
- Raw text paste or `.fasta` upload (calls `/api/parse/fasta`)
- Animated DP table visualiser for small inputs
- Alignment history & stats from **browser storage** (`/history`)
