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
    {
      description:
        "markdown link to a folder's category-index page (same basename as its parent folder) drops the repeated segment",
      input: `---
title: My page
description: My page
---

See the [testing](../test/my-test-path/my-test-path.mdx) guide.`,
      expected: `---
title: My page
description: My page
---

See the [testing](/ver/18.x/test/my-test-path/) guide.
`,
      path: "content/18.x/docs/pages/includes/test.mdx",
    },
    {
      description:
        "markdown link in a latest-version partial resolves without a /ver/ prefix",
      input: `---
title: My page
description: My page
---

See the [testing](../test/my-test-path/my-test-path.mdx) guide.`,
      expected: `---
title: My page
description: My page
---

See the [testing](/test/my-test-path/) guide.
`,
      path: "content/15.x/docs/pages/includes/test.mdx",
    },
    {
      description:
        "markdown link to a regular (non-index) doc page keeps its full path",
      input: `---
title: My page
description: My page
---

See the [testing](../test/my-test-path/linux.mdx) guide.`,
      expected: `---
title: My page
description: My page
---

See the [testing](/ver/18.x/test/my-test-path/linux/) guide.
`,
      path: "content/18.x/docs/pages/includes/test.mdx",
    },
    {
      description:
        "markdown link to an index page in a partial drops the trailing /index segment",
      input: `---
title: My page
description: My page
---

See the [testing](../test/index.mdx) guide.`,
      expected: `---
title: My page
description: My page
---

See the [testing](/ver/18.x/test/) guide.
`,
      path: "content/18.x/docs/pages/includes/test.mdx",
    },
    {
      description:
        "markdown link with an .mdx extension outside a partial is left untouched",
      input: `---
title: My page
description: My page
---

See the [testing](../test/my-test-path/my-test-path.mdx) guide.`,
      expected: `---
title: My page
description: My page
---

See the [testing](../test/my-test-path/my-test-path.mdx) guide.
`,
      path: "docs/mypage.mdx",
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
