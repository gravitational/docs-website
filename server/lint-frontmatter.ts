import { lintRule } from "unified-lint-rule";
import { visit } from "unist-util-visit";
import type { Node } from "unist";
import { parse } from "yaml";
import type { Literal } from "mdast";
import type { JSONSchema7 } from "json-schema";
import Ajv from "ajv";

const schemaErrorPrefix = "issue validating page frontmatter: ";

export const remarkLintFrontmatter = lintRule(
  "remark-lint:frontmatter",
  (root: Node, vfile, options: JSONSchema7) => {
    // Ensure additionalProperties is false. The point of this linter is to
    // prevent misspelled or removed frontmatter fields from making it into
    // the docs and causing unintended behavior or confusion for maintainers.
    options.additionalProperties = false;

    let hasFrontmatter = false;
    const ajv = new Ajv({
      // Include all errors and their messages. Critical for printing linter warnings.
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

      validate.errors!.forEach((e) => {
        let msg = schemaErrorPrefix;
        if (e.instancePath !== "") {
          msg += `${e.instancePath.replaceAll("/", ".")}: `;
        }
        switch (e.keyword) {
          case "additionalProperties":
            msg += `unexpected property "${e.params.additionalProperty}"`;
            break;
          case "enum":
            const allowed = e.params.allowedValues.map((v: unknown) => {
              if (v === null) {
                return "null";
              }
              return v;
            });
            msg += `must be one of: ${allowed.join(", ")}`;
            break;
          default:
            msg += e.message!;
        }
        vfile.message(msg);
      });
    });

    if (!hasFrontmatter) {
      vfile.message(
        `the page must begin with a YAML frontmatter document surrounded by "---" separators`,
        root.position,
      );
    }
  },
);
