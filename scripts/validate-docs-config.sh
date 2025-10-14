#!/bin/bash

# Make sure the repo_path override is unset
if [ $(jq -r '.versions | any(.repo_name)' config.json) = 'true' ]; then
  echo "config.json must not include a repo_name override in production.";
  exit 1
fi

# Make sure the branch field follows the expected pattern
if [ $( jq -r '.versions | any(.branch | test("^(branch/v[0-9.]+|master)$") | not)' config.json) = 'true' ]; then
  echo "In production, config.json must not specify branches that are not release branches or 'master'.";
  exit 1
fi

