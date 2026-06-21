#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="/Users/pkkong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
AIT_BIN="$ROOT_DIR/apps-in-toss/node_modules/.bin/ait"

if [ -f "$ROOT_DIR/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env.local"
  set +a
fi

export PATH="$NODE_BIN:$PATH"

if [ ! -x "$AIT_BIN" ]; then
  echo "Apps in Toss CLI not found at $AIT_BIN" >&2
  echo "Install Apps in Toss dependencies before running this helper." >&2
  exit 1
fi

PROFILE="${APPS_IN_TOSS_PROFILE:-default}"
LOCATION="${APPS_IN_TOSS_AIT_LOCATION:-apps-in-toss/baby-gift-tax-helper.ait}"
MEMO="${APPS_IN_TOSS_DEPLOY_MEMO:-}"

case "${1:-help}" in
  token)
    shift
    case "${1:-add}" in
      add)
        if [ -z "${APPS_IN_TOSS_API_KEY:-}" ]; then
          echo "Set APPS_IN_TOSS_API_KEY in .env.local temporarily, then rerun." >&2
          echo "After token registration, remove the API key from .env.local." >&2
          exit 1
        fi
        "$AIT_BIN" token add --api-key "$APPS_IN_TOSS_API_KEY" "$PROFILE"
        ;;
      remove)
        "$AIT_BIN" token remove "$PROFILE"
        ;;
      *)
        "$AIT_BIN" token "$@"
        ;;
    esac
    ;;
  deploy)
    shift || true
    args=(deploy --profile "$PROFILE" --location "$LOCATION")
    if [ -n "$MEMO" ]; then
      args+=("--memo" "$MEMO")
    fi
    "$AIT_BIN" "${args[@]}" "$@"
    ;;
  *)
    "$AIT_BIN" "$@"
    ;;
esac
