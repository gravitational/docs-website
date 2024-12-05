/*
 * this is the main config loading and normalization logic.
 */

import Ajv from "ajv";
import { validateConfig } from "./config-common";
import { resolve } from "path";
import { VersionOptions } from "@docusaurus/plugin-content-docs";
import { loadJson } from "./json";

interface Config {
  versions: {
    name: string;
    branch: string;
    isDefault?: boolean;
    deprecated?: boolean;
  }[];
}

interface NormalizedConfig {
  isDefault: string;
  versions: string[];
  branches: Record<string, string>;
}

export const load = () => {
  return loadJson(resolve("config.json")) as Config;
};

/*
 * This a JSON schema describing config.json file format, if actual config
 * have wrong fields or don't have something required, it will throw error then we try
 * to start dev or build mode.
 */

const ajv = new Ajv({ allowUnionTypes: true });

const validator = ajv.compile({
  type: "object",
  properties: {
    versions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          branch: { type: "string" },
          isDefault: { type: "boolean", nullable: true },
          deprecated: { type: "boolean", nullable: true },
        },
        additionalProperties: false,
        required: ["name", "branch"],
      },
      minItems: 1,
      uniqueItems: true,
    },
  },
  required: ["versions"],
});

/* Load and validate config. */

export const loadConfig = () => {
  const config = load();

  validateConfig<Config>(validator, config);

  return config;
};

// Returns a list of supported versions, excluding deprecated ones.s

const getSupportedVersions = () => {
  const { versions } = loadConfig();

  return versions.filter(({ deprecated }) => !deprecated);
};

// Returns name of the latest version.

export const getLatestVersion = () => {
  const versions = getSupportedVersions();

  return (
    versions.find(({ isDefault }) => isDefault === true) ||
    versions[versions.length - 1]
  ).name;
};

// Returns name of the current version.

export const getCurrentVersion = () => {
  const versions = getSupportedVersions();

  return (
    versions[versions.length - 1]
  ).name;
};

/* Returns version options for docusaurus.config.js */

export const getDocusaurusConfigVersionOptions = (): Record<
  string,
  VersionOptions
> => {
  const versions = getSupportedVersions();

  return versions.reduce((result, { name, isDefault, branch }, idx) => {
    // Use "current" as the name for the current version (i.e., the edge
    // version), the highest-numbered version in the configuration. This way
    // Docusaurus will look for it in the `docs` folder instead of
    // `versioned_docs`.
    const isCurrent = idx === versions.length - 1;
    const versionName = isCurrent ? "current" : name;

    const versionOptions: VersionOptions = {
      label: isCurrent ? `${name} (unreleased)` : name,
      // Configure root path for the version. Latest in the root, others in the `ver/XX.x` folder.
      path: isDefault ? "" : `ver/${name}`,
    };

    // Banner will show message for the current version that it is still WIP.
    if (isCurrent) {
      versionOptions.banner = "unreleased";
    }

    return { ...result, [versionName]: versionOptions };
  }, {});
};

// Return names of all non-deprecated versions, sorted in descending order.

export const getVersionNames = (): string[] => {
  const versions = getSupportedVersions();

  return versions
    .map(({ name }) => name)
    .sort()
    .reverse();
};

/* Returns sorted list of versions for versions.json, all non-deprecated except current, */

export const getDocusaurusVersions = (): string[] => {
  const versions = getVersionNames();
  const currentVersion = getCurrentVersion();

  return versions.filter((version) => version !== currentVersion);
};
