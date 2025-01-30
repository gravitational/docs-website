import "dotenv/config";
import type { Config } from "@docusaurus/types";
import type { VFile } from "vfile";

import { getFromSecretOrEnv } from "./utils/general";
import { loadConfig } from "./server/config-docs";
import {
  getDocusaurusConfigVersionOptions,
  getLatestVersion,
  getCurrentVersion,
} from "./server/config-site";
import remarkUpdateAssetPaths from "./server/remark-update-asset-paths";
import remarkIncludes from "./server/remark-includes";
import remarkVariables from "./server/remark-variables";
import remarkUpdateTags from "./server/remark-update-tags";
import remarkTOC from "./server/remark-toc";
import remarkCodeSnippet from "./server/remark-code-snippet";
import { fetchVideoMeta } from "./server/youtube-meta";
import { getRedirects } from "./server/redirects";
import {
  updateAssetPath,
  getVersionFromPath,
  getRootDir,
  updatePathsInIncludes,
} from "./server/asset-path-helpers";
import { extendedPostcssConfigPlugin } from "./server/postcss";
import { rehypeHLJS } from "./server/rehype-hljs";
import { definer as hcl } from "highlightjs-terraform";

// In Docusaurus parlance, the latest version is the default version of the docs
// site. The current version is the unreleased version.
const latestVersion = getLatestVersion();
const unreleasedVersion = getCurrentVersion();

const config: Config = {
  future: {
    // This speeds up build by a lot and should resolve memory issues during build
    // https://docusaurus.io/blog/releases/3.6
    experimental_faster: true,
  },
  customFields: {
    inkeepConfig: {
      apiKey: getFromSecretOrEnv("INKEEP_API_KEY"),
      integrationId: getFromSecretOrEnv("INKEEP_INTEGRATION_ID"),
      organizationId: getFromSecretOrEnv("INKEEP_ORGANIZATION_ID"),
    },
  },
  clientModules: [
    "./src/styles/variables.css",
    "./src/styles/fonts-lato.css",
    "./src/styles/fonts-ubuntu.css",
    "./src/styles/global.css",
  ],
  themeConfig: {
    image: "/og-image.png",
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    headTags: [
      {
        tagName: "link",
        attributes: {
          rel: "apple-touch-icon",
          href: "/apple.png",
        },
      },
      {
        tagName: "link",
        attributes: {
          rel: "manifest",
          href: "/manifest.webmanifest",
        },
      },
      {
        tagName: "script",
        attributes: {
          type: "application/ld+json",
        },
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Corporation",
          name: "Teleport",
          alternateName: "Gravitational Inc.",
          url: "https://goteleport.com/",
          logo: "https://goteleport.com/static/og-image.png",
          sameAs: [
            "https://www.youtube.com/channel/UCmtTJaeEKYxCjfNGiijOyJw",
            "https://twitter.com/goteleport/",
            "https://www.linkedin.com/company/go-teleport/",
            "https://en.wikipedia.org/wiki/Teleport_(software)",
          ],
        }),
      },
      {
        tagName: "script",
        attributes: {
          type: "application/ld+json",
        },
        innerHTML: JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "WebSite",
          name: "Teleport Docs",
          url: "https://goteleport.com/docs/",
        }),
      },
    ],
    metadata: [
      { name: "author", content: "Teleport" },
      { property: "og:type", content: "website" },
    ],
  },

  title: "Teleport",
  favicon: "/favicon.svg",
  url: process.env.DOCUSAURUS_CONFIG_URL || "https://goteleport.com",
  baseUrl: process.env.DOCUSAURUS_CONFIG_BASE_URL || "/",
  // Our hosting infrastructure redirects requests to a docs page that do not
  // contain a trailing slash in the URL, so add trailing slashes to sitemap
  // URLs to prevent clients from receiving non-200 responses.
  trailingSlash: true,

  markdown: {
    parseFrontMatter: async (params) => {
      const result = await params.defaultParseFrontMatter(params);

      // If we have videoBanner file in config, we load this vide data through YouTube API.
      const { videoBanner } = result.frontMatter;

      if (typeof videoBanner === "string") {
        result.frontMatter.videoBanner = await fetchVideoMeta(videoBanner);
      }

      return result;
    },
  },

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "throw",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  plugins: [
    [
      "@docusaurus/plugin-client-redirects",
      {
        // Generate common redirects list for all versions
        redirects: [...getRedirects()],
        // Solves migration from "current" to "latest" version
        createRedirects(existingPath: string) {
          if (existingPath.startsWith(`/ver/${latestVersion}`)) {
            return existingPath.replace(`/ver/${latestVersion}`, "");
          }
        },
      },
    ],
    [
      "@docusaurus/plugin-google-gtag",
      {
        trackingID: "G-Z1BMQRVFH3",
        anonymizeIP: true,
      },
    ],
    "@docusaurus/theme-classic",
    "@docusaurus/plugin-sitemap",
    [
      "@docusaurus/plugin-content-docs",
      {
        // Host docs on the root page, later it will be exposed on goteleport.com/docs
        // next to the website and blog
        // https://docusaurus.io/docs/docs-introduction#docs-only-mode
        routeBasePath: "/",
        sidebarPath: "./sidebars.json",
        lastVersion: latestVersion,
        versions: getDocusaurusConfigVersionOptions(),
        // Our custom plugins need to be before default plugins
        beforeDefaultRemarkPlugins: [
          [
            remarkIncludes,
            {
              rootDir: (vfile: VFile) => getRootDir(vfile),
              updatePaths: updatePathsInIncludes,
              latestVersion: unreleasedVersion,
              projectPath: process.cwd(),
            },
          ],
          [
            remarkVariables,
            {
              variables: (vfile: VFile) =>
                loadConfig(getVersionFromPath(vfile.path, unreleasedVersion))
                  .variables,
            },
          ],
          [
            remarkCodeSnippet,
            {
              langs: ["code"],
            },
          ],
          [
            remarkUpdateAssetPaths,
            {
              updater: updateAssetPath,
            },
          ],
          // remarkTOC must occur after remarkUpdateAssetPaths, otherwise some
          // table of contents links will be malformed.
          remarkTOC,
          remarkUpdateTags,
        ],
        beforeDefaultRehypePlugins: [
          [
            rehypeHLJS,
            {
              aliases: {
                bash: ["bsh", "systemd", "code", "powershell"],
                yaml: ["conf", "toml"],
              },
              languages: { hcl: hcl },
            },
          ],
        ],
      },
    ],
    extendedPostcssConfigPlugin,
    process.env.NODE_ENV === "production" && "@docusaurus/plugin-debug",
  ].filter(Boolean),
};

export default config;
