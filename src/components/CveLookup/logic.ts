// Data logic for the CVE lookup. Pure functions: no React or DOM access, and
// each takes the data it needs as arguments, so they can be unit tested.
import type { CveReport, PullRequest, ScanData, TrustEntry } from "./types";

export type Tone = "ok" | "warn" | "bad" | "info";

export interface Verdict {
  tone: Tone;
  label: string;
  note: string;
  // True for Not Affected verdicts. Per-image release rows are suppressed:
  // "last affected vX" under Not Affected reads as a contradiction.
  falsePositive?: boolean;
}

export interface ImageStatus {
  // Image repository, e.g. public.ecr.aws/gravitational/tbot-distroless.
  image: string;
  // Major version, e.g. "v18".
  major: string;
  lastAffected: string;
  // First clean release after lastAffected, or null if none was scanned.
  firstClean: string | null;
}

export type ParsedQuery =
  | { kind: "empty" }
  | { kind: "ids"; ids: string[] }
  | { kind: "keyword"; keyword: string };

export interface ReportMatch {
  report: CveReport;
  // How the searched ID maps to the report, when it isn't the report's own ID.
  note: string | null;
}

export type LookupResult =
  | { kind: "reports"; matches: ReportMatch[] }
  | { kind: "trust"; trust: TrustEntry }
  | { kind: "none" };

export interface DescriptionLine {
  text: string;
  heading: boolean;
}

// Matches an ID anywhere in a string. Callers that need a fresh lastIndex
// must create their own copy; these are only used with String methods.
const ID_PATTERN =
  /(CVE-\d{4}-\d+|GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}|GO-\d{4}-\d+)/gi;
const ALIAS_IN_URL_PATTERN =
  /\b(?:GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}|GO-\d{4}-\d+)\b/gi;
const VERSION_SUFFIX = /:v?\d+\.\d+[.\d]*$/;

function unique<T>(v: T, i: number, a: T[]): boolean {
  return a.indexOf(v) === i;
}

// Only allows http(s) links from scan data; anything else (javascript:,
// data:) becomes a dead link.
export function safeUrl(u: unknown): string {
  try {
    const p = new URL(String(u));
    return p.protocol === "https:" || p.protocol === "http:" ? p.href : "#";
  } catch {
    return "#";
  }
}

// Normalizes a target to image:tag. govulncheck targets carry a :binary
// suffix.
export function normalizeTarget(t: string): string {
  const m = String(t).match(/^(.*?:v?\d+\.\d+[.\d]*)(?::.*)?$/);
  return m ? m[1] : t;
}

export function imageOf(t: string): string {
  return String(t).replace(VERSION_SUFFIX, "");
}

export function versionOf(t: string): string | null {
  const m = String(t).match(/:v?(\d+\.\d+[.\d]*)$/);
  return m ? m[1] : null;
}

export function majorOf(v: string): string | null {
  const m = String(v).match(/^(\d+)\./);
  return m ? "v" + m[1] : null;
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

// False-positive reasons are written takeaway-first, with scanner-internals
// evidence in later sentences, so only the first sentence is shown.
export function firstSentence(s: string): string {
  const m = s.trim().match(/^[\s\S]*?\.(?=\s|$)/);
  return m ? m[0] : s.trim();
}

// The advisory page for an ID in its native database: NVD for CVEs, GitHub
// for GHSAs, and the Go vulnerability database for GO IDs. Null for anything
// else, so it is shown unlinked rather than linked to a page that doesn't
// exist.
export function advisoryUrl(id: string): string | null {
  const s = String(id).trim();
  let m = s.match(/^CVE-(\d{4}-\d+)$/i);
  if (m) return `https://nvd.nist.gov/vuln/detail/CVE-${m[1]}`;
  m = s.match(/^GHSA-([a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4})$/i);
  if (m) return `https://github.com/advisories/GHSA-${m[1].toLowerCase()}`;
  m = s.match(/^GO-(\d{4}-\d+)$/i);
  if (m) return `https://pkg.go.dev/vuln/GO-${m[1]}`;
  return null;
}

export function descriptionOf(r: CveReport): string {
  return r.finding_details?.[0]?.description || r.summary || "";
}

// Long descriptions get a short form for a Show more toggle, cut at a
// sentence (or word) boundary, never mid-word. short is null when the text
// is short enough to show in full.
export function truncateDescription(text: string | undefined): {
  text: string;
  short: string | null;
} {
  const t = (text || "").trim();
  if (t.length <= 360) return { text: t, short: null };
  let cut = t.slice(0, 340);
  const sentEnd = cut.lastIndexOf(". ");
  if (sentEnd > 120) {
    cut = cut.slice(0, sentEnd + 1);
  } else {
    const sp = cut.lastIndexOf(" ");
    if (sp > 0) cut = cut.slice(0, sp);
  }
  return { text: t, short: cut };
}

// Advisory text as paragraphs of lines: blank lines separate paragraphs and
// markdown-style headings ("## Impact") are flagged for bold display.
export function formatDescription(text: string): DescriptionLine[][] {
  return text.split(/\r?\n(?:[ \t]*\r?\n)+/).map((para) =>
    para.split(/\r?\n/).map((ln) => {
      const h = ln.match(/^\s*#{1,6}\s+(.*)$/);
      return h ? { text: h[1], heading: true } : { text: ln, heading: false };
    }),
  );
}

// Per image repository and major version: last affected and first clean
// release over the scan window. Grouped by image so a clean tag of one image
// is never taken as the fix for another. Only images with an affected
// release are returned.
export function imageStatus(data: ScanData, r: CveReport): ImageStatus[] {
  const osChecked = data.os_pkg_checked_targets?.length
    ? data.os_pkg_checked_targets
    : null;
  // Go modules are scanned in every image; OS packages only in images whose
  // OS packages were checked.
  const checked =
    (r.package_type === "go-module"
      ? data.scanned_targets
      : osChecked || data.scanned_targets) || [];
  const affected = new Set((r.affected_targets || []).map(normalizeTarget));
  const groups: Record<
    string,
    { image: string; major: string; aff: string[]; clean: string[] }
  > = {};
  const add = (t: string, isAffected: boolean) => {
    const v = versionOf(t);
    const major = v && majorOf(v);
    if (!v || !major) return;
    const image = imageOf(t);
    const key = image + " " + major;
    const g = (groups[key] = groups[key] || {
      image,
      major,
      aff: [],
      clean: [],
    });
    (isAffected ? g.aff : g.clean).push(v);
  };
  checked.forEach((t) => add(t, affected.has(t)));
  // An affected image missing from the checked list is still affected.
  const checkedSet = new Set(checked);
  affected.forEach((t) => {
    if (!checkedSet.has(t)) add(t, true);
  });
  const out: ImageStatus[] = [];
  Object.keys(groups)
    .sort()
    .forEach((k) => {
      const g = groups[k];
      const lastAffected = g.aff.sort(compareVersions).slice(-1)[0];
      if (!lastAffected) return;
      const firstClean =
        g.clean
          .sort(compareVersions)
          .find((v) => compareVersions(v, lastAffected) > 0) || null;
      out.push({ image: g.image, major: g.major, lastAffected, firstClean });
    });
  return out;
}

// One customer-facing verdict per report.
export function verdict(data: ScanData, r: CveReport): Verdict {
  const fpReason =
    r.false_positive_reason ||
    (r.govulncheck_confirmed === false
      ? "Verified not reachable in Teleport binaries (govulncheck)"
      : null);
  if (fpReason) {
    return {
      tone: "ok",
      label: "Not Affected",
      note: firstSentence(fpReason),
      falsePositive: true,
    };
  }

  // Set when every supported branch reports is_fixed but at least one has no
  // first_fixed_tag, i.e. no published release is known to contain the fix
  // (or the module is simply absent from go.mod). That alone is not evidence
  // the images are clean, so defer to the image scan below.
  let fixedUnreleased = false;
  if (r.go_module_status?.length) {
    const branches = r.go_module_status.filter((b) =>
      /branch\/v\d+/.test(b.branch),
    );
    const fixedTags = branches
      .filter((b) => b.is_fixed && b.first_fixed_tag)
      .map((b) => b.first_fixed_tag as string)
      .filter(unique);
    const open = branches.filter((b) => !b.is_fixed);
    if (branches.length && !open.length) {
      if (branches.every((b) => b.first_fixed_tag)) {
        return {
          tone: "ok",
          label: "Fixed",
          note: "Fixed by Teleport " + fixedTags.join(", "),
        };
      }
      fixedUnreleased = true;
    } else {
      if (fixedTags.length) {
        return {
          tone: "warn",
          label: "Partially Fixed",
          note: `Fixed in ${fixedTags.join(", ")}; still open on other branches`,
        };
      }
      if (open.some((b) => b.fix_merged_unreleased)) {
        return {
          tone: "bad",
          label: "Affected",
          note: "A fix has been merged and is awaiting a Teleport release that ships it",
        };
      }
      return { tone: "bad", label: "Affected", note: "A fix is pending" };
    }
  }

  const images = imageStatus(data, r);
  if (images.length) {
    if (images.every((s) => s.firstClean)) {
      // Per major, the first release in which every affected image is
      // clean: the latest of the per-image first clean releases.
      const allClean: Record<string, string> = {};
      images.forEach((s) => {
        const fc = s.firstClean as string;
        if (!allClean[s.major] || compareVersions(fc, allClean[s.major]) > 0) {
          allClean[s.major] = fc;
        }
      });
      return {
        tone: "ok",
        label: "Fixed",
        note:
          "First clean release: " +
          Object.keys(allClean)
            .sort()
            .map((m) => allClean[m])
            .join(", "),
      };
    }
    if (r.debian_status?.status === "resolved") {
      return {
        tone: "warn",
        label: "Fix Available",
        note: "Patched upstream — awaiting the next Teleport image rebuild",
      };
    }
    return {
      tone: "bad",
      label: "Affected",
      note: "No fixed release available yet",
    };
  }
  if (fixedUnreleased) {
    return {
      tone: "warn",
      label: "Awaiting Release",
      note: "Fixed on all supported branches, but no Teleport release containing the fix is recorded yet",
    };
  }
  if (r.govulncheck_confirmed === true) {
    return {
      tone: "bad",
      label: "Affected",
      note: "Confirmed in Teleport binaries — no fixed release available yet",
    };
  }
  return {
    tone: "info",
    label: "Under Review",
    note: "Reported by scanners; assessment in progress",
  };
}

// Merged fix PRs and still-open PRs across branches, by PR number. Only the
// PR view of the data has these; the published report has none.
export function fixPrs(r: CveReport): (PullRequest & { merged: boolean })[] {
  const seen = new Map<number, PullRequest & { merged: boolean }>();
  (r.go_module_status || []).forEach((b) => {
    if (b.fixing_pr) {
      seen.set(b.fixing_pr.number, { ...b.fixing_pr, merged: true });
    }
    (b.open_prs || []).forEach((p) => {
      if (!seen.has(p.number)) seen.set(p.number, { ...p, merged: false });
    });
  });
  return Array.from(seen.values()).sort((a, b) => a.number - b.number);
}

// The published report has no PR links: fix provenance comes from the fixing
// commit recorded per branch instead.
export function fixCommits(r: CveReport): string[] {
  return (r.go_module_status || [])
    .map((b) => b.fixing_commit)
    .filter((c): c is string => Boolean(c))
    .filter(unique);
}

// Reports by uppercased primary ID. A CVE can have one report per affected
// package, so all are kept; showing only one could hide an affected package.
export function indexReports(data: ScanData): Record<string, CveReport[]> {
  const byId: Record<string, CveReport[]> = {};
  (data.cve_reports || []).forEach((r) => {
    const k = r.cve_id.toUpperCase();
    (byId[k] = byId[k] || []).push(r);
  });
  return byId;
}

// Alias (GO-/GHSA-/CVE-) → every primary ID (uppercased) it names. One
// vulnerability can have several reports under different primary IDs (e.g.
// GO-2026-6061 and GHSA-hrxh-6v49-42gf), so all are kept, whether the alias
// comes from govulncheck or a reference URL: an extra report is safer than a
// hidden affected one. govulncheck aliases are indexed first so their
// reports are listed first.
export function buildAliasIndex(data: ScanData): Record<string, string[]> {
  const idx: Record<string, string[]> = {};
  const add = (alias: string, cveId: string) => {
    const k = String(alias).toUpperCase();
    const v = cveId.toUpperCase();
    if (k === v) return;
    const list = (idx[k] = idx[k] || []);
    if (!list.includes(v)) list.push(v);
  };
  const reports = data.cve_reports || [];
  reports.forEach((r) => {
    (r.govulncheck_details || []).forEach((g) => {
      if (g.osv_id) add(g.osv_id, r.cve_id);
      (g.aliases || []).forEach((a) => add(a, r.cve_id));
    });
  });
  reports.forEach((r) => {
    (r.finding_details || []).forEach((f) => {
      (f.references || []).forEach((ref) => {
        (String(ref).match(ALIAS_IN_URL_PATTERN) || []).forEach((m) =>
          add(m, r.cve_id),
        );
      });
    });
  });
  return idx;
}

// Classifies a query. It is an ID list when it is nothing but IDs and
// separators. IDs are extracted by pattern rather than by splitting on
// delimiters: a single-line input strips the newlines out of a pasted
// multi-line list, so IDs can arrive concatenated with no separator.
export function parseQuery(q: string): ParsedQuery {
  const query = (q || "").trim();
  if (!query) return { kind: "empty" };
  const ids = (query.match(ID_PATTERN) || [])
    .map((s) => s.toUpperCase())
    .filter(unique);
  const leftover = query.replace(ID_PATTERN, " ").replace(/[\s,;]+/g, "");
  return ids.length && !leftover
    ? { kind: "ids", ids }
    : { kind: "keyword", keyword: query };
}

// What one uppercased ID resolves to: the reports filed under it plus under
// every ID it aliases, else a Trust Portal entry, else nothing.
export function lookupId(
  data: ScanData,
  byId: Record<string, CveReport[]>,
  aliases: Record<string, string[]>,
  id: string,
): LookupResult {
  const reports: CveReport[] = [];
  [id, ...(aliases[id] || [])].forEach((p) => {
    (byId[p] || []).forEach((r) => {
      if (!reports.includes(r)) reports.push(r);
    });
  });
  if (reports.length) {
    return {
      kind: "reports",
      matches: reports.map((report) => ({
        report,
        note:
          report.cve_id.toUpperCase() === id
            ? null
            : id +
              (byId[id] ? " is also tracked as " : " is tracked as ") +
              report.cve_id,
      })),
    };
  }
  const trust = data.trust_data?.[id];
  return trust ? { kind: "trust", trust } : { kind: "none" };
}

// Case-insensitive substring match across ID, package, and description.
export function keywordSearch(data: ScanData, keyword: string): CveReport[] {
  const needle = keyword.toLowerCase();
  return (data.cve_reports || []).filter((r) =>
    [
      r.cve_id,
      r.package_name,
      r.finding_details?.[0]?.description || "",
      r.summary || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}

// "Scan data from 14 Oct 2026, 07:57 UTC". Formatted in UTC explicitly so
// the label matches regardless of the viewer's time zone.
export function formatScanTime(timestamp: string | undefined): string {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return (
    "Scan data from " +
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }) +
    ", " +
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) +
    " UTC"
  );
}

// Query from a deep link: <page>#cve=CVE-XXXX
export function deepLinkQuery(hash: string | undefined): string | null {
  const m = (hash || "").match(/#cve=([A-Za-z0-9.-]+)/i);
  return m ? decodeURIComponent(m[1]) : null;
}
