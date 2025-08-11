/*
 * Each version of the docs has it's own config stored at
 * /content/X.X/docs/config.json. This file normalises and validates
 * these config files.
 */

import Ajv from "ajv";
import { validateConfig } from "./config-common";
import { join, sep } from "path";
import { existsSync, readFileSync } from "fs";
import * as nodefs from "fs";
import { isExternalLink, isHash, splitPath } from "../src/utils/url";
import { getDefaultVersion } from "./config-site";

type RouteHas =
  | {
      type: "header" | "query" | "cookie";
      key: string;
      value?: string;
    }
  | {
      type: "host";
      key?: undefined;
      value: string;
    };

type Redirect = {
  source: string;
  destination: string;
  basePath?: false;
  locale?: false;
  has?: RouteHas[];
  missing?: RouteHas[];
} & (
  | {
      statusCode?: never;
      permanent: boolean;
    }
  | {
      statusCode: number;
      permanent?: never;
    }
);

const latest = getDefaultVersion();

export interface Config {
  variables?: Record<string, unknown>;
  redirects?: Redirect[];
}

const getConfigPath = (version: string) =>
  join("content", version, "docs/config.json");

// load loads the docs configuration for the given version at the
// gravitational/docs clone in clonePath. fs can be reassigned from the "fs"
// standard library package for testing.
export const load = (version: string, clonePath: string, fs = nodefs) => {
  const path = join(clonePath, "content", version, "docs", "config.json");

  if (fs.existsSync(path)) {
    const content = fs.readFileSync(path, "utf-8");

    return JSON.parse(content) as Config;
  } else {
    throw Error(`File ${path} does not exist.`);
  }
};

/*
 * This a JSON schema describing content/X.X/docs/config.json file format, if actual config
 * have wrong fields or don't have something required, it will throw error then we try
 * to start dev or build mode.
 */

const ajv = new Ajv({ allowUnionTypes: true });

const validator = ajv.compile({
  type: "object",
  properties: {
    variables: {
      type: "object",
    },
    redirects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source: { type: "string" },
          destination: { type: "string" },
          boolean: { type: "boolean", nullable: true },
          basePath: { type: "boolean", nullable: true },
          statusCode: { type: "number", nullable: true },
          permanent: { type: "boolean", nullable: true },
          has: {
            type: "object",
            properties: {
              type: { type: "string" },
              key: { type: "string", nullable: true },
              value: { type: "string", nullable: true },
            },
            nullable: true,
            additionalProperties: false,
          },
        },
        required: ["source", "destination"],
        additionalProperties: false,
      },
    },
  },
  required: [],
  additionalProperties: false,
});

/*
 * We store relative paths in the config so we don't need to change them all
 * when we add new version, but for next/link and next/router to work they should be absolte.
 * So we are adding "/docs/ver/X.X/" or just "/docs/" for the current version here.
 *
 * Also we check that all links ends with "/: for consistency.
 */

/*
 * normalizeDocsUrl ensures that internal docs URLs include trailing slashes and
 * adds the docs version to the URL.*
 */
export const normalizeDocsUrl = (version: string, url: string) => {
  if (isExternalLink(url) || isHash(url)) {
    return url;
  }

  const path = splitPath(url).path;
  const configPath = getConfigPath(version);

  if (!path.endsWith("/")) {
    throw Error(`File ${configPath} misses trailing slash in '${url}' path.`);
  }

  const addVersion = latest !== version;
  const prefix = `${addVersion ? `/ver/${version}` : ""}`;

  return prefix + url;
};

const normalizeRedirects = (
  version: string,
  redirects: Redirect[],
): Redirect[] => {
  return redirects.map((redirect) => {
    return {
      ...redirect,
      // Don't check for the existence of an MDX file for the redirect source
      source: normalizeDocsUrl(version, redirect.source),
      destination: normalizeDocsUrl(version, redirect.destination),
    };
  });
};

/*
 * Apply config normalizations (update urls, etc).
 */

export const normalize = (config: Config, version: string): Config => {
  if (config.redirects) {
    config.redirects = normalizeRedirects(version, config.redirects);
  }

  if (!config.variables) {
    config.variables = {};
  }

  return config;
};

// loadConfig loads, validates, and normalizes the docs configuration for the
// given version at the gravitational/docs clone in clonePath. fs can be
// reassigned from the "fs" standard library package for testing.
export const loadConfig = (version: string, clonePath: string, fs = nodefs) => {
  const config = load(version, clonePath, fs);

  validateConfig<Config>(validator, config);

  return normalize(config, version);
};
