import React, { type ReactNode } from "react";
import clsx from "clsx";
import Translate from "@docusaurus/Translate";
import type { Props } from "@theme/NotFound/Content";
import Heading from "@theme/Heading";
import { useLocation } from "@docusaurus/router";
import { getReportIssueURL } from "/src/utils/github-issue";
import { useDocById } from "@docusaurus/plugin-content-docs/client";
import useGlobalData from "@docusaurus/useGlobalData";
import {
  possibleMovedPages,
  nearestAvailableCategoryIndex,
} from "/src/utils/suggestions";
import Search from "/src/components/Search";

export default function NotFoundContent({ className }: Props): ReactNode {
  const { pathname } = useLocation();

  const data = useGlobalData();
  if (
    !data.hasOwnProperty("docusaurus-plugin-content-docs") &&
    !data["docusaurus-plugin-content-docs"].hasOwnProperty("default") &&
    !data["docusaurus-plugin-content-docs"].default.hasOwnProperty("versions")
  ) {
    throw new Error(
      "plugin-content-docs is not configured - enable it in docusaurus.config.ts",
    );
  }

  const { versions } = data["docusaurus-plugin-content-docs"].default;

  const altPages = possibleMovedPages(pathname, versions) || [];
  const nearestIndex = nearestAvailableCategoryIndex(pathname, versions);
  if (nearestIndex != undefined) {
    altPages.push(nearestIndex);
  }

  const altLinks = altPages.map((p) => {
    const { title } = useDocById(p.id);
    return (
      <li key={p.path}>
        <a href={p.path}>{title}</a>
      </li>
    );
  });

  return (
    <main className={clsx("container margin-vert--xl", className)}>
      <div className="row">
        <div className="col col--6 col--offset-3">
          <Heading as="h1" className="hero__title">
            <Translate
              id="theme.NotFound.title"
              description="The title of the 404 page"
            >
              Page Not Found
            </Translate>
          </Heading>
          <p>
            The page you are looking for does not exist on the Teleport docs
            site.
          </p>
          {altLinks.length > 0 && (
            <>
              <p>
                {
                  "You may find what you are looking for in the following locations:"
                }
              </p>
              <ul>{altLinks}</ul>
            </>
          )}
          <p>{"Search the docs:"}</p>
          <p><Search /></p>
          <p>
            {"If the URL path is correct, you can "}
            <a href={getReportIssueURL(pathname)} target={"_blank"}>
              {"report an issue on GitHub"}
            </a>
            {"."}
          </p>
          <p>
            <a href="/">Go back to the docs home page.</a>
          </p>
        </div>
      </div>
    </main>
  );
}
