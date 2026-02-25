Use these guidelines when creating or modifying documentation in the Teleport docs-website repository.

## Frontmatter Rules

Every documentation page requires YAML frontmatter. Only fields from `frontmatter_fields.yaml` are allowed.

### Required Fields

```yaml
---
title: Page Title Here
description: A brief description of the page content (used for SEO)
---
```

### Common Optional Fields

```yaml
---
title: Page Title
description: Brief description
sidebar_label: Shorter Sidebar Name  # Displayed in navigation
sidebar_position: 5                   # Order in sidebar (lower = higher)
tags:
  - how-to
  - zero-trust
template: "no-toc"                    # Use for index pages without TOC
enterprise: Identity Governance       # Shows enterprise badge
---
```

### All Allowed Frontmatter Fields

**Docusaurus native fields:**
- `custom_edit_url`, `description`, `displayed_sidebar`, `draft`
- `hide_table_of_contents`, `hide_title`, `id`, `image`, `keywords`
- `last_update`, `pagination_label`, `pagination_next`, `pagination_prev`
- `parse_number_prefixes`, `sidebar_class_name`, `sidebar_custom_props`
- `sidebar_key`, `sidebar_label`, `sidebar_position`, `slug`, `tags`, `title`
- `toc_max_heading_level`, `toc_min_heading_level`, `unlisted`

**Custom fields:**
- `template`, `videoBanner`, `videoBannerDescription`, `enterprise`

## Page Structure Rules

### Introductory Paragraph Required

Every page must have at least one paragraph before the first H2 heading. This explains the purpose and scope of the guide.

```mdx
---
title: Setting Up Database Access
description: Learn how to configure database access with Teleport
---

This guide shows you how to configure Teleport to proxy connections to your
PostgreSQL database, enabling secure access with audit logging.

## How it works
```

### How-To Guide Structure

For how-to guides (pages with numbered steps), the first H2 must be "How it works":

```mdx
## How it works

The Teleport Database Service proxies connections between users and databases.
When a user connects, Teleport authenticates them and establishes a secure
tunnel to the target database.

## Prerequisites

(!docs/pages/includes/edition-prereqs-tabs.mdx!)

## Step 1/3. Configure the database

First, configure your database to accept connections...

## Step 2/3. Deploy the Teleport agent

Deploy a Teleport agent to proxy the database...

## Step 3/3. Connect to the database

Use tsh to connect to your database...

## Next steps

- Learn about [automatic user provisioning](./auto-user-provisioning.mdx)
```

### Step Numbering

Steps must be numbered as `## Step X/N. Task Name` where:
- X is the current step number (1-indexed)
- N is the total number of steps
- Task Name describes what the step accomplishes

Example: `## Step 2/5. Configure the agent`

### No H1 Headings

Never use H1 (`#`) headings in the content. The page title comes from frontmatter.

## Markdown Formatting

### Bullet Lists

Use hyphens (`-`) for unordered lists:

```mdx
- First item
- Second item
- Third item
```

### Emphasis

Use asterisks (`*`) for emphasis:

```mdx
This is *italic* and this is **bold**.
```

### Code Blocks

Always use fenced code blocks with language identifiers:

````mdx
```yaml
teleport:
  data_dir: /var/lib/teleport
```
````

### List Indentation

Use 1 space for list item indentation:

```mdx
- Parent item
 - Child item (1 space indent)
```

## Special Syntax

### Including Partials

Include reusable content with the `(!path!)` syntax. The path is relative to the version's docs root:

```mdx
(!docs/pages/includes/edition-prereqs-tabs.mdx!)
```

Partials can accept parameters:

```mdx
(!docs/pages/includes/edition-prereqs-tabs.mdx edition="Teleport Enterprise"!)
```

Partials define default parameters at the top using `{{ param="default" }}` syntax. Parameters are used with `{{ param }}`.

### Variables

Use `(=variable.path=)` syntax to insert variables from `config.json`:

```mdx
Download Teleport version (=teleport.version=) from our website.
```

Common variables:
- `(=teleport.version=)` - Current Teleport version
- `(=cloud.version=)` - Cloud version
- `(=clusterDefaults.clusterName=)` - Example cluster name

### Var Component

Use `<Var>` for user-replaceable values. Each Var must appear at least 2 times on a page:

```mdx
Replace <Var name="cluster-name" /> with your Teleport cluster address.

```code
$ tsh login --proxy=<Var name="cluster-name" />:443
```

The `<Var>` component inside code blocks uses the same syntax.

## Links

### Relative Links Only

Never use absolute docs links. Use relative paths to `.mdx` files:

```mdx
<!-- CORRECT -->
See the [getting started guide](./getting-started.mdx).
See the [agents documentation](../../agents/agents.mdx).

<!-- INCORRECT - will fail linting -->
See the [getting started guide](/docs/getting-started/).
See the [agents documentation](https://goteleport.com/docs/agents/).
```

## Components

### Tabs

Use for showing alternative approaches:

```mdx
<Tabs>
<TabItem label="Linux">

Download the Linux binary:

```code
$ curl -O https://example.com/linux.tar.gz
```

</TabItem>
<TabItem label="macOS">

Download the macOS binary:

```code
$ curl -O https://example.com/macos.pkg
```

</TabItem>
</Tabs>
```

### Admonition

Use for notes, tips, warnings, and danger notices:

```mdx
<Admonition type="note">
  This is a note with additional context.
</Admonition>

<Admonition type="tip">
  This is a helpful tip.
</Admonition>

<Admonition type="warning">
  This is a warning about potential issues.
</Admonition>

<Admonition type="danger">
  This warns about destructive or dangerous actions.
</Admonition>

<Admonition type="note" title="Custom Title">
  Admonitions can have custom titles.
</Admonition>
```

### Collapsible Sections

Use `<details>` and `<summary>` for optional or advanced content:

```mdx
<details>
<summary>Click to expand optional configuration</summary>

Here is additional configuration that most users don't need...

```yaml
advanced:
  setting: value
```

</details>
```

## File Naming Conventions

- Use **kebab-case** for files and folders: `getting-started.mdx`, `auto-user-provisioning/`
- Use `.mdx` extension for all documentation pages
- Index pages use the folder name: `agents/agents.mdx` for the `/agents/` route

## Code Block Languages

Use appropriate language identifiers:

| Content Type | Language |
|-------------|----------|
| Shell commands | `code` |
| YAML configuration | `yaml` |
| JSON | `json` |
| Go code | `go` |
| Python | `python` |
| JavaScript/TypeScript | `js` / `ts` |
| Diff/changes | `diff` |

Shell commands in `code` blocks can include `$` prefixes and comments:

````mdx
```code
$ tsh login --proxy=teleport.example.com
$ tsh ls
# List all available nodes
```
````

## Templates

### How-To Guide Template

```mdx
---
title: How to [Do Something]
description: Learn how to [accomplish specific task] with Teleport
tags:
  - how-to
---

Brief introduction explaining what this guide accomplishes and who it's for.

## How it works

Explain the high-level architecture in 1-3 paragraphs. Include a diagram if helpful.

## Prerequisites

(!docs/pages/includes/edition-prereqs-tabs.mdx!)

- Additional prerequisite 1
- Additional prerequisite 2

## Step 1/N. First task

Instructions for the first step...

## Step 2/N. Second task

Instructions for the second step...

## Step N/N. Final task

Instructions for the final step...

## Next steps

- Link to related [guide one](./related-guide.mdx)
- Link to related [guide two](./another-guide.mdx)
```

### Reference Page Template

```mdx
---
title: [Feature] Reference
description: Reference documentation for [feature]
tags:
  - reference
---

Brief overview of what this reference covers.

## Configuration

### Option One

Description of the option.

```yaml
option_one: value
```

### Option Two

Description of the option.

```yaml
option_two: value
```

## Related topics

- [Related Guide](./related-guide.mdx)
```

## Linting

Run the markdown linter before committing:

```code
$ yarn markdown-lint
```

To auto-fix formatting issues:

```code
$ FIX=1 yarn markdown-lint
```

Common lint errors:
- Missing introductory paragraph before first H2
- Incorrect step numbering (e.g., `Step 1/3` followed by `Step 3/3`)
- Single-use `<Var>` components (must appear 2+ times)
- Absolute docs links instead of relative paths
- Disallowed frontmatter fields
