import { describe, expect, test } from "@jest/globals";
import { VFile, VFileOptions } from "vfile";
import { remark } from "remark";
import mdx from "remark-mdx";
import remarkVersionAlias from "./remark-version-alias";
import remarkFrontmatter from "remark-frontmatter";

const transformer = (vfileOptions: VFileOptions) => {
  const file: VFile = new VFile(vfileOptions);

  return remark()
    .use(mdx as any)
    .use(remarkFrontmatter) // Test cases use frontmatter
    .use(remarkVersionAlias as any, {
      currentVersion: "15.x",
      latestVersion: "15.x",
    })
    .processSync(file as any);
};

describe("server/remark-version-alias", () => {
  interface testCase {
    description: string;
    input: string;
    expected: string;
    path: string;
  }

  const testCases: Array<testCase> = [
    {
      description: "import statement in latest-version docs path",
      input: `---
title: My page
description: My page
---

import CodeExample from "@version/examples/access-plugin-minimal/config.go"

This is a paragraph.`,
      expected: `---
title: My page
description: My page
---

import CodeExample from '@site/content/15.x/examples/access-plugin-minimal/config.go';

This is a paragraph.
`,
      path: "docs/mypage.mdx",
    },
    {
      description: "three import statements in latest-version docs path",
      input: `---
title: My page
description: My page
---

import CodeExample from "@version/examples/access-plugin-minimal/config.go";
import MyImage from "@version/myimg.png";
import Triangle from "@version/triangle.png";

This is a paragraph.`,
      expected: `---
title: My page
description: My page
---

import CodeExample from '@site/content/15.x/examples/access-plugin-minimal/config.go';
import MyImage from '@site/content/15.x/myimg.png';
import Triangle from '@site/content/15.x/triangle.png';

This is a paragraph.
`,
      path: "docs/mypage.mdx",
    },
    {
      description: "import statement in non-latest docs path",
      input: `---
title: My page
description: My page
---

import CodeExample from "@version/examples/access-plugin-minimal/config.go"

This is a paragraph.`,
      expected: `---
title: My page
description: My page
---

import CodeExample from '@site/content/16.x/examples/access-plugin-minimal/config.go';

This is a paragraph.
`,
      path: "versioned_docs/version-16.x/mypage.mdx",
    },
    {
      description: "raw loader",
      input: `---
title: My page
description: My page
---

import CodeExample from "!!raw-loader!@version/examples/access-plugin-minimal/config.go"

This is a paragraph.`,
      expected: `---
title: My page
description: My page
---

import CodeExample from '!!raw-loader!@site/content/16.x/examples/access-plugin-minimal/config.go';

This is a paragraph.
`,
      path: "versioned_docs/version-16.x/mypage.mdx",
    },
    {
      description:
        "import statement in a MDX-native partial path (content/<version>/), which is never copied into versioned_docs/",
      input: `---
title: My page
description: My page
---

import NestedPartial from "@version/docs/pages/includes/nested.mdx"

This is a paragraph.`,
      expected: `---
title: My page
description: My page
---

import NestedPartial from '@site/content/18.x/docs/pages/includes/nested.mdx';

This is a paragraph.
`,
      path: "content/18.x/docs/pages/includes/test.mdx",
    },
  ];

  test.each(testCases)("$description", (tc) => {
    const result = transformer({
      value: tc.input,
      path: tc.path,
    }).toString();

    expect(result).toEqual(tc.expected);
  });
});

describe("markdown links in MDX-native partials", () => {
  const partial = "content/18.x/docs/pages/includes/test.mdx";
  const changelog = "content/18.x/CHANGELOG.md";

  test.each([
    {
      description: "a category-index page drops the repeated segment",
      path: partial,
      url: "../test/my-test-path/my-test-path.mdx",
      expected: "/ver/18.x/test/my-test-path/",
    },
    {
      description: "a link in a latest-version partial has no /ver/ prefix",
      path: "content/15.x/docs/pages/includes/test.mdx",
      url: "../test/my-test-path/my-test-path.mdx",
      expected: "/test/my-test-path/",
    },
    {
      description: "a regular (non-index) doc page keeps its full path",
      path: partial,
      url: "../test/my-test-path/linux.mdx",
      expected: "/ver/18.x/test/my-test-path/linux/",
    },
    {
      description: "an index page drops the trailing /index segment",
      path: partial,
      url: "../test/index.mdx",
      expected: "/ver/18.x/test/",
    },
    {
      description:
        "a root-level content file (e.g. CHANGELOG.md) resolves to the doc route",
      path: changelog,
      url: "./docs/pages/enroll-resources/desktop-access/active-directory.mdx#network-level-authentication-nla",
      expected:
        "/ver/18.x/enroll-resources/desktop-access/active-directory/#network-level-authentication-nla",
    },
    {
      description: "a trailing slash after .mdx is resolved correctly",
      path: changelog,
      url: "./docs/pages/enroll-resources/database-access/getting-started.mdx/",
      expected: "/ver/18.x/enroll-resources/database-access/getting-started/",
    },
    {
      description: "the docs home page resolves to the version root",
      path: changelog,
      url: "docs/pages/index.mdx",
      expected: "/ver/18.x/",
    },
    {
      description: "the docs home page in the latest version resolves to /",
      path: "content/15.x/CHANGELOG.md",
      url: "docs/pages/index.mdx",
      expected: "/",
    },
    {
      description: "a link outside a partial is left untouched",
      path: "docs/mypage.mdx",
      url: "../test/my-test-path/my-test-path.mdx",
      expected: "../test/my-test-path/my-test-path.mdx",
    },
  ])("$description", ({ path, url, expected }) => {
    const result = transformer({ path, value: `[link](${url})` }).toString();
    expect(result).toEqual(`[link](${expected})\n`);
  });
});
