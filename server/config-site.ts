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
    release?: string;
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
          isDefault: { type: "boolean", nullable: true },
          deprecated: { type: "boolean", nullable: true },
          release: { type: "string", nullable: true },
        },
        additionalProperties: false,
        required: ["name"],
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

// Returns a list of supported versions, excluding deprecated ones, sorted
// ascending by number.
const getSupportedVersions = () => {
  const { versions } = loadConfig();

  const supportedVersions = versions.filter(({ deprecated }) => !deprecated);
  supportedVersions.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    }
    return 0;
  });
  return supportedVersions;
};

// getLatestVersion returns the name of the latest supported version, i.e., the
// default version of the docs site. This is the versioned marked isDefault in
// the version configuration. If this is the highest supported version, we use
// the name "current" to satisfy the expectations of Docusaurus.
export const getLatestVersion = () => {
  const versions = getSupportedVersions();
  const idx = versions.findIndex(({ isDefault }) => isDefault === true);
  if (idx == versions.length - 1) {
    // By Docusaurus convention, the highest-numbered version is called
    // "current".
    return "current";
  }
  return versions[idx].name;
};

// getDefaultVersion returns the name of the latest supported version, i.e., the
// default version of the docs site.
export const getDefaultVersion = () => {
  const versions = getSupportedVersions();
  return versions.find(({ isDefault }) => isDefault === true).name;
};

// getCurrentVersion returns the name of the version that the Docusaurus
// configuration calls "current". This is the name of the highest supported
// version.
export const getCurrentVersion = () => {
  const versions = getSupportedVersions();

  return versions[versions.length - 1].name;
};

/* Returns version options for docusaurus.config.js */

export const getDocusaurusConfigVersionOptions = (): Record<
  string,
  VersionOptions
> => {
  const versions = getSupportedVersions();

  // Since we build the Docusaurus site from GitHub releases in production,
  // there is no "current" version, i.e., a docs version that is under
  // development. In this way, our use of Docusaurus versions differs from the
  // convention described in the Docusaurus documentation:
  // https://docusaurus.io/docs/versioning
  // At the same time, we still need to name the latest version "current" to
  // meet the expectations of Docusaurus.
  return versions.reduce((result, { name, release, isDefault }, idx) => {
    const isCurrent = idx === versions.length - 1;
    const versionName = isCurrent ? "current" : name;

    const versionOptions: VersionOptions = {
      label: release || name,
      // Configure root path for the version. Latest in the root, others in the `ver/XX.x` folder.
      path: isDefault ? "" : `ver/${name}`,
    };

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
