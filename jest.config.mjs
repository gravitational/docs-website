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
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/*"],
};
export default jestConfig;
