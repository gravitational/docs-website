#!/bin/bash
set -e

# change this if you have something on port 3000 already
LOCAL_PORT=3000

SEM_VER=$1
if [[ "${SEM_VER}" == "" ]]; then
    # shellcheck disable=SC2086
    echo "Usage: \"$(basename $0)\" <latest-docs-semver>"
    # shellcheck disable=SC2086
    echo "e.g. \"$(basename $0)\" 19.x"
    exit 1
fi
if [ ! -d content/"${SEM_VER}" ]; then
    echo "SEM_VER does not look correct, specify a different version on the command line"
fi

# these paths assume:
# - that you are running "./run-docker.sh <semver>" inside the docs-website git checkout
# - that you have your checkout of the teleport git repo in the relative directory "../teleport"
# change these to absolute paths if this is not the case!
DOCS_PATH=$(realpath "$(pwd)")
TELEPORT_PATH=$(realpath "$(pwd)"/../teleport)
if [ ! -f "${DOCS_PATH}"/package.json ]; then
    echo "DOCS_PATH does not look correct"
    exit 2
fi
if [ ! -f "${TELEPORT_PATH}"/version.go ]; then
    echo "TELEPORT_PATH does not look correct"
    exit 3
fi

# build docker image
DOCKER_IMAGE=node-watchexec:22
docker build -t "${DOCKER_IMAGE}" .

# copy template gitmodules if it doesn't exist
if [ ! -f .gitmodules ]; then
    cp .gitmodules.example .gitmodules
fi

# do a git update locally (SSH keys are not available inside the container)
./scripts/update_submodules.sh

# run docusaurus in docker
docker run \
    --name teleport-docs --rm -ti \
    -v "${DOCS_PATH}":/src \
    -v "${TELEPORT_PATH}":/src/content/"${SEM_VER}" \
    -w /src \
    --entrypoint=/bin/bash \
    -p ${LOCAL_PORT}:3000 \
    "${DOCKER_IMAGE}" \
    -c "yarn && yarn dev"
