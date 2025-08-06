#!/bin/bash
set -o pipefail;
# This script is intended to be run with git submodule foreach. It assumes that
# the name of the given submodule is content/v<MAJOR_VERSION>.x, e.g.,
# content/v17.x. If it cannot check out the latest release for a submodule, it
# exits with no error, since we can use the latest commit for that submodule
# instead (e.g., the master branch).

if [[ -n $(find ./ -name "docs") ]]; then
    echo "This subodule directory already includes a docs directory. Make sure you haven't loaded the submodule";
fi

SUBMODULE_NAME='content/([0-9]+)\.x'
# Extract the major version from the submodule name if it follows the expected
# format.
export MAJOR=$(echo "${name}" | grep -oE "$SUBMODULE_NAME" | sed -E "s|^${SUBMODULE_NAME}|\1|");
if [[ "$?" -ne 0 ]]; then
    echo "Cannot check out the latest release within a submodule: \"${name}\" does not have the expected submodule name format. Skipping.";
    exit 0;
fi

LATEST_RELEASE_FOR_MAJOR=$(curl -qsf 'https://api.github.com/repos/gravitational/teleport/releases' | \
    jq '.[].tag_name | select(startswith("v\(env.MAJOR)"))' | head -n 1);

if [[ -z "$LATEST_RELEASE_FOR_MAJOR" ]]; then
    echo "Cannot check out the latest release within a submodule: cannot find a release for major version ${MAJOR}. Skipping.";
    exit 0
fi

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
   }' "${toplevel}/config.json" > "${toplevel}/confignew.json";

mv "${toplevel}/confignew.json" "${toplevel}/config.json";

curl -L -o release.tar "https://api.github.com/repos/gravitational/teleport/tarball/v${LATEST_RELEASE_FOR_MAJOR}";
tar -xv --include "gravitational-teleport-*/docs/*" --include "gravitational-teleport-*/examples/*" -f release.tar
mv gravitational-teleport-*/docs docs
mv gravitational-teleport-*/examples examples
