#!/bin/bash
# Install scripts/pre-commit.sh as the local git pre-commit hook.
set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_SRC="$REPO_ROOT/scripts/pre-commit.sh"
HOOK_DST="$REPO_ROOT/.git/hooks/pre-commit"

if [ ! -f "$HOOK_SRC" ]; then
  echo "❌ scripts/pre-commit.sh not found"
  exit 1
fi

chmod +x "$HOOK_SRC"
ln -sf "$HOOK_SRC" "$HOOK_DST"
chmod +x "$HOOK_DST"
echo "✅ Pre-commit hook installed at $HOOK_DST"
