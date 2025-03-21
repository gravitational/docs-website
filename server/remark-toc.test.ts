import { describe, expect, test } from "@jest/globals";
import { Volume, createFsFromVolume } from "memfs";
import { default as remarkTOC } from "../server/remark-toc";
import { readFileSync } from "fs";
import { resolve } from "path";
import { Compatible, VFile, VFileOptions } from "vfile";
import remarkMdx from "remark-mdx";
import remarkGFM from "remark-gfm";
import { remark } from "remark";

describe("server/remark-toc", () => {
  const testFilesTwoSections = {
    "/docs/docs.mdx": `---
title: "Documentation Home"
description: "Guides to setting up the product."
---

Guides to setting up the product.

`,
    "/docs/database-access/database-access.mdx": `---
title: "Database Access"
description: Guides related to Database Access.
---

Guides related to Database Access.

`,
    "/docs/database-access/page1.mdx": `---
title: "Database Access Page 1"
description: "Protecting DB 1 with Teleport"
---`,
    "/docs/database-access/page2.mdx": `---
title: "Database Access Page 2"
description: "Protecting DB 2 with Teleport"
---`,
    "/docs/application-access/application-access.mdx": `---
title: "Application Access"
description: "Guides related to Application Access"
---

Guides related to Application Access.

`,
    "/docs/application-access/page1.mdx": `---
title: "Application Access Page 1"
description: "Protecting App 1 with Teleport"
---`,
    "/docs/application-access/page2.mdx": `---
title: "Application Access Page 2"
description: "Protecting App 2 with Teleport"
---`,
  };

  const transformer = (vfileOptions: VFileOptions) => {
    const file: VFile = new VFile(vfileOptions);

    return remark()
      .use(remarkMdx as any)
      .use(remarkGFM)
      .use(remarkTOC)
      .processSync(file as any);
  };

  test("replaces inclusion expressions", () => {
    const sourcePath = "server/fixtures/toc/database-access/source.mdx";
    const value = readFileSync(resolve(sourcePath), "utf-8");

    const result = transformer({
      value,
      path: sourcePath,
    });

    const actual = result.toString();

    const expected = readFileSync(
      resolve("server/fixtures/toc/expected.mdx"),
      "utf-8"
    );

    expect(result.messages.length).toBe(0);
    expect(actual).toBe(expected);
  });
});
