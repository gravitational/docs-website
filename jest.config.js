// Config pasted from:
// https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/
import { createDefaultEsmPreset } from "ts-jest";

const presetConfig = createDefaultEsmPreset();

const jestConfig = {
  ...presetConfig,
};

export default jestConfig;
