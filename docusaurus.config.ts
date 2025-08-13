import "dotenv/config";
import type { Config } from "@docusaurus/types";
import type { VFile } from "vfile";

import { useDocById } from "@docusaurus/plugin-content-docs/client";
import { getFromSecretOrEnv } from "./utils/general";
import { loadConfig } from "./server/config-docs";
import {
  getCurrentVersion,
  getDocusaurusConfigVersionOptions,
  getLatestVersion,
} from "./server/config-site";
import remarkUpdateAssetPaths from "./server/remark-update-asset-paths";
import remarkIncludes from "./server/remark-includes";
import remarkNoH1 from "./server/remark-no-h1";
import remarkVariables from "./server/remark-variables";
import remarkVersionAlias from "./server/remark-version-alias";
import remarkCodeSnippet from "./server/remark-code-snippet";
import { fetchVideoMeta } from "./server/youtube-meta";
import { getRedirects } from "./server/redirects";
import {
  updateAssetPath,
  getVersionFromVFile,
  getRootDir,
  updatePathsInIncludes,
} from "./server/asset-path-helpers";
import {
  orderSidebarItems,
  removeRedundantItems,
} from "./server/sidebar-order";
import { extendedPostcssConfigPlugin } from "./server/postcss";
import { rehypeHLJS } from "./server/rehype-hljs";
import { definer as hcl } from "highlightjs-terraform";
import path from "path";
import fs from "fs";

const latestVersion = getLatestVersion();

const config: Config = {
  future: {
    v4: {
      // https://docusaurus.io/blog/releases/3.8#worker-threads
      removeLegacyPostBuildHeadAttribute: true, // required
    },
    // This speeds up build by a lot and should resolve memory issues during build
    // https://docusaurus.io/blog/releases/3.6
    experimental_faster: {
      swcJsLoader: true,
      swcJsMinimizer: true,
      lightningCssMinimizer: true,
      rspackBundler: true,
      // Using the persistent cache causes unexpected issues with retrieving
      // stale data in CI/CD since it is stored in `node_modules`, which is
      // often cached. For local development, the cache is unnecessary since
      // the user changes docs files anyway.
      rspackPersistentCache: false,
      mdxCrossCompilerCache: true,
      ssgWorkerThreads: true,
    },
  },
  customFields: {
    inkeepConfig: {
      apiKey: getFromSecretOrEnv("INKEEP_API_KEY"),
    },
  },
  clientModules: [
    "./src/styles/variables.css",
    "./src/styles/fonts-lato.css",
    "./src/styles/fonts-ubuntu.css",
    "./src/styles/global.css",
  ],
  themeConfig: {
    docs: {
      sidebar: {
        autoCollapseCategories: true,
      },
    },
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
  // configure "noIndex" for all branches except the "main"
  noIndex: process.env.AWS_BRANCH !== "main",
  // Our hosting infrastructure redirects requests to a docs page that do not
  // contain a trailing slash in the URL, so add trailing slashes to sitemap
  // URLs to prevent clients from receiving non-200 responses.
  trailingSlash: true,

  markdown: {
    parseFrontMatter: async (params) => {
      const result = await params.defaultParseFrontMatter(params);

      // If we have videoBanner file in config, we load this vide data through YouTube API.
      const { videoBanner, videoBannerDescription } = result.frontMatter;

      if (typeof videoBanner === "string") {
        const videoBannerData = await fetchVideoMeta(videoBanner);
        if (videoBannerDescription) {
          videoBannerData.description = videoBannerDescription as string;
        }
        result.frontMatter.videoBanner = videoBannerData;
      }

      return result;
    },
  },

  onBrokenLinks: "throw",
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
      "@docusaurus/plugin-google-tag-manager",
      {
        containerId: "GTM-WMR7H6",
      },
    ],
    "@docusaurus/theme-classic",
    "@docusaurus/plugin-sitemap",
    [
      "@docusaurus/plugin-svgr",
      {
        svgrConfig: {
          svgoConfig: {
            plugins: ["prefixIds"],
          },
        },
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        async sidebarItemsGenerator({
          defaultSidebarItemsGenerator,
          numberPrefixParser,
          item,
          version,
          docs,
          categoriesMetadata,
          isCategoryIndex,
        }) {
          const items = await defaultSidebarItemsGenerator({
            defaultSidebarItemsGenerator,
            numberPrefixParser,
            item,
            version,
            docs,
            categoriesMetadata,
            isCategoryIndex,
          });

          const idToDocPage = new Map();
          docs.forEach((d) => {
            idToDocPage.set(d.id, d);
          });

          const getDocPageByID = (id: string) => {
            return idToDocPage.get(id);
          };

          return orderSidebarItems(
            removeRedundantItems(items, item.dirName),
            getDocPageByID
          );
        },
        // Host docs on the root page, later it will be exposed on goteleport.com/docs
        // next to the website and blog
        // https://docusaurus.io/docs/docs-introduction#docs-only-mode
        routeBasePath: "/",
        sidebarPath: "./sidebars.json",
        lastVersion: latestVersion,
        versions: getDocusaurusConfigVersionOptions(),
        // Our custom plugins need to be before default plugins
        beforeDefaultRemarkPlugins: [
          [remarkVersionAlias, getCurrentVersion()],
          [
            remarkIncludes,
            {
              rootDir: (vfile: VFile) => getRootDir(vfile),
              updatePaths: updatePathsInIncludes,
            },
          ],
          [
            remarkVariables,
            {
              variables: (vfile: VFile) =>
                loadConfig(getVersionFromVFile(vfile), ".").variables,
            },
          ],
          remarkNoH1,
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
        onInlineTags: "throw",
      },
    ],
    // This is for allowing to import images in .mdx files using the @content alias
    // TODO: create a remark plugin for processing image paths inside the attributes of MdxJsxFlowElement nodes.
    // See https://github.com/facebook/docusaurus/blob/main/packages/docusaurus-mdx-loader/src/remark/transformImage/index.ts#L267
    function contentAlias() {
      return {
        name: "content-loader",
        configureWebpack() {
          const currentVersion = getLatestVersion();
          const alias: string = path.resolve(
            __dirname,
            "./content",
            currentVersion
          );

          return {
            resolve: {
              alias: {
                "@content": alias,
              },
            },
          };
        },
      };
    },
    extendedPostcssConfigPlugin,
    process.env.NODE_ENV !== "production" && "@docusaurus/plugin-debug",
  ].filter(Boolean),
};

export default config;
