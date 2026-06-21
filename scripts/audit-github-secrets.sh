#!/usr/bin/env bash
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-pkkong/periodic-gift-tax}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI not found. Install or login with gh to audit repository-side secrets." >&2
  exit 1
fi

echo "Repository: $REPO"
echo

echo "Actions secrets:"
gh secret list --repo "$REPO" --app actions || true
echo

echo "github-pages environment secrets:"
gh secret list --repo "$REPO" --env github-pages || true
echo

echo "Repository variables:"
gh variable list --repo "$REPO" || true
echo

echo "GitHub Pages source:"
gh api "repos/$REPO/pages" --jq '{build_type,source,html_url,https_enforced}'
