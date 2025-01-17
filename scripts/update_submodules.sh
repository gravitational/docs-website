#!/bin/bash

# Fetch all submodule refs on a local machine. On the AWS Amplify build runner,
# only execute a shallow fetch with a single branch.
function fetch_submodules () {
  if [[ -n ${AWS_APP_ID} ]]; then
      git submodule update --init --remote --progress --depth 1 --single-branch
  else
      git submodule update --init --remote --progress
  fi
}

let "i=0";
let "s=0";
while [ ${i} -lt 5 ]; do
    fetch_submodules && exit 0;
    let "i++";
    let "s=s+5";
    echo "Failed to load submodules. Trying again in ${s}s."
    sleep ${s};
done;

exit 1;
