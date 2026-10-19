#!/usr/bin/env bash
# Integration test for MDX-native partials.
#
# This script builds a fixture Docusaurus site to a throwaway sandbox directory, 
# using the source files located in scripts/partials/fixtures/partials-site. It uses the 
# actual docusaurus.config.ts file to demonstrate that the MDX-native partials 
# are rendered as expected using the full remark/rehype plugin chain, the 
# MDXComponents map and the Docusaurus theme components.
# 
# Usage:
#   bash scripts/partials/test-partials-build.sh
#
# Environment:
#   KEEP_SANDBOX=1  keep the sandbox directory (path is printed) for debugging
#   SANDBOX_DIR=... use this directory as the sandbox instead of a temp dir
#                   (it is always kept)
#   SKIP_BUILD=1    only re-run the assertions against an existing SANDBOX_DIR

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FIXTURE_SITE="${ROOT}/scripts/partials/fixtures/partials-site"
# Invalid pages that must make the build fail. Each subdirectory is one case.
ERROR_FIXTURES="${ROOT}/scripts/partials/fixtures/partials-site-errors"
ERROR_CASES=(missing-partial circular-partial code-block-markdown)

# 18.x is the default version served at the site root; 19.x is the latest
# (unreleased) version. Two versions are required because the config's
# lastVersion must be a non-current version.
DEFAULT_VERSION="18.x"
CURRENT_VERSION="19.x"

log() { echo "[partials-test] $*"; }

if [[ "${SKIP_BUILD:-0}" == "1" && -z "${SANDBOX_DIR:-}" ]]; then
  echo "[partials-test] SKIP_BUILD=1 requires SANDBOX_DIR to point at an existing sandbox" >&2
  exit 1
fi
SANDBOX="${SANDBOX_DIR:-$(mktemp -d "${TMPDIR:-/tmp}/docs-partials-site.XXXXXX")}"

cleanup() {
  if [[ "${KEEP_SANDBOX:-0}" == "1" || -n "${SANDBOX_DIR:-}" ]]; then
    log "Sandbox kept at ${SANDBOX}"
  else
    rm -rf "$SANDBOX"
  fi
}
trap cleanup EXIT

build_site() {
  log "Creating sandbox at ${SANDBOX}"
  mkdir -p "$SANDBOX"
  ln -sfn "${ROOT}/node_modules" "${SANDBOX}/node_modules"
  # Copied rather than symlinked: prepare-files writes into data/ and scripts
  # resolve paths relative to their own location.
  for item in src server utils static scripts data \
    docusaurus.config.ts package.json tsconfig.json tsconfig.node.json \
    tags.yml frontmatter_fields.yaml; do
    rm -rf "${SANDBOX:?}/${item}"
    cp -R "${ROOT}/${item}" "${SANDBOX}/${item}"
  done

  # prepare-files expects this directory to exist (it is tracked via .gitkeep).
  mkdir -p "${SANDBOX}/versioned_sidebars"

  cat > "${SANDBOX}/config.json" <<JSON
{
  "versions": [
    { "name": "${DEFAULT_VERSION}", "branch": "fixture", "isDefault": true },
    { "name": "${CURRENT_VERSION}", "branch": "fixture" }
  ]
}
JSON

  for version in "$DEFAULT_VERSION" "$CURRENT_VERSION"; do
    local content="${SANDBOX}/content/${version}"
    rm -rf "$content"
    mkdir -p "${content}/docs"
    cp -R "${FIXTURE_SITE}/pages" "${content}/docs/pages"
    cp "${FIXTURE_SITE}/sidebar.json" "${content}/docs/sidebar.json"
    cp "${FIXTURE_SITE}/root/CHANGELOG.md" "${content}/CHANGELOG.md"
    cp -R "${FIXTURE_SITE}/examples" "${content}/examples"
    # teleport.version differs per version so tests can tell which version's
    # config a partial was compiled against.
    cat > "${content}/docs/config.json" <<JSON
{
  "variables": {
    "teleport": { "version": "${version%.x}.0.0" },
    "db": { "default_port": "5432" }
  }
}
JSON
  done

  cd "$SANDBOX"
  local bin="${ROOT}/node_modules/.bin"

  log "Preparing files..."
  "${bin}/vite-node" ./scripts/prepare-files.mts

  log "Building the fixture site with the real Docusaurus config..."
  rm -rf build
  "${bin}/docusaurus" build --out-dir build --no-minify
}

# Adds the invalid pages of one error case to every version, builds the site
# and records the build log and exit code. The build is expected to fail, so
# its exit code is stored instead of aborting the script.
run_error_case() {
  local name="$1"
  local results="${SANDBOX}/error-cases"
  local code=0
  mkdir -p "$results"

  for version in "$DEFAULT_VERSION" "$CURRENT_VERSION"; do
    cp -R "${ERROR_FIXTURES}/${name}/pages/." "${SANDBOX}/content/${version}/docs/pages/"
  done

  log "Building error case '${name}' (expected to fail)..."
  (
    cd "$SANDBOX"
    "${ROOT}/node_modules/.bin/vite-node" ./scripts/prepare-files.mts
    "${ROOT}/node_modules/.bin/docusaurus" build --out-dir "build-error-${name}" --no-minify
  ) > "${results}/${name}.log" 2>&1 || code=$?
  echo "$code" > "${results}/${name}.exit"

  # Remove the invalid pages so the next case starts from the valid site.
  for version in "$DEFAULT_VERSION" "$CURRENT_VERSION"; do
    (cd "${ERROR_FIXTURES}/${name}/pages" && find . -type f) | while read -r file; do
      rm -f "${SANDBOX}/content/${version}/docs/pages/${file}"
    done
  done
}

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  build_site
fi

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  for case_name in "${ERROR_CASES[@]}"; do
    run_error_case "$case_name"
  done
fi

log "Running assertions against ${SANDBOX}"
BUILD_DIR="${SANDBOX}/build" ERRORS_DIR="${SANDBOX}/error-cases" \
  node --test "${ROOT}/scripts/partials/test-partials-build.assert.mts"
