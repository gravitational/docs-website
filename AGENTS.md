# AGENTS.md

Teleport docs website: a multi-version Docusaurus site.
  
## Content workflow

Docs page content changes belong in the target version under `content/[version]/docs/pages/`. Files in `includes/` directories are reusable snippets, not standalone pages.

Under `content/`, each subdirectory is a git submodule that points to a branch
of `gravitational/teleport`. In each submodule is a nested submodule, `e`, which
contains Teleport Enterprise source code but **not** documentation content.

Docs site implementation changes belong outside `content/`, usually in `src/`, `server/`, `scripts/`, `static/`, `data/`, or root config files.

Do not edit `docs/`, `versioned_docs/`, `versioned_sidebars/`, or `sidebars.json` directly for docs content changes; those files are generated from `content/[version]/` by `yarn prepare-files` based on the version structure in `config.json`.

## Commands

```bash
yarn prepare-files              # Rebuild docs/, versioned_docs/, sidebars.json, and versioned_sidebars/ from content/.
yarn prepare-navigation-data    # Refresh navbar/event data in data/.
yarn markdown-lint              # Lint MDX docs content. Does not auto-fix; errors must be corrected manually.
yarn lint-check                 # Check JS/TS/JSON formatting and linting.
yarn typecheck                  # TypeScript validation.
yarn test                       # Jest tests for src/ and server/.
yarn clear                      # Clear Docusaurus cache.
```

Command side effects:

- `yarn build` runs `yarn git-update`, `yarn prepare-files`, `yarn prepare-navigation-data`, then `docusaurus build`; it can update submodules and rewrite generated docs output.
- `yarn git-update` updates submodules to configured remote branches.
- `yarn dev` runs local setup/watch scripts and may install macOS Homebrew dependencies such as `rsync`, `watchexec`, and `jq`.
- For a local production build without submodule updates, use `yarn prepare-files && yarn prepare-navigation-data && yarn docusaurus build`.

## Boundaries

Ask first:

- Adding, removing, or changing versions in `config.json`.
- Modifying `.gitmodules`, submodule structure, or manually updating submodule refs.
- Running `yarn git-update` when not explicitly requested.
- Changing `docusaurus.config.ts`, custom remark/rehype plugins, or build pipeline behavior in `server/`.
- Installing dependencies or changing package manager files.
- Modifying CI/CD workflows in `.github/workflows/`.

## MDX rules

New MDX content pages, excluding `includes/` pages, need at least:

```yaml
---
title: "Page Title"
description: "Short SEO description"
---
```

Common optional fields:

```yaml
sidebar_label: "Nav Label"
sidebar_position: 1
tags: 
 - tag1
 - tag2
```

Use frontmatter fields from `frontmatter_fields.yaml` and tags from `tags.yml`.

Special syntax:

```mdx
(!docs/pages/includes/snippet.mdx!)
(=teleport.version=)
```

Prefer relative `.mdx` links for internal docs pages, e.g. `[Install Teleport](../installation/single-machine/single-machine.mdx)`. Do not use absolute `https://goteleport.com/docs/...` links for internal docs pages.

## Working with `remark` linters

`remark` linters are in `./server`. We use them to check issues with docs pages
that require traversing an AST.

Follow this section if you are helping to:
- Build a new `remark` linter
- Modify an existing `remark` linter
- Get guides to pass a linter, e.g., a linter that hasn't been merged yet

Always run the linter, rather than attempt to replicate the linter's rules with
a temporary custom script. The linter config in `.remarkrc.mjs` includes some
steps that you are likely to skip, such as expanding `(! !)` inclusion syntax.

Before running the linter, run `yarn` to install dependencies or ask the user to
do it.

## Verification

For docs content verification from the docs-website root:

```bash
yarn prepare-files
yarn markdown-lint
```

Run `yarn prepare-navigation-data` when checking site navigation or doing a full local site build.

For site, script, or server code changes:

```bash
yarn lint-check
yarn typecheck
yarn test
```

## Testing guidelines

### Unit tests

Write unit tests for components or utilities with complex logic. Extract logic into testable functions when possible.

Examples in the codebase:
- `src/utils/suggestions.test.ts` - Tests for page suggestion algorithms
- `server/remark-variables.test.ts` - Tests for MDX transformation plugins

Unit tests should live alongside the code they test (`.test.ts` or `.test.tsx` files)

### Storybook tests

For components with non-trivial user interactions (forms, buttons with state changes, multi-step flows), add Storybook stories with interaction tests.

Example in the codebase:
- `src/components/ThumbsFeedback/ThumbsFeedback.stories.tsx` - Tests user clicking feedback buttons, typing comments, and submitting

## Additional references

- Markdown linting rules: `.remarkrc.mjs`
- Build configuration: `docusaurus.config.ts`
