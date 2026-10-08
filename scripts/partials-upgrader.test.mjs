import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { remark } from "remark";
import remarkMdx from "remark-mdx";

const script = path.resolve("scripts/partials-upgrader.sh");
const fixturesDir = path.resolve("scripts/fixtures");

test("upgrades selected partials, calls, and fenced includes idempotently", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "partials-upgrader-"));
  const rootName = "content-root";
  const root = path.join(temporary, rootName);
  const includes = path.join(root, "docs/pages/includes");
  const examples = path.join(root, "examples");
  const pages = path.join(root, "docs/pages/get-started");
  const partial = path.join(includes, "nested/demo.mdx");
  const clientIncludes = path.join(
    root,
    "docs/pages/connect-your-client/includes",
  );
  const clientPartial = path.join(clientIncludes, "connect-demo.mdx");
  const example = path.join(examples, "config.yaml");
  const page = path.join(pages, "example.mdx");

  try {
    await mkdir(path.dirname(partial), { recursive: true });
    await mkdir(clientIncludes, { recursive: true });
    await mkdir(examples, { recursive: true });
    await mkdir(pages, { recursive: true });
    await writeFile(example, "apiVersion: v1\n");
    await writeFile(clientPartial, "Client prerequisite.\n");
    await writeFile(
      partial,
      await readFile(path.join(fixturesDir, "input-partial.mdx"), "utf8"),
    );
    await writeFile(
      page,
      await readFile(path.join(fixturesDir, "input-page.mdx"), "utf8"),
    );

    const run = () =>
      spawnSync("bash", [script, rootName], {
        cwd: temporary,
        input:
          // leading / on examples/ is intentional: tests that the upgrader strips it
          "docs/pages/includes/nested/demo.mdx,docs/pages/connect-your-client/includes/connect-demo.mdx,/examples/config.yaml\n",
        encoding: "utf8",
      });

    const firstRun = run();
    assert.equal(firstRun.status, 0, firstRun.stderr);
    const transformedPartial = await readFile(partial, "utf8");
    const transformedPage = await readFile(page, "utf8");
    assert.equal(
      transformedPartial,
      await readFile(path.join(fixturesDir, "expected-partial.mdx"), "utf8"),
    );
    assert.equal(
      transformedPage,
      await readFile(path.join(fixturesDir, "expected-page.mdx"), "utf8"),
    );
    assert.doesNotThrow(() =>
      remark().use(remarkMdx).parse(transformedPartial),
    );

    // Second run: verify the output is stable — re-running on already-upgraded files changes nothing.
    const secondRun = run();
    assert.equal(secondRun.status, 0, secondRun.stderr);
    assert.equal(await readFile(partial, "utf8"), transformedPartial);
    assert.equal(await readFile(page, "utf8"), transformedPage);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
