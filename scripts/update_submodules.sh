#!/bin/bash

# For debugging SSH transport. Delete when no longer needed.
git config --global set core.sshCommand "ssh -vvv"

# Fetch all submodule refs on a local machine. On the AWS Amplify build runner,
# only execute a shallow fetch with a single branch.
if [[ -n ${AWS_APP_ID} ]]; then
    git submodule update --init --remote --progress --depth 1 --single-branch
else
    git submodule update --init --remote --progress
fi
