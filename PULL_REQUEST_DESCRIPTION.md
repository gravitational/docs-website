## What this PR does
Adds the Clay.com visitor tracking script to all pages of the docs site.

## Why
Clay is a data enrichment and outreach platform. This tracking tag identifies which companies are visiting the docs site and is used by the marketing team for outreach and demand generation.

## How it works
Uses Docusaurus's built-in `injectHtmlTags` lifecycle with `postBodyTags`, which is the official way to inject scripts before `</body>` on every page.

## Testing
Build the site locally with `yarn build` and inspect the HTML output — the script tag should appear before `</body>` on every page.
