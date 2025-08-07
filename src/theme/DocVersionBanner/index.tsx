import React, { type ComponentType } from "react";
import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Translate from "@docusaurus/Translate";
import {
  useActivePlugin,
  useDocVersionSuggestions,
  type GlobalVersion,
} from "@docusaurus/plugin-content-docs/client";
import { ThemeClassNames } from "@docusaurus/theme-common";
import { useDocsPreferredVersion } from "@docusaurus/theme-common/internal";
import { useDocsVersion } from "@docusaurus/plugin-content-docs/client";
import type { Props } from "@theme/DocVersionBanner";
import type {
  VersionBanner,
  PropVersionMetadata,
} from "@docusaurus/plugin-content-docs";

type BannerLabelComponentProps = {
  siteTitle: string;
  versionMetadata: PropVersionMetadata;
};

const unreleasedMessage =
  "This documentation is for an unreleased version of Teleport.";
const selfHostedMessage =
  "This documentation is for a version of Teleport that is only available for self-hosted clusters.";

function UnreleasedVersionLabel({
  siteTitle,
  versionMetadata,
}: BannerLabelComponentProps) {
  const { versions, lastVersion } =
    useDocusaurusContext().siteConfig.plugins.find((p) => {
      return p[0] == "@docusaurus/plugin-content-docs";
    })[1];
  const verToOrder = new Map();
  const vers = Object.keys(versions);
  for (let i = 0; i < vers.length; i++) {
    verToOrder.set(vers[i], i);
  }

  const { version } = useDocsVersion();
  let message: string;
  const thisIdx = verToOrder.get(version);
  // Set a version banner. Indicate if the version is the edge version or
  // only available for self-hosted users. The latter situation happens when
  // the latest release is not yet the latest version in the docs.
  if (
    verToOrder.get(lastVersion) < thisIdx &&
    verToOrder.get("current") > thisIdx
  ) {
    message = selfHostedMessage;
  } else {
    message = unreleasedMessage;
  }

  return (
    <Translate
      id="theme.docs.versions.unreleasedVersionLabel"
      description="Indicates that the user is browsing an unreleased docs version"
      values={{
        siteTitle,
        versionLabel: <b>{versionMetadata.label}</b>,
      }}
    >
      {message}
    </Translate>
  );
}

function UnmaintainedVersionLabel({
  siteTitle,
  versionMetadata,
}: BannerLabelComponentProps) {
  return (
    <Translate
      id="theme.docs.versions.unmaintainedVersionLabel"
      description="Indicates that the user is browsing a previous (but still maintained)  docs version"
      values={{
        siteTitle,
        versionLabel: <b>{versionMetadata.label}</b>,
      }}
    >
      {
        "This is documentation for {siteTitle} {versionLabel}, a previous version of Teleport."
      }
    </Translate>
  );
}

const BannerLabelComponents: {
  [banner in VersionBanner]: ComponentType<BannerLabelComponentProps>;
} = {
  unreleased: UnreleasedVersionLabel,
  unmaintained: UnmaintainedVersionLabel,
};

function BannerLabel(props: BannerLabelComponentProps) {
  const BannerLabelComponent =
    BannerLabelComponents[props.versionMetadata.banner!];
  return <BannerLabelComponent {...props} />;
}

function DocVersionBannerEnabled({
  className,
  versionMetadata,
}: Props & {
  versionMetadata: PropVersionMetadata;
}): JSX.Element {
  const {
    siteConfig: { title: siteTitle },
  } = useDocusaurusContext();
  const { pluginId } = useActivePlugin({ failfast: true })!;

  const getVersionMainDoc = (version: GlobalVersion) =>
    version.docs.find((doc) => doc.id === version.mainDocId)!;

  const { savePreferredVersionName } = useDocsPreferredVersion(pluginId);

  const { latestDocSuggestion, latestVersionSuggestion } =
    useDocVersionSuggestions(pluginId);

  // Try to link to same doc in latest version (not always possible), falling
  // back to main doc of latest version
  const latestVersionSuggestedDoc =
    latestDocSuggestion ?? getVersionMainDoc(latestVersionSuggestion);

  return (
    <div
      className={clsx(
        className,
        ThemeClassNames.docs.docVersionBanner,
        "alert alert--warning margin-bottom--md",
      )}
      role="alert"
    >
      <div>
        <BannerLabel siteTitle={siteTitle} versionMetadata={versionMetadata} />
      </div>
    </div>
  );
}

export default function DocVersionBanner({
  className,
}: Props): JSX.Element | null {
  const versionMetadata = useDocsVersion();
  if (versionMetadata.banner) {
    return (
      <DocVersionBannerEnabled
        className={className}
        versionMetadata={versionMetadata}
      />
    );
  }
  return null;
}
