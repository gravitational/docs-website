#!/bin/bash
# This script checks that the remark linter runs without issue. The linter
# executes the configuration file .remarkrc.mjs if there is at least one file to
# lint, so to save linting time, we write a mock file to the content directory.

if [ $(find content -mindepth 2 | wc -l) -gt 0 ]; then
    echo "Files already exist in the content directory. Running the remark linter without adding a mock file."
    yarn markdown-lint;
    exit "$?";
fi

firstdir=$(find content -type d -maxdepth 1 -mindepth 1 | head -n 1)

mkdir -p "${firstdir}/docs/pages";

cat<<EOF>"${firstdir}/docs/pages/index.mdx"
---
title: "Docs Home"
description: Provides an overview of the docs
---

First paragraph
EOF

cat<<EOF>"${firstdir}/docs/config.json"
{
  "variables": {},
  "redirects": []
}
EOF

echo "Wrote mock files to ${firstdir}/docs/pages/index.mdx and ${firstdir}/docs/config.json";

yarn markdown-lint
ret="$?";

rm -rf "${firstdir}/docs";

echo "Cleaned up ${firstdir}/docs";
exit ${ret};
