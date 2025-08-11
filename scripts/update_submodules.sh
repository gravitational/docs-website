#!/bin/bash

# Make sure there is a subdirectory in content for each version named in
# config.json
DOCS_VERSIONS=$(jq -r '.versions[] | select(.deprecated != true) | .name' config.json);
for v in $(echo "$DOCS_VERSIONS"); do
   if [[ ! -d "content/$v" ]]; then
       mkdir "content/$v";
   fi
done

# Load docs content into the content directory. In production or on CI runners,
# retrieve archives for the latest release for each supported Teleport major
# version. If running locally, use git submodules.
#
# Note that, when checking docs content changes in gravitational/teleport, CI
# jobs should clone the gravitational/teleport repository into a subdirectory of
# content, rather than using this approach.
if [[ -n ${AWS_APP_ID} || -n ${CI} ]]; then
  find content -mindepth 1 -maxdepth 1 -type d -exec  'scripts/checkout-latest-tag.sh' {} \;
else
  git submodule update --init --remote --progress;
fi

