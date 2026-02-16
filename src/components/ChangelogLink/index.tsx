import {
  useActiveDocContext,
} from "@docusaurus/plugin-content-docs/client";
import Link from "@docusaurus/Link";
import useGlobalData from "@docusaurus/useGlobalData";

export const ChangelogLink = () => {
  const { activeVersion, alternateDocVersions } = useActiveDocContext();
  const isCurrent = activeVersion.name == "current";

  return (
    <>
      {isCurrent || (
        <p>
          This changelog includes release notes for version{" "}
          {activeVersion.label}. For all release notes, visit the{" "}
          <Link href={alternateDocVersions.current.path}>edge version</Link> of
          the changelog.
        </p>
      )}
    </>
  );
};
