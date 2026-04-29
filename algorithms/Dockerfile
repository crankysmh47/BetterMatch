FROM python:3.12-slim

WORKDIR /service

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

# Set WORKDIR to app/ so 'from algorithms import ...' resolves to app/algorithms/
WORKDIR /service/app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
