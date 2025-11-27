FROM node:22-slim

ARG WATCHEXEC_VERSION=1.20.5
ARG ARCH=aarch64
WORKDIR /tmp
RUN apt-get -y update && \
    apt-get -y install git jq rsync wget && \
    wget https://github.com/watchexec/watchexec/releases/download/cli-v${WATCHEXEC_VERSION}/watchexec-${WATCHEXEC_VERSION}-${ARCH}-unknown-linux-gnu.deb && \
    dpkg -i watchexec-${WATCHEXEC_VERSION}-${ARCH}-unknown-linux-gnu.deb && \
    rm -f watchexec-${WATCHEXEC_VERSION}-${ARCH}-unknown-linux-gnu.deb && \
    apt clean
