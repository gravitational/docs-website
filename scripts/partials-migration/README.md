# Partials migration tool

The partials migration tool converts legacy `(!path!)` partial references in
the docs content to the MDX-native syntax. It classifies each referenced partial
by complexity, then upgrades the partials in the requested class, along with
the files that reference them.

It needs bash and Node.js. The Node.js script only uses built-in modules, so no
dependencies need to be installed.

## Usage

```
bash partials-upgrader.sh <content-root> [class] [--list]
```

- `<content-root>`: path to the root of the docs content repo, relative to the
  current directory. It must contain `docs/pages`.
- `[class]`: a class from 1 to 5. Without a provided class, the tool
  prints a count of partials per class and changes nothing.
- `--list`: prints the paths in the given class, comma-separated on one line,
  without upgrading them. It requires a class.

Classes:

| Class | Meaning                                      |
| ----- | -------------------------------------------- |
| 1     | Plain static content                         |
| 2     | Uses `{{variable}}` parameters               |
| 3     | Includes other partials via `(!...!)`        |
| 4     | Uses JSX components (`<UpperCase ...>`)      |
| 5     | Files in `examples/` (raw text, not MDX)     |

A partial matching several patterns is assigned the highest class it matches.

Only `.md` and `.mdx` partials are rewritten. Other files, such as everything in
`examples/` and `.yaml` files in `includes/`, are left as they are, and only the
references to them are updated. These files still count toward their class: for
example, a `.yaml` partial with no parameters is in class 1.

### Upgrading specific paths

To upgrade specific partials (and references to them) without the classification step
, pipe their paths to the script and omit the class. Paths are relative to the content 
root, separated by commas or newlines. A leading `/` on `docs/` and `examples/` paths is ignored.

```sh
printf 'docs/pages/includes/example.mdx,docs/pages/includes/another.mdx' | bash partials-upgrader.sh ../teleport
```

## What the upgrade changes

A partial's `{{variable}}` parameters become props, keeping their defaults.
Hyphenated names become camelCase:

```mdx
{{ value="default" iam-role="DefaultRole" }}
Value: {{ value }}
Role: {{ iam-role }}
```

```mdx
Value: {props.value ?? "default"}
Role: {props.iamRole ?? "DefaultRole"}
```

A reference to an upgraded partial becomes an import and a JSX element:

```mdx
(!docs/pages/includes/demo.mdx value="caller value"!)
```

```mdx
import DocsPagesIncludesDemo from "@version/docs/pages/includes/demo.mdx";

<DocsPagesIncludesDemo value="caller value" />
```

A reference inside a code fence becomes a raw-text import shown in a
`<CodeBlock>`:

````mdx
```yaml
(!/examples/config.yaml!)
```
````

```mdx
import ExamplesConfig from "!!raw-loader!@version/examples/config.yaml";

<CodeBlock language="yaml">

  {ExamplesConfig}

</CodeBlock>
```

The tool parses every file before writing any of them, so a parse error leaves
the content unchanged. Each file is then replaced in a single step, so an
interrupted run doesn't leave half-written files.

## Example

Count the partials in each class:

```sh
bash partials-upgrader.sh ../teleport
```

List the class 2 partials:

```sh
bash partials-upgrader.sh ../teleport 2 --list
```

Upgrade the class 2 partials and the files that reference them:

```sh
bash partials-upgrader.sh ../teleport 2
```

The last command prints a summary such as:

```
Upgraded 37 partial(s).
Updated partial references in 120 file(s).
```

The first line only appears when at least one `.md` or `.mdx` partial was
rewritten, so upgrading class 5 only prints the second line.

## Tests

```sh
yarn test --testPathPatterns partials-migration
```
