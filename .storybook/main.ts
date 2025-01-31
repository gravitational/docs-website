import type { StorybookConfig } from '@storybook/react';

const config: StorybookConfig = {
  // Required
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },

  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-webpack5-compiler-swc'],

  docs: {},

  staticDirs: [],

  typescript: {
    reactDocgen: 'react-docgen-typescript'
  }
};

export default config;
