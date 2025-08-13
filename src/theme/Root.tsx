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
              width: 100%;
              max-width: 100%;
              }

              html.fullWidthPage main > .container {
              max-width: 100%;
              width: 100%;
              padding-top: 0px !important;
              }

              html.fullWidthPage main > .container > .theme-doc-markdown > :not(section) {
              max-width: 1400px;∏
              margin-left: auto;
              margin-right: auto;
              }

              html.fullWidthPage aside {
              display: none !important;
              }
              
              html.fullWidthPage #docs-navigation {
              display: block;
              }
            `
          }
        </style>
      </Head>
      <VarsProvider>{children}</VarsProvider>
    </>
  );
}
