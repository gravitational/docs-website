#!/bin/bash

if [[ -n ${AWS_APP_ID} ]]; then
  # For any submodule directories where we couldn't download a release, load the
  # git submodule.
  find content -mindepth 1 -maxdepth 1 -type d -exec  'scripts/checkout-latest-tag.sh' {} \;
else
  # This is a local machine, so load all submodules for development
  git submodule update --init --remote --progress;
fi

