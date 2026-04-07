# Google Cloud Run 用 Dockerfile
# FastAPI バックエンド

FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# システム依存関係をインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt をコピーして依存関係をインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ソースコードをコピー
COPY . .

# ポート 8000 で公開
EXPOSE 8000

# health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# FastAPI サーバー起動
# バインドするホストを 0.0.0.0 に設定（Cloud Run 要件）
CMD exec uvicorn app.main:app --host 0.0.0.0 --port 8000
