// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-webpack5";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  framework: "@storybook/react-webpack5",
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    {
      name: "@storybook/addon-styling-webpack",
      options: {
        rules: [
          // Replaces existing CSS rules to support CSS Modules
          {
            test: /\.css$/,
            use: [
              "style-loader",
              {
                loader: "css-loader",
                options: {
                  modules: {
                    auto: true,
                    localIdentName: "[name]__[local]--[hash:base64:5]",
                  },
                },
              },
            ],
          },
        ],
      },
    },
  ],
  webpackFinal: async (config) => {
    // Mock @docusaurus/router and @docusaurus/Link for Storybook
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@docusaurus/router": path.resolve(__dirname, "./mocks/docusaurus-router.ts"),
      "@docusaurus/Link": path.resolve(__dirname, "./mocks/docusaurus-link.tsx"),
      "@docusaurus/BrowserOnly": path.resolve(__dirname, "./mocks/docusaurus-browser-only.tsx"),
      "@docusaurus/theme-common": path.resolve(__dirname, "./mocks/docusaurus-theme-common.ts"),
      "@docusaurus/useDocusaurusContext": path.resolve(__dirname, "./mocks/docusaurus-use-docusaurus-context.ts"),
      "@site": path.resolve(__dirname, ".."),
    };

    config.module?.rules?.push({
      test: /\.css$/,
      use: {
        loader: "postcss-loader",
      },
    });

    const imageRule = config.module?.rules?.find((rule) => {
      const test = (rule as { test: RegExp }).test;

      if (!test) {
        return false;
      }

      return test.test(".svg");
    }) as { [key: string]: any };

    imageRule.exclude = /\.svg$/;

    config.module?.rules?.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    config.module?.rules?.push({
      test: /\.tsx?$/,
      use: [
        {
          loader: "ts-loader",
          options: {
            logLevel: "INFO",
            logInfoToStdOut: true,
            configFile: "tsconfig.storybook.json",
            // Otherwise, properties added by Storybook trip the TypeScript
            // checker.
            transpileOnly: true,
          },
        },
      ],
      exclude: /node_modules/,
    });

    return config;
  },
};
export default config;
