import React from "react";
import clsx from "clsx";
import Translate from "@docusaurus/Translate";
import type { Props } from "@theme/NotFound/Content";
import Heading from "@theme/Heading";
import React from "react";

export default function NotFoundContent({ className }: Props): JSX.Element {
  return (
    <main className={clsx("container margin-vert--xl", className)}>
      <div className="row">
        <div className="col col--6 col--offset-3">
          <Heading as="h1" className="hero__title">
            <Translate
              id="theme.NotFound.title"
              description="The title of the 404 page"
            >
              Sorry, Page Not Found
            </Translate>
          </Heading>
          <p>
            <Translate
              id="theme.NotFound.p1"
              description="The first paragraph of the 404 page"
            >
              We could not find what you were looking for.
            </Translate>
          </p>
          <p>
            Go back to documentation <a href="/">home</a>?
          </p>
          <h2>Other pages you may find useful</h2>
          <ul>
            <li>
              <a href="https://goteleport.com/">Home Page</a>
            </li>
            <li>
              <a href="https://goteleport.com/support/">Support Resources</a>
            </li>
            <li>
              <a href="https://github.com/gravitational/teleport">
                GitHub Repo
              </a>
            </li>
          </ul>
          <ul>
            <li>
              <a href="/">Documentation Home</a>
            </li>
            <li>
              <a href="/get-started/">Get Started</a>
            </li>
            <li>
              <a href="/admin-guides/">Admin Guides</a>
            </li>
            <li>
              <a href="/connect-your-client/introduction/">User Guides</a>
            </li>
            <li>
              <a href="/enroll-resources/">Enrolling Resources</a>
            </li>
            <li>
              <a href="/reference/config/">Configuration Reference</a>
            </li>
            <li>
              <a href="/changelog/">Changelog</a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
