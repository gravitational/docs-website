import React from "react";
import { VarsProvider } from "/src/components/Variables";

// Root is the root of a Docusaurus site. Manually swizzled to add context
// providers. See:
// https://docusaurus.io/docs/swizzling#wrapper-your-site-with-root
export default function Root({ children }) {
  return <VarsProvider>{children}</VarsProvider>;
}
