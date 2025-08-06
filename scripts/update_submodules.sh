#!/bin/bash

# $1 is the relative path to a submodule
function fetch_submodule_if_needed () {
  # There is already a docs directory, so there is no need to fetch a submodule.
  if [[ -n $(find "$1" -name "docs" -type d) ]]; then
    return
  fi

  let "i=0";
  let "s=0";
  while [ ${i} -lt 5 ]; do
      git submodule update --init --remote --progress --depth 1 --single-branch "$1";      
      if [[ "$?" -eq 0 ]]; then
      	  return
      fi

      let "i++";
      let "s=s+5";
      echo "Failed to load submodules. Trying again in ${s}s."
      sleep ${s};
  done;
  echo "Failed to load submodule ${1} after ${i} attempts. Exiting.";
  exit 1;
}

if [[ -n ${AWS_APP_ID} ]]; then
  # Attempt to download a release for each submodule.
  git submodule foreach '../../scripts/checkout-latest-tag.sh';
 
  # For any submodule directories where we couldn't download a release, load the
  # git submodule.
  find content -mindepth 1 -maxdepth 1 -type d exec fetch_submodule_if_needed {} \;
else
  # This is a local machine, so load all submodules for development
  git submodule update --init --remote --progress;
fi

