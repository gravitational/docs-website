// Dev-only redirect component used by devtools/docusaurus.dev.config.ts.
//
// When the trimmed dev build remaps the edge version to the site root, that
// version's production path (/ver/NN.x/...) has no native routes. This
// component is mounted as a catch-all at that old prefix and client-redirects
// to the equivalent root path, so version-switcher links, old bookmarks, and
// hardcoded /ver/NN.x/... links keep resolving instead of hitting Not Found.
//
// Plain ESM + React.createElement (no JSX / TS) so webpack needs no extra
// loader config to build a file living outside src/.

import React from "react";
import { Redirect, useLocation } from "@docusaurus/router";

export default function DevVerRedirect() {
  const { pathname, search, hash } = useLocation();
  // Strip a leading /ver/<name> segment; fall back to "/" for the bare prefix.
  const target = (pathname.replace(/^\/ver\/[^/]+/, "") || "/") + search + hash;
  return React.createElement(Redirect, { to: target });
}
