# BetterMatch web (`apps/web`)

Next.js 16 (App Router) UI for the alignment visualizer. Repository overview, Docker, and API docs live in the **[root README](../../README.md)**.

## Local dev

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm install
npm run dev
```

## Vercel

Set the Vercel **root directory** to `apps/web` (or deploy from this folder). Configure **`NEXT_PUBLIC_API_URL`** to your Hugging Face Space URL including `/api`.
