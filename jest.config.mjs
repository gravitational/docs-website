/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.[tj]s$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.node.json",
      },
    ],
    "^.+\\.[tj]sx$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.storybook.json",
      },
    ],
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/*"],
};
export default jestConfig;
