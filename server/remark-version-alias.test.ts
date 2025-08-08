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
    .use(remarkVersionAlias as any, "15.x")
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
  ];

  test.each(testCases)("$description", (tc) => {
    const result = transformer({
      value: tc.input,
      path: tc.path,
    }).toString();

    expect(result).toEqual(tc.expected);
  });
});
