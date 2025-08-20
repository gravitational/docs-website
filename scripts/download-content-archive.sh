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

BRANCH_TAR_URL="https://api.github.com/repos/gravitational/teleport/tarball/${2}";

# read the name of the tarball we'll write the gravitational/teleport archive to 
# from the "content-disposition" header.
BRANCH_TAR_FILE="${DOWNLOADS_DIR}/$(curl -qIL $BRANCH_TAR_URL | grep 'content-disposition' | sed -n 's/.*filename="*\([^";]*\.tar\.gz\)"*.*/\1/p')";

if [[ -f "${BRANCH_TAR_FILE}" ]]; then
    du -h "${BRANCH_TAR_FILE}";
    echo "Archive ${BRANCH_TAR_FILE} already exists. Skipping download."
else
    echo "Fetching an archive from ${BRANCH_TAR_URL} and writing it to ${BRANCH_TAR_FILE};"
    curl -fLJO --create-dirs --output-dir "${DOWNLOADS_DIR}" "${BRANCH_TAR_URL}";
fi

# Detect tar flavor and add --wildcards only for GNU tar
TAR_VERSION_STR="$(tar --version 2>&1 | head -n1 || true)"
TAR_ARGS=(-xf "${BRANCH_TAR_FILE}" --strip-components=1 -C "$1")
if echo "${TAR_VERSION_STR}" | grep -qi 'gnu tar'; then
    TAR_ARGS+=(--wildcards)
fi

ls -al "${DOWNLOADS_DIR}"

# Extract desired paths
tar "${TAR_ARGS[@]}" '*/docs' '*/examples' '*/CHANGELOG.md'

ls -al "$1"

echo "Cleaning up old tarballs from $DOWNLOADS_DIR"
find "$DOWNLOADS_DIR" -type f -mtime +1 -not -wholename "$BRANCH_TAR_FILE" -print -delete
