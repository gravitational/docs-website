import React from "react";
import { VarsProvider } from "/src/components/Variables";
import Head from "@docusaurus/Head";

// Root is the root of a Docusaurus site. Manually swizzled to add context
// providers. See:
// https://docusaurus.io/docs/swizzling#wrapper-your-site-with-root
export default function Root({ children }) {
  return (
    <>
      <Head>
        <style>
          {
            `
              html.fullWidthPage main {
              width: 100% !important;
              max-width: 100% !important;
              }

              html.fullWidthPage main > .container {
              max-width: 100% !important;
              width: 100% !important;
              padding-top: 0px !important;
              }

              html.fullWidthPage main > .container > .theme-doc-markdown > :not(section) {
              max-width: 1400px !important;
              margin-left: auto !important;
              margin-right: auto !important;
              }

              html.fullWidthPage aside {
              display: none !important;
              }
              
              html.fullWidthPage #docs-navigation {
              display: block !important;
              }
            `
          }
        </style>
      </Head>
      <VarsProvider>{children}</VarsProvider>
    </>
  );
}
