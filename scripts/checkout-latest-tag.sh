#!/bin/bash
set -o pipefail;
# This script assumes that the name of each first-level child directory in
# content is content/v<MAJOR_VERSION>.x, e.g., content/v17.x.
# $1 is the relative path of the content directory to the project root.

if [[ -n $(find "$1" -name "docs") ]]; then
    echo "Content directory $1 already includes a docs directory. Skipping."
    exit 0;
fi

echo "Setting up docs version in content directory $1";

DOWNLOADS_DIR='.downloads/'
CONTENT_DIR_NAME='content/([0-9]+)\.x'
# Extract the major version from the submodule name if it follows the expected
# format.

MAJOR=$(echo "${1}" | grep -oE "$CONTENT_DIR_NAME" | sed -E "s|^${CONTENT_DIR_NAME}|\1|")
echo "Found major version $MAJOR";

LATEST_RELEASE_FOR_MAJOR=$(curl -qsf 'https://api.github.com/repos/gravitational/teleport/releases' | \
    jq -r --arg major "$MAJOR" '.[].tag_name | select(startswith("v\($major)"))' | head -n 1);

if [[ -z "$LATEST_RELEASE_FOR_MAJOR" ]]; then
    echo "Cannot check out the latest release within content directory ${1}: cannot find a release for major version ${MAJOR}. Skipping.";
    exit 0
fi

echo "Configuring the docs to display release ${LATEST_RELEASE_FOR_MAJOR}.";

jq --arg major "${MAJOR}" \
   --arg release "${LATEST_RELEASE_FOR_MAJOR}" \
   '(.versions[] | select(.name == "\($major).x") | .isDefault) as $isDefault |
   {
       "versions": [
         (.versions[] | select(.name != "\($major).x")), 
         {
             "name": "\($major).x", 
             "release": $release,
             "isDefault": $isDefault,
         }
     ]
   }' "config.json" > "confignew.json";

mv "confignew.json" "config.json";

RELEASE_URL="https://api.github.com/repos/gravitational/teleport/tarball/${LATEST_RELEASE_FOR_MAJOR}";
RELEASE_TAR_FILE="${DOWNLOADS_DIR}/${LATEST_RELEASE_FOR_MAJOR}.tar.gz";

mkdir -p "${DOWNLOADS_DIR}";
if [[ -f "${RELEASE_TAR_FILE}" ]]; then
    du -h "${RELEASE_TAR_FILE}";
    echo "Archive ${RELEASE_TAR_FILE} already exists. Skipping download."
else
    echo "Fetching a release archive from ${RELEASE_URL} to ${RELEASE_TAR_FILE};"
    curl -fL -o "${RELEASE_TAR_FILE}" "${RELEASE_URL}";
fi

tar -xf "${RELEASE_TAR_FILE}" \
    --strip-components=1 \
    -C "$1" \
        '*/docs' '*/examples'

ls -al "$1"