#!/bin/bash
set -e

echo "=== 開発環境セットアップ開始 ==="

# just（タスクランナー）インストール
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin

# pnpm インストール
npm install -g pnpm@latest

# Claude Code CLI インストール
npm install -g @anthropic-ai/claude-code

# バージョン確認
echo "=== インストール済みツール ==="
node --version
python3 --version
just --version
pnpm --version
claude --version

echo "=== セットアップ完了 ==="
