const jestConfig = {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.[tj]s$": [
      "ts-jest",
    ],
  },
  transformIgnorePatterns: [""],
};
export default jestConfig;
