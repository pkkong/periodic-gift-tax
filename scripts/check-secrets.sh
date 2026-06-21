#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="/Users/pkkong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

if [ -x "$NODE_BIN" ]; then
  "$NODE_BIN" "$ROOT_DIR/scripts/check-secrets.mjs"
else
  node "$ROOT_DIR/scripts/check-secrets.mjs"
fi
