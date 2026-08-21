#!/bin/bash


# Load docs content into the content directory. When DOCS_CONTENT_DIR is set,
# prefer content that has already been extracted into the build environment. If
# no preloaded content is configured, CI and Amplify retrieve archives for the
# latest release for each supported Teleport major version. Local development
# uses git submodules.
#
# Note that, when checking docs content changes in gravitational/teleport, CI
# jobs should clone the gravitational/teleport repository into a subdirectory of
# content, rather than using this approach.
DOCS_VERSIONS=$(jq -r '.versions[] | select(.deprecated != true) | .name' config.json);

if [[ -n "${DOCS_CONTENT_DIR:-}" ]]; then
  if [[ ! -d "${DOCS_CONTENT_DIR}" ]]; then
    echo "DOCS_CONTENT_DIR is set to '${DOCS_CONTENT_DIR}', but that directory does not exist.";
    exit 1;
  fi

  echo "Loading docs content from DOCS_CONTENT_DIR=${DOCS_CONTENT_DIR}";
  # Clean out the content directory and copy the preloaded content into it.
  rm -rf content;
  mkdir content;
  cp -a "${DOCS_CONTENT_DIR}/." content/;

  for v in $(echo "$DOCS_VERSIONS"); do
    if [[ ! -d "content/$v/docs" ]]; then
      echo "Expected docs directory content/$v/docs was not found in DOCS_CONTENT_DIR.";
      exit 1;
    fi
  done

  echo "Docs content loaded from DOCS_CONTENT_DIR.";
  exit 0;
fi

if [[ -n ${AWS_APP_ID} || -n ${CI} ]]; then
  for v in $(echo "$DOCS_VERSIONS"); do
     # Make sure there is a subdirectory in content for each version named in
     # config.json
     mkdir -p "content/$v";

     BRANCH=$(jq --arg ver "$v" -r '.versions[] | select(.name==$ver) | .branch' config.json);
     REPO=$(jq --arg ver "$v" -r '.versions[] | select(.name==$ver) | .repo_path' config.json);
     scripts/download-content-archive.sh "content/$v" "$BRANCH" "$REPO";
  done
else
  git submodule update --init --remote --progress;
fi
