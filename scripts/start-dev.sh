#!/bin/bash

set -e

if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "This script only supports macOS."
    exit 1
fi

CONFIG_FILE="config.json"
REQUIRED_DEPS=("rsync" "watchexec" "jq")

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

homebrew_installed() {
    brew list "$1" >/dev/null 2>&1
}

install_dependencies() {    
    if ! command_exists brew; then
        echo "Error: Homebrew is required. Please install."
        exit 1
    fi
    
    local missing_deps=()
    for dep in "${REQUIRED_DEPS[@]}"; do
        if ! homebrew_installed "$dep"; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo "Installing missing dependencies: ${missing_deps[*]}"
        brew install "${missing_deps[@]}"
    fi    
}

sync_content() {    
    VERSIONS=$(jq -r '.versions | [.[] | select(.deprecated != true)][:-1] | .[].name' "$CONFIG_FILE")
    CURRENT=$(jq -r '.versions[-1].name' "$CONFIG_FILE")
    
    rsync -av --inplace --delete \
        --exclude='includes/***' \
        --include='*/' \
        --include='*.mdx' \
        --exclude='*' \
        "content/${CURRENT}/docs/pages/" docs/
    
    echo "$VERSIONS" | while read -r version; do
        rsync -av --inplace --delete \
            --exclude='includes/***' \
            --include='*/' \
            --include='*.mdx' \
            --exclude='*' \
            "content/${version}/docs/pages/" "versioned_docs/version-${version}/"
    done
    
    echo "Content synced"
}

reload() {
    echo "Reloading Docusaurus..."
    yarn clear && yarn docusaurus start
}

cleanup() {
    echo -e "\n🧹 Cleaning up..."
    jobs -p | xargs -r kill 2>/dev/null || true
}

trap cleanup SIGINT SIGTERM

main() {
    install_dependencies
    
    watchexec --watch content 'bash scripts/start-dev.sh --sync-only' &
    sleep 3
    
    yarn prepare-files
    yarn prepare-strapi-data
    
    sync_content
    
    watchexec --restart \
        --watch content \
        --filter '**/includes/**' \
        'bash scripts/start-dev.sh --reload'
}

case "${1:-}" in
    --sync-only)
        sync_content
        ;;
    --reload)
        reload
        ;;
    *)
        main
        ;;
esac

exit 0