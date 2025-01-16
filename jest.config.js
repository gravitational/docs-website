// Created using yarn ts-jest config:init
// See:
// https://kulshekhar.github.io/ts-jest/docs/getting-started/installation#jest-config-file
//
/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
};
