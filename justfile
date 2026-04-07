#!/usr/bin/env just --justfile

default:
    just --list

# --- 起動・停止 ---

# 全サービスをコンテナで起動（フロントは http://localhost:3000、バックは http://localhost:8000）
up:
    docker compose up

down:
    docker compose down

restart:
    just down
    just up

# ログをリアルタイムで表示
logs:
    docker compose logs -f

logs-front:
    docker compose logs -f frontend

logs-back:
    docker compose logs -f backend

logs-db:
    docker compose logs -f db

# --- DB ---

# マイグレーション（コンテナ内で実行）
migrate:
    docker compose exec -T backend sh -c "cd /app && alembic upgrade head"

migrate-down:
    docker compose exec -T backend sh -c "cd /app && alembic downgrade -1"

# 初期データ投入（コンテナ内で実行）
seed:
    docker compose exec -T backend python scripts/seed.py

# GLBプレースホルダー生成（開発用テストモデル）
generate-glb:
    python3 backend/scripts/generate_glb_placeholders.py frontend/public/models

db-reset:
    docker compose exec -T backend sh -c "cd /app && alembic downgrade base && alembic upgrade head && python scripts/seed.py"

db-shell:
    docker compose exec db psql -U user -d hakoniwa

db-up:
    docker compose up -d db

# --- テスト ---
test:
    docker compose exec -T frontend pnpm test
    docker compose exec -T backend pytest

test-front:
    docker compose exec -T frontend pnpm test

test-back:
    docker compose exec -T backend pytest

# --- リント / フォーマット ---
lint:
    docker compose exec -T frontend pnpm lint
    docker compose exec -T backend ruff check .

format:
    docker compose exec -T frontend pnpm format
    docker compose exec -T backend ruff format .

# --- ビルド ---
build:
    docker compose exec -T frontend pnpm build

# --- セットアップ ---
setup-env:
    cp .env.example .env
    @echo ".env を作成しました。ANTHROPIC_API_KEY を設定してください。"

# 初回セットアップ（DB 起動後にマイグレーション＆シード）
setup:
    just setup-env
    docker compose up -d db
    @echo "DB 起動待機中..."
    sleep 5
    just migrate
    just seed
    docker compose up -d
    @echo ""
    @echo "セットアップ完了！"
    @echo "   http://localhost:3000 を開いてください"

# --- デプロイ ---

# Cloudflare Pages 用ビルド（@cloudflare/next-on-pages）
build-pages:
    cd frontend && pnpm install && pnpm build:pages

# Supabase シード（本番 DB に直接投入）
seed-prod:
    DATABASE_URL=$(grep '^DATABASE_URL' .env | cut -d'=' -f2-) \
    python3 backend/scripts/seed.py
