# BetterMatch — Sequence Alignment Visualizer

An educational "white-box" web application for biological sequence alignment, built as a DAA (Design and Analysis of Algorithms) project.

## Architecture

```
BetterMatch/
├── algorithms/      Python FastAPI microservice — NW · SW · Hirschberg's
├── backend/         NestJS REST API — proxies to Python, stores results in PostgreSQL
├── frontend/        Next.js 16 (App Router + Tailwind) — UI & DP Table Visualizer
└── docker-compose.yml
```

| Service    | Port | Stack |
|------------|------|-------|
| frontend   | 3000 | Next.js 16, Tailwind CSS |
| backend    | 4000 | NestJS 10, TypeORM, PostgreSQL |
| algorithms | 8000 | Python 3.12, FastAPI, uvicorn |
| postgres   | 5432 | PostgreSQL 16 |

## Quick Start (Docker — Recommended)

```bash
# From the BetterMatch/ directory
docker compose up --build
```

Then open http://localhost:3000

## Local Development

### 1. PostgreSQL
```bash
docker compose up postgres -d
```

### 2. Algorithms service
```bash
cd algorithms
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Backend
```bash
cd backend
cp .env .env.local   # adjust DB_HOST to localhost if not using Docker
npm run start:dev
```

### 4. Frontend
```bash
cd frontend
# .env.local already points to http://localhost:4000/api
npm run dev
```

## Algorithms Implemented

### Needleman-Wunsch (Global Alignment)
- O(m × n) time, O(m × n) space
- Full DP matrix returned for animated visualization (sequences ≤ 50 bp)

### Smith-Waterman (Local Alignment)
- O(m × n) time, O(m × n) space
- Scores floored at 0; traceback from max-score cell

### Hirschberg's Algorithm (Space-Optimised Global)
- O(m × n) time, **O(n) space**
- Divide-and-conquer: linear-space score rows + recursive split
- Provably equivalent output to Needleman-Wunsch

## API Reference

### Algorithms Service (port 8000)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/align/global` | Needleman-Wunsch |
| POST | `/api/align/local` | Smith-Waterman |
| POST | `/api/align/optimized` | Hirschberg's |
| POST | `/api/align/all` | All three, side-by-side |
| POST | `/api/parse/fasta` | Parse uploaded .fasta file |

### Backend (port 4000)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/align/global` | NW (persists to DB) |
| POST | `/api/align/local` | SW (persists to DB) |
| POST | `/api/align/optimized` | Hirschberg's (persists to DB) |
| POST | `/api/align/all` | All three (persists all to DB) |
| GET  | `/api/history` | List alignment history |
| GET  | `/api/history/stats` | Aggregate stats by algorithm |
| GET  | `/api/history/:id` | Single record |
| DELETE | `/api/history/:id` | Delete record |

### Request body (all align endpoints)
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

## Frontend Features
- Algorithm selector (NW / SW / Hirschberg / Compare All)
- Raw text paste or .fasta file upload
- Animated DP Table Visualizer (Play / Pause / Step) for sequences ≤ 50 bp
- Color-coded alignment output (green=match, orange=mismatch, grey=gap)
- Alignment history page with per-algorithm stats from PostgreSQL
- BLOSUM62 substitution matrix support
