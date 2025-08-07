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

CONTENT_DIR_NAME='content/([0-9]+)\.x'
# Extract the major version from the submodule name if it follows the expected
# format.
export MAJOR=$(echo "${1}" | grep -oE "$CONTENT_DIR_NAME" | sed -E "s|^${CONTENT_DIR_NAME}|\1|");
if [[ "$?" -ne 0 ]]; then
    echo "Cannot check out the latest release within a content version directory: \"${1}\" does not have the expected name format. Skipping.";
    exit 0;
fi

echo "Found major version $MAJOR";

LATEST_RELEASE_FOR_MAJOR=$(curl -qsf 'https://api.github.com/repos/gravitational/teleport/releases' | \
    jq -r '.[].tag_name | select(startswith("v\(env.MAJOR)"))' | head -n 1);

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

echo "Fetching a release archive from ${RELEASE_URL};"

curl -L -o "$1/release.tar" "${RELEASE_URL}";
tar -xvf "$1/release.tar";
mv gravitational-teleport-*/docs "$1/docs";
mv gravitational-teleport-*/examples "$1/examples";
rm -rf gravitational-teleport-*;
