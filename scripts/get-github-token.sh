#!/bin/bash
set -euo pipefail

# Print a GitHub token for repository archive downloads. Prefer an existing
# token, then a local gh auth token, then GitHub App credentials.
if [ -z "${GITHUB_TOKEN:-}" ] && command -v gh >/dev/null 2>&1; then
    if token="$(gh auth token 2>/dev/null)" && [ -n "$token" ]; then
        export GITHUB_TOKEN="$token"
    fi
fi

node scripts/get-github-token.mjs "$@"
