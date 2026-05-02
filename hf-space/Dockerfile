# Hugging Face Spaces (Docker SDK). Build context = repository root.
FROM python:3.12-slim

WORKDIR /service

COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/api/app ./app

WORKDIR /service/app

# HF injects PORT (default 7860). Local docker-compose may override.
# Full DEFAULT lengths (10k² DP) OOM typical Spaces; keep CSV override tight here.
ENV PORT=7860
ENV BENCHMARK_LENGTHS=100,250,500,1000
EXPOSE 7860

CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
