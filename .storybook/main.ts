import type { StorybookConfig } from "@storybook/react";

// Explanation of the framework config:
// https://storybook.js.org/docs/configure/integration/compilers#the-swc-compiler-doesnt-work-with-react
const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-webpack5",
    options: {
      builder: {
        useSWC: true,
      },
    },
  },
  swc: () => ({
    jsc: {
      transform: {
        react: {
          runtime: "automatic",
        },
      },
    },
  }),
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-webpack5-compiler-swc",
  ],

  docs: {},

  staticDirs: [],

  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
