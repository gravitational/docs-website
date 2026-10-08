// Assertions for the failure cases run by scripts/test-partials-build.sh.
//
// Each case adds an invalid page to the fixture site and builds it. The build
// must fail, and the failure must point at the problem. The script stores each
// build's log and exit code in $ERRORS_DIR.
//
// Usage: ERRORS_DIR=<path> node --test scripts/test-partials-build-errors.assert.mts

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ERRORS_DIR = process.env.ERRORS_DIR;
if (!ERRORS_DIR) {
  throw new Error("ERRORS_DIR must point to the error case results");
}

interface ErrorResult {
  exitCode: number;
  log: string;
}

const result = (name: string): ErrorResult => ({
  exitCode: Number(readFileSync(join(ERRORS_DIR, `${name}.exit`), "utf-8")),
  log: readFileSync(join(ERRORS_DIR, `${name}.log`), "utf-8"),
});

describe("importing a partial that does not exist", () => {
  const { exitCode, log } = result("missing-partial");

  test("fails the build", () => {
    assert.notEqual(exitCode, 0);
  });

  test("names the missing file, resolved against each page's version", () => {
    assert.match(
      log,
      /Cannot find module '@site\/content\/98\.x\/docs\/pages\/includes\/does-not-exist\.mdx'/,
    );
    assert.match(
      log,
      /Cannot find module '@site\/content\/99\.x\/docs\/pages\/includes\/does-not-exist\.mdx'/,
    );
  });
});

describe("partials that import each other", () => {
  const { exitCode, log } = result("circular-partial");

  test("fails the build instead of rendering forever", () => {
    assert.notEqual(exitCode, 0);
  });

  test("fails while rendering the page that uses the circular partial", () => {
    assert.match(log, /static site generation failed/);
    assert.match(log, /\/partials\/circular-partial\//);
  });
});
