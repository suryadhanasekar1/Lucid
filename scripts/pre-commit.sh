#!/bin/bash
set -e

if git diff --cached --name-only | xargs grep -lE "sk-ant-[a-zA-Z0-9_-]+" 2>/dev/null; then
  echo "❌ COMMIT BLOCKED: Anthropic API key detected."
  exit 1
fi

if git diff --cached --name-only | xargs grep -lE "SNAPTRADE_CONSUMER_KEY=[a-zA-Z0-9-]{8,}" 2>/dev/null; then
  echo "❌ COMMIT BLOCKED: SnapTrade key detected."
  exit 1
fi

if git diff --cached --name-only | xargs grep -lE "NEWSAPI_KEY=[a-zA-Z0-9]{16,}" 2>/dev/null; then
  echo "❌ COMMIT BLOCKED: NewsAPI key detected."
  exit 1
fi

if git diff --cached --name-only | xargs grep -lE "FRED_API_KEY=[a-zA-Z0-9]{16,}" 2>/dev/null; then
  echo "❌ COMMIT BLOCKED: FRED key detected."
  exit 1
fi

if git diff --cached --name-only | grep -qE "^\.env(\.local|\.production)?$"; then
  echo "❌ COMMIT BLOCKED: .env file staged."
  exit 1
fi

if command -v gitleaks &> /dev/null; then
  gitleaks protect --staged --no-banner || exit 1
fi

echo "✅ Pre-commit security checks passed."
