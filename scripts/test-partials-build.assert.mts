// Assertions for the fixture site built by scripts/test-partials-build.sh.
//
// These run against the statically rendered HTML of a real Docusaurus build, so
// they validate partialsLoader, the full remark/rehype chain and the real theme
// components (Admonition, Tabs, Var, Checkpoint, CodeBlock, and Details).
//
// Usage: BUILD_DIR=<path to build output> node --test scripts/test-partials-build.assert.mts

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BUILD_DIR = process.env.BUILD_DIR;
if (!BUILD_DIR) {
  throw new Error("BUILD_DIR must point to the fixture site's build output");
}

// Returns the rendered markdown content of a docs page: everything between the
// page header and the end of the article, without inline SVGs and React's
// text-node separators.
const pageBody = (route: string): string => {
  const html = readFileSync(join(BUILD_DIR, route, "index.html"), "utf-8");
  const titleIndex = html.indexOf('<h1 class="docItemTitle">');
  assert.notEqual(titleIndex, -1, `no docs page content found for ${route}`);
  const start = html.indexOf("</header>", titleIndex);
  const end = html.indexOf("</article>", start);
  return html
    .slice(start, end)
    .replace(/<svg[\s\S]*?<\/svg>/g, "<svg/>")
    .replaceAll("<!-- -->", "");
};

const textOf = (html: string): string => html.replace(/<[^>]+>/g, "");

// Asserts that each marker occurs after the previous one.
const assertInOrder = (body: string, markers: string[]): void => {
  let from = 0;
  for (const marker of markers) {
    const index = body.indexOf(marker, from);
    assert.notEqual(index, -1, `expected "${marker}" after position ${from}`);
    from = index + marker.length;
  }
};

const countOf = (body: string, needle: string): number =>
  body.split(needle).length - 1;

describe("partial positioning", () => {
  const body = pageBody("partials/positioning");

  test("renders the partial at the top, middle (after a list) and inside a list item", () => {
    assert.equal(countOf(body, "simple partial content"), 3);
    assertInOrder(body, [
      "simple partial content",
      "This paragraph sits between two partials.",
      "First list item before the partial",
      "Second list item before the partial",
      "simple partial content",
      "This paragraph closes the page.",
    ]);
  });

  test("renders partial markdown formatting", () => {
    assert.match(body, /<strong>simple partial content<\/strong>/);
  });

  test("renders the partial inside a list item", () => {
    assert.match(
      body,
      /<li[^>]*>\s*<p>This is <strong>simple partial content<\/strong>/,
    );
  });

  test("does not leak import statements or JSX into the output", () => {
    assert.doesNotMatch(body, /import Simple/);
    assert.doesNotMatch(body, /&lt;Simple/);
  });
});

describe("nested partials", () => {
  test("renders both levels in order", () => {
    assertInOrder(pageBody("partials/nested"), [
      "Outer partial text before inner",
      "Inner partial content",
      "Outer partial text after inner",
    ]);
  });
});

describe("partials with parameters", () => {
  const body = pageBody("partials/params");

  test("uses passed values and overrides the default", () => {
    assert.match(body, /The value is custom-input\./);
    assert.match(body, /Mode: production\./);
  });

  test("falls back to the default when a parameter is omitted", () => {
    assert.match(body, /The value is fallback-default\./);
    assert.match(body, /Mode: dev\./);
  });

  test("evaluates JS expressions that combine parameters", () => {
    assert.match(body, /Connect with: --db-user=bob --db-name=pg/);
    assert.match(body, /Connect with: --db-user=alice --db-name=mysql/);
  });

  test("does not leak unevaluated props expressions", () => {
    assert.doesNotMatch(body, /props\./);
  });
});

describe("partials with variables", () => {
  test("resolves variables in the page and the partial for the default version", () => {
    const body = pageBody("partials/variables");
    assert.match(body, /This page documents Teleport version 98\.0\.0\./);
    assert.match(body, /Run Teleport version 98\.0\.0 or later/);
    assert.match(body, /Connect to 5432 for the default port/);
    assert.doesNotMatch(body, /\(=/);
  });

  test("resolves partial variables against the version the page belongs to", () => {
    const body = pageBody("ver/99.x/partials/variables");
    assert.match(body, /This page documents Teleport version 99\.0\.0\./);
    assert.match(body, /Run Teleport version 99\.0\.0 or later/);
    assert.doesNotMatch(body, /98\.0\.0/);
  });
});

describe("partials within code blocks", () => {
  test("renders a raw-loader import in a CodeBlock", () => {
    const body = pageBody("partials/code-block");
    assert.match(body, /theme-code-block/);
    assert.match(body, /language-yaml/);
    assert.match(textOf(body), /kind: role/);
    assert.match(textOf(body), /example-role/);
  });
});

describe("markdown content in partials", () => {
  const body = pageBody("partials/markdown");

  test("renders headings with anchors", () => {
    assert.match(body, /<h2[^>]*id="section-from-partial"/);
  });

  test("renders inline formatting", () => {
    assert.match(body, /<em>italic<\/em>/);
    assert.match(body, /<strong>bold<\/strong>/);
  });

  test("renders unordered, nested and ordered lists", () => {
    assert.match(body, /<ul>[\s\S]*Item one[\s\S]*<ul>[\s\S]*Nested item/);
    assert.match(body, /<ol>[\s\S]*First[\s\S]*Second/);
  });

  test("renders blockquotes", () => {
    assert.match(body, /<blockquote>[\s\S]*blockquote from a partial/);
  });

  test("renders GFM tables", () => {
    assert.match(
      body,
      /<table>[\s\S]*<th>Column A<\/th>[\s\S]*<td>Cell 2<\/td>/,
    );
  });

  test("syntax-highlights fenced code blocks", () => {
    assert.match(body, /<code class="hljs language-bash">/);
    assert.match(body, /hello from partial/);
  });
});

describe("<details>/<summary> in partials", () => {
  test("renders the details element with its summary and body", () => {
    const body = pageBody("partials/details");
    assert.match(body, /<details[^>]*>\s*<summary>Click to expand<\/summary>/);
    assert.match(body, /expanded/);
  });
});

describe("custom MDX components in partials", () => {
  const body = pageBody("partials/components");

  test("renders <Admonition>", () => {
    assert.match(body, /theme-admonition-tip/);
    assert.match(body, /tip from the partial/);
  });

  test("renders <Tabs> and <TabItem> with both tabs", () => {
    assert.match(body, /role="tablist"/);
    assert.match(body, />Cloud-Hosted</);
    assert.match(body, />Self-Hosted</);
    assert.match(body, /Cloud content from partial/);
    assert.match(body, /Self-hosted content from partial/);
  });

  test("renders <Var> as an input with its initial value", () => {
    assert.match(body, /data-testid="var-input"[^>]*name="cluster-name"/);
    assert.match(body, /value="teleport\.example\.com"/);
  });

  test("renders <Checkpoint> with its title and body", () => {
    assert.match(body, /data-checkpoint-title="Step complete"/);
    assert.match(body, /Verify the configuration is applied/);
  });
});

describe("relative markdown links in partials", () => {
  test("resolve to doc routes for the default version", () => {
    const body = pageBody("partials/links");
    assert.match(body, /href="\/partials\/nested\/"/);
    assert.match(body, /href="\/partials\/markdown\/"/);
    assert.doesNotMatch(body, /\.mdx/);
  });

  test("lowercase the fragment to match Docusaurus heading ids", () => {
    const body = pageBody("partials/links");
    assert.match(body, /href="\/partials\/markdown\/#section-from-partial"/);
    assert.doesNotMatch(body, /#Section-From-Partial/);
  });

  test("leave external links untouched", () => {
    const body = pageBody("partials/links");
    assert.match(body, /href="https:\/\/goteleport\.com\/docs\/"/);
  });

  test("point to the version the page belongs to", () => {
    const body = pageBody("ver/99.x/partials/links");
    assert.match(body, /href="\/ver\/99\.x\/partials\/nested\/"/);
    assert.match(
      body,
      /href="\/ver\/99\.x\/partials\/markdown\/#section-from-partial"/,
    );
    assert.doesNotMatch(body, /href="\/partials\//);
  });
});

describe("images in partials", () => {
  test("resolve relative to the partial file, not the including page", () => {
    // The image lives in includes/assets/, next to the partial. If it were
    // resolved relative to the page, the build would fail on a missing file.
    const body = pageBody("partials/image");
    assert.match(body, /<img[^>]*alt="Fixture diagram"/);
    assert.match(body, /src="data:image\/png;base64,iVBORw0KGgo/);
  });
});

describe("root-level partials", () => {
  test("render a partial that lives outside docs/pages", () => {
    const body = pageBody("partials/root-level");
    assert.match(body, /<h2[^>]*>1\.0\.0/);
    assert.match(body, /Release notes for the fixture project\./);
  });

  test("resolve relative links to doc routes", () => {
    const body = pageBody("partials/root-level");
    assert.match(body, /href="\/partials\/nested\/"/);
    assert.match(body, /href="\/partials\/markdown\/"/);
    assert.match(body, /href="https:\/\/goteleport\.com\/"/);
    assert.doesNotMatch(body, /\.mdx/);
  });

  test("resolve links against the version the page belongs to", () => {
    const body = pageBody("ver/99.x/partials/root-level");
    assert.match(body, /href="\/ver\/99\.x\/partials\/nested\/"/);
    assert.match(body, /href="\/ver\/99\.x\/partials\/markdown\/"/);
  });
});

describe("old and new include syntax on one page", () => {
  test("renders the MDX-native partial and the legacy include in order", () => {
    assertInOrder(pageBody("partials/mixed-syntax"), [
      "simple partial content",
      "comes from a legacy include",
    ]);
  });

  test("resolves variables in the legacy include for the page's version", () => {
    assert.match(
      pageBody("partials/mixed-syntax"),
      /legacy include on Teleport version 98\.0\.0\./,
    );
    assert.match(
      pageBody("ver/99.x/partials/mixed-syntax"),
      /legacy include on Teleport version 99\.0\.0\./,
    );
  });
});
