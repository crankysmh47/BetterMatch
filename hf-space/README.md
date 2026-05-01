---
title: GenAlign Algorithms API
emoji: 🧬
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
app_port: 7860
---

# GenAlign — FastAPI algorithms service

Docker Space hosting **only** the Python alignment microservice (`apps/api/app`). The Next.js UI lives on **Vercel** and calls this API via `NEXT_PUBLIC_API_URL`.

## Repository layout

Create this Space from the monorepo root and set:

- **Dockerfile location:** `hf-space/Dockerfile`
- **Space hardware:** CPU basic is enough for coursework demos.

## Required secrets / variables

In **Space Settings → Variables**:

| Name | Example | Purpose |
|------|---------|---------|
| `CORS_ORIGINS` | `https://your-app.vercel.app` | Comma-separated allowed browser origins. **Required for production** so the Vercel app can call the API with credentials-safe CORS. Leave unset for open `*` (dev only). |

Optional local dev: run `uvicorn` from `apps/api/app` on port `8000` instead.

## Health check

`GET /health` → `{"status":"ok", ...}`

## Vercel configuration

Set **`NEXT_PUBLIC_API_URL`** to your Space URL **including `/api`**, e.g.:

`https://YOUR_USERNAME-genalign-algorithms.hf.space/api`

(No trailing slash.)
