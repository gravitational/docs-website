import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import type { Node } from "unist";
import { parse } from "yaml";
import type { Literal } from "mdast";
import type { JSONSchema7 } from "json-schema";
import Ajv from "ajv";

const possibleProducts = [
  "identity-governance",
  "identity-security",
  "mwi",
  "zero-trust",
  "platform-wide",
];

const possibleTypes = [
  "how-to",
  "conceptual",
  "get-started",
  "reference",
  "faq",
  "other",
];

interface LintFrontmatterOptions {
  allowedFields: Array<string>;
}

export const remarkLintFrontmatter = lintRule(
  "remark-lint:frontmatter",
  (root: Node, vfile, options: JSONSchema7) => {
    // Ensure additionalProperties is false. The point of this linter is to
    // prevent misspelled or removed frontmatter fields from making it into
    // the docs and causing unintended behavior or confusion for maintainers.
    options.additionalProperties = false;

    let hasFrontmatter = false;
    const ajv = new Ajv({
      allErrors: true,
    });
    const validate = ajv.compile(options);

    visit(root, "yaml", (node: Node) => {
      hasFrontmatter = true;

      // Include frontmatter parsing errors as linting errors.
      let frontmatter: Record<string, any>;
      try {
        frontmatter = parse((node as Literal).value);
      } catch (err) {
        vfile.message(
          `page has invalid YAML in frontmatter: ${(err as Error).message}`,
        );
        return;
      }

      // Special case: there are no frontmatter fields. This check only catches
      // unrecognized fields, so ignore the empty frontmatter object.
      if (!frontmatter) {
        return;
      }

      const valid = validate(frontmatter);
      if (valid) {
        return;
      }

      const extraFields: Array<string> = [];
      validate.errors!.forEach((e) => {
        switch (e.keyword) {
          case "type":
            // Ignore specific type errors for now. The linter focuses on
            // additional properties and overall malformed frontmatter, so
            // check whether the whole frontmatter document is an incorrect
            // type.
            if (e.instancePath !== "") {
              return;
            }
            vfile.message("page frontmatter must be a YAML object");
            return;

          case "additionalProperties":
            extraFields.push(e.params.additionalProperty);
        }
      });

      if (extraFields.length > 0) {
        vfile.message(
          `page frontmatter has unrecognized fields: ${extraFields.join(", ")}`,
        );
      }
    });

    if (!hasFrontmatter) {
      vfile.message(
        `the page must begin with a YAML frontmatter document surrounded by "---" separators`,
        root.position,
      );
    }
  },
);
