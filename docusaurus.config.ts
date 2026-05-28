import type { Config, LoadContext, Plugin } from "@docusaurus/types";

import "dotenv/config";
import type { VFile } from "vfile";
import llmsTxtPlugin from "@signalwire/docusaurus-plugin-llms-txt";
import docsNavigationConfig from "./data/docs-navigation.json";

import { definer as hcl } from "highlightjs-terraform";
import path from "path";
import {
  getRootDir,
  getVersionFromVFile,
  updateAssetPath,
  updatePathsInIncludes,
} from "./server/asset-path-helpers";
import { loadConfig } from "./server/config-docs";
import {
  getCurrentVersion,
  getDocusaurusConfigVersionOptions,
  getLatestVersion,
} from "./server/config-site";
import { extendedPostcssConfigPlugin } from "./server/postcss";
import { getRedirects } from "./server/redirects";
import { rehypeHLJS } from "./server/rehype-hljs";
import remarkCodeSnippet from "./server/remark-code-snippet";
import remarkIncludes from "./server/remark-includes";
import remarkNoH1 from "./server/remark-no-h1";
import remarkUpdateAssetPaths from "./server/remark-update-asset-paths";
import remarkVariables from "./server/remark-variables";
import remarkVersionAlias from "./server/remark-version-alias";
import {
  orderSidebarItems,
  removeRedundantItems,
} from "./server/sidebar-order";
import {
  clayTrackingPlugin,
  googleTagGatewayPlugin,
} from "./server/tracking-plugins";
import { llmsTxtPluginOptions } from "./server/llms";
import { fetchVideoMeta } from "./server/youtube-meta";
import { getFromSecretOrEnv } from "./utils/general";
import addTokenCounts from "./server/llms/add-token-counts";

const latestVersion = getLatestVersion();

const sidebarItems = (
  docsNavigationConfig as Array<{ label: string; href: string } | string>
)
  .filter(
    (item): item is { label: string; href: string } => typeof item !== "string",
  )
  .map(({ label, href }) => ({ label, href }));

const config: Config = {
  future: {
    v4: {
      // https://docusaurus.io/blog/releases/3.8#worker-threads
      removeLegacyPostBuildHeadAttribute: true, // required
    },
    // This speeds up build by a lot and should resolve memory issues during build
    // https://docusaurus.io/blog/releases/3.6
    faster: {
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
    require.resolve("./src/scripts/mermaid_icons.js"),
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
    navbar: {
      items: sidebarItems,
    },
    footer: {
      logo: {
        alt: "Teleport Docs",
        src: "logo.svg",
        href: "/",
        width: 249,
        height: 38,
      },
      copyright: `© ${new Date().getFullYear()} Gravitational Inc.; all rights reserved.`,
      links: [
        {
          title: "Connect",
          items: [
            {
              label: "Help & Support",
              href: "https://goteleport.com/support/",
            },
            {
              label: "Community Slack",
              href: "https://goteleport.com/community-slack/",
            },
            {
              label: "GitHub",
              href: "https://github.com/gravitational/teleport",
            },
            {
              label: "Discussions",
              href: "https://github.com/gravitational/teleport/discussions",
            },
          ],
        },
        {
          title: "Explore",
          items: [
            {
              label: "About",
              href: "https://goteleport.com/about/",
            },
            {
              label: "Careers",
              href: "https://goteleport.com/careers/",
            },
            {
              label: "FAQs",
              href: "/faq/",
            },
            {
              label: "Trust Center",
              href: "https://trust.goteleport.com/",
            },
          ],
        },
        {
          title: "Learn & develop",
          items: [
            {
              label: "User Guides",
              href: "/connect-your-client/",
            },
            {
              label: "Downloads",
              href: "https://goteleport.com/downloads/",
            },
            {
              label: "Status",
              href: "https://status.goteleport.com/",
            },
            {
              label: "Teleport Labs",
              href: "https://goteleport.com/labs/",
            },
          ],
        },
        {
          title: "See the latest",
          items: [
            {
              label: "Beams",
              href: "https://www.beams.run/",
              tag: "New",
            },
            {
              label: "Teleport Feature Matrix",
              href: "/feature-matrix/",
            },
            {
              label: "Upcoming Releases",
              href: "/upcoming-releases/",
            },
            {
              label: "Changelog",
              href: "/changelog/",
            },
          ],
        },
      ],
    },
    image: "/og-image.png",
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    metadata: [
      { name: "author", content: "Teleport" },
      { property: "og:type", content: "website" },
    ],
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
    {
      tagName: "link",
      attributes: {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "preconnect",
        href: "https://img.youtube.com",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "preload",
        fetchpriority: "high",
        as: "image",
        href: "/docs/assets/images/docs-header-background-df72d815e0b2376722c03a2049d2a2b5.svg",
      },
    },
  ],

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
    mermaid: true,
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
    hooks: {
      onBrokenMarkdownLinks: "throw",
    },
    emoji: false, // disabled because code snippets could be unintentionally replaced with emojis (https://github.com/gravitational/docs-website/issues/554).
  },
  themes: ["@docusaurus/theme-mermaid"],
  onBrokenLinks: "throw",
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
            getDocPageByID,
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
            currentVersion,
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
    clayTrackingPlugin,
    googleTagGatewayPlugin,
    process.env.NODE_ENV !== "production" && "@docusaurus/plugin-debug",

    // By default any postBuild function from plugins will run concurrently.
    // addTokenCounts is expected to run after llmsTxtPlugin,
    // so we chain them together in a single plugin to ensure the correct order of execution.
    function chainllmsTxtPluginWithAddTokenCounts(
      context: LoadContext,
    ): Plugin {
      return {
        name: "chain-llms-txt-with-add-token-counts",
        async postBuild(props): Promise<void> {
          await llmsTxtPlugin(context, llmsTxtPluginOptions).postBuild?.call(
            this,
            { ...props, content: undefined },
          );
          await addTokenCounts().postBuild?.call(this);
        },
        // Pass the contentLoaded and extendCli from llmsTxtPlugin without modification
        contentLoaded({ actions }): void {
          llmsTxtPlugin(context, llmsTxtPluginOptions).contentLoaded?.call(
            this,
            { content: undefined, actions },
          );
        },
        extendCli(cli): void {
          llmsTxtPlugin(context, llmsTxtPluginOptions).extendCli?.call(
            this,
            cli,
          );
        },
      };
    },
  ].filter(Boolean),
};

export default config;
