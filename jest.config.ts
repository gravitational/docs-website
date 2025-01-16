import type { Config } from "jest";

const config: Config = {
  transform: {
    "\\.[tj]sx?$": ["babel-jest", { configFile: "./babel.jest.config.js" }],
  },
};

export default config;
