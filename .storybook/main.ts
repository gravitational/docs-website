import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  framework: "@storybook/react-webpack5",
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  webpackFinal: async (config) => {
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
