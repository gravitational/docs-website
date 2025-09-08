#!/bin/bash
set -o pipefail;
# This script assumes that the name of each first-level child directory in
# content is content/v<MAJOR_VERSION>.x, e.g., content/v17.x.
# $1 is the relative path of the content directory to the project root.
# $2 is the name of the branch on GitHub from which to fetch an archive, e.g.,
# master or branch/v17.

if [[ -n $(find "$1" -name "docs") ]]; then
    echo "Content directory $1 already includes a docs directory. Skipping."
    exit 0;
fi

echo "Setting up docs version in content directory $1";

DOWNLOADS_DIR='.downloads/'
CONTENT_DIR_NAME='content/([0-9]+)\.x'
# Extract the major version from the submodule name if it follows the expected
# format.

MAJOR=$(echo "${1}" | grep -oE "$CONTENT_DIR_NAME" | sed -E "s|^${CONTENT_DIR_NAME}|\1|");
if [[ "$?" -ne 0 ]]; then
    echo "Invalid content version directory: \"${1}\" does not have the expected name format.";
    exit 1;
fi
echo "Found major version $MAJOR";

BRANCH_TAR_URL="https://api.github.com/repos/aatuvai/teleport/tarball/${2}"

# Use curl's ETag support to compare the tarball we want to download with the one in the cache. 
# Save the tarball as .downloads/$1.tar.gz
BRANCH_TAR_FILE="$(echo ${DOWNLOADS_DIR}/${MAJOR}.tar.gz | tr -s /)"
ETAG_FILE="${BRANCH_TAR_FILE}.etag"
TMP_ETAG="${ETAG_FILE}.tmp"
mkdir -p "${DOWNLOADS_DIR}"

curl -sS -L --fail \
    --retry 5 \
    --etag-compare "$ETAG_FILE" \
    --etag-save "$TMP_ETAG" \
    -w '%{http_code}: Downloaded file (%header{content-disposition} with size of %{size_download}) as %{filename_effective} from %{url}\n' \
    -o "$BRANCH_TAR_FILE" \
    "$BRANCH_TAR_URL"

# If TMP_ETAG exist and it's not empty, replace ETAG_FILE with TMP_ETAG
# This is needed because of bug in older curl versions: https://github.com/curl/curl/issues/15728
[ -s "$TMP_ETAG" ] && mv -fv "$TMP_ETAG" "$ETAG_FILE"

# Detect tar flavor and add --wildcards only for GNU tar
TAR_VERSION_STR="$(tar --version 2>&1 | head -n1 || true)"
TAR_ARGS=(-xf "${BRANCH_TAR_FILE}" --strip-components=1 -C "$1")
if echo "${TAR_VERSION_STR}" | grep -qi 'gnu tar'; then
    TAR_ARGS+=(--wildcards)
fi

tree -D -h "${DOWNLOADS_DIR}"

# Extract desired paths
echo "Extracting selected content from ${BRANCH_TAR_FILE} to $1"
tar "${TAR_ARGS[@]}" '*/docs' '*/examples' '*/CHANGELOG.md'

tree -L 1 "$1"
