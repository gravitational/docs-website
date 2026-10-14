import { describe, expect, test } from "@jest/globals";
import {
  buildAliasIndex,
  compareVersions,
  deepLinkQuery,
  firstSentence,
  fixCommits,
  fixPrs,
  formatDescription,
  formatScanTime,
  imageStatus,
  indexReports,
  keywordSearch,
  lookupId,
  normalizeTarget,
  parseQuery,
  safeUrl,
  truncateDescription,
  verdict,
} from "./logic";
import { scanData } from "./fixtures";
import type { CveReport, ScanData } from "./types";

const report = (id: string, pkg?: string): CveReport => {
  const r = scanData.cve_reports!.find(
    (x) => x.cve_id === id && (!pkg || x.package_name === pkg),
  );
  if (!r) throw new Error(`no fixture report ${id} ${pkg ?? ""}`);
  return r;
};

describe("parseQuery", () => {
  interface testCase {
    description: string;
    input: string;
    expected: ReturnType<typeof parseQuery>;
  }

  const testCases: Array<testCase> = [
    { description: "empty", input: "   ", expected: { kind: "empty" } },
    {
      description: "single ID, uppercased",
      input: "cve-2099-0001",
      expected: { kind: "ids", ids: ["CVE-2099-0001"] },
    },
    {
      description: "comma-separated list, deduplicated",
      input: "CVE-2099-0001, GO-2099-0005; cve-2099-0001",
      expected: { kind: "ids", ids: ["CVE-2099-0001", "GO-2099-0005"] },
    },
    {
      description: "IDs concatenated by a pasted multi-line list",
      input: "CVE-2099-0001GHSA-aaaa-aaaa-aaaa",
      expected: { kind: "ids", ids: ["CVE-2099-0001", "GHSA-AAAA-AAAA-AAAA"] },
    },
    {
      description: "keyword",
      input: "openssl",
      expected: { kind: "keyword", keyword: "openssl" },
    },
    {
      description: "ID mixed with other words is a keyword search",
      input: "CVE-2099-0001 grpc",
      expected: { kind: "keyword", keyword: "CVE-2099-0001 grpc" },
    },
  ];

  test.each(testCases)("$description", (c) => {
    expect(parseQuery(c.input)).toEqual(c.expected);
  });
});

describe("verdict", () => {
  interface testCase {
    description: string;
    report: CveReport;
    data?: ScanData;
    label: string;
    note: string;
  }

  const ent = "public.ecr.aws/gravitational/teleport-ent-distroless";
  const testCases: Array<testCase> = [
    {
      description: "released fix on every supported branch",
      report: report("CVE-2099-0001"),
      label: "Fixed",
      note: "Fixed by Teleport v18.1.1, v17.1.1",
    },
    {
      description: "govulncheck says the code is not reachable",
      report: report("CVE-2099-0003"),
      label: "Not Affected",
      note: "Verified not reachable in Teleport binaries (govulncheck)",
    },
    {
      description: "false-positive reason is cut to its first sentence",
      report: report("GHSA-bbbb-bbbb-bbbb"),
      label: "Not Affected",
      note: "The vulnerable handler is not registered.",
    },
    {
      description: "fixed on branches with no release defers to images",
      report: report("CVE-2099-0006"),
      label: "Awaiting Release",
      note: "Fixed on all supported branches, but no Teleport release containing the fix is recorded yet",
    },
    {
      description: "open branch with a merged, unreleased fix",
      report: report("CVE-2099-0007"),
      label: "Affected",
      note: "A fix has been merged and is awaiting a Teleport release that ships it",
    },
    {
      description: "fixed in one release, open elsewhere",
      report: {
        cve_id: "CVE-2099-0010",
        go_module_status: [
          { branch: "branch/v18", is_fixed: true, first_fixed_tag: "v18.1.1" },
          { branch: "branch/v17", is_fixed: false },
        ],
      },
      label: "Partially Fixed",
      note: "Fixed in v18.1.1; still open on other branches",
    },
    {
      description: "clean image release after the last affected one",
      report: report("CVE-2099-0002", "libssl3"),
      label: "Fixed",
      note: "First clean release: 18.2.0",
    },
    {
      description: "untagged branch fix with affected images still open",
      report: {
        cve_id: "CVE-2099-0011",
        package_type: "debian",
        affected_targets: [`${ent}:18.2.0`],
        go_module_status: [
          { branch: "branch/v18", is_fixed: true, first_fixed_tag: null },
        ],
      },
      label: "Affected",
      note: "No fixed release available yet",
    },
    {
      description: "patched upstream but no clean image yet",
      report: {
        cve_id: "CVE-2099-0012",
        package_type: "debian",
        affected_targets: [`${ent}:18.2.0`],
        debian_status: { status: "resolved" },
      },
      label: "Fix Available",
      note: "Patched upstream — awaiting the next Teleport image rebuild",
    },
    {
      description: "govulncheck confirmed with no image data",
      report: { cve_id: "CVE-2099-0013", govulncheck_confirmed: true },
      label: "Affected",
      note: "Confirmed in Teleport binaries — no fixed release available yet",
    },
    {
      description: "nothing conclusive",
      report: { cve_id: "CVE-2099-0014" },
      label: "Under Review",
      note: "Reported by scanners; assessment in progress",
    },
  ];

  test.each(testCases)("$description", (c) => {
    const v = verdict(c.data ?? scanData, c.report);
    expect(v.label).toEqual(c.label);
    expect(v.note).toEqual(c.note);
  });
});

describe("imageStatus", () => {
  const a = "public.ecr.aws/gravitational/image-a";
  const b = "public.ecr.aws/gravitational/image-b";

  test("a clean tag of one image is not the fix for another", () => {
    const data: ScanData = {
      scanned_targets: [
        `${a}:18.1.0`,
        `${a}:18.2.0`,
        `${b}:18.2.0`,
        `${b}:18.3.0`,
      ],
    };
    const r: CveReport = {
      cve_id: "CVE-2099-0020",
      package_type: "debian",
      affected_targets: [`${a}:18.1.0`, `${a}:18.2.0`, `${b}:18.2.0`],
    };
    expect(imageStatus(data, r)).toEqual([
      { image: a, major: "v18", lastAffected: "18.2.0", firstClean: null },
      { image: b, major: "v18", lastAffected: "18.2.0", firstClean: "18.3.0" },
    ]);
    expect(verdict(data, r).label).toEqual("Affected");
  });

  test("Go modules are checked against every scanned image", () => {
    expect(imageStatus(scanData, report("CVE-2099-0003"))).toEqual([
      {
        image: "public.ecr.aws/gravitational/teleport-plugin-event-handler",
        major: "v18",
        lastAffected: "18.1.0",
        firstClean: "18.1.1",
      },
    ]);
  });

  test("an affected image outside the OS-checked list stays affected", () => {
    const handler =
      "public.ecr.aws/gravitational/teleport-plugin-event-handler";
    const r: CveReport = {
      cve_id: "CVE-2099-0021",
      package_type: "debian",
      affected_targets: [`${handler}:18.1.0`],
    };
    expect(imageStatus(scanData, r)).toEqual([
      {
        image: handler,
        major: "v18",
        lastAffected: "18.1.0",
        firstClean: null,
      },
    ]);
  });
});

describe("lookupId", () => {
  const byId = indexReports(scanData);
  const aliases = buildAliasIndex(scanData);
  const summarize = (id: string) => {
    const res = lookupId(scanData, byId, aliases, id);
    if (res.kind !== "reports") return res.kind;
    return res.matches.map((m) => [
      m.report.cve_id,
      m.report.package_name,
      m.note,
    ]);
  };

  test("returns every package report for a CVE", () => {
    expect(summarize("CVE-2099-0002")).toEqual([
      ["CVE-2099-0002", "libssl3", null],
      ["CVE-2099-0002", "openssl", null],
    ]);
  });

  test("resolves an alias to its primary ID", () => {
    expect(summarize("GHSA-AAAA-AAAA-AAAA")).toEqual([
      [
        "CVE-2099-0001",
        "golang.org/x/net",
        "GHSA-AAAA-AAAA-AAAA is tracked as CVE-2099-0001",
      ],
    ]);
  });

  test("shows reports filed under the ID and under its aliases", () => {
    expect(summarize("GO-2099-0005")).toEqual([
      ["GO-2099-0005", "google.golang.org/grpc", null],
      [
        "GHSA-bbbb-bbbb-bbbb",
        "google.golang.org/grpc",
        "GO-2099-0005 is also tracked as GHSA-bbbb-bbbb-bbbb",
      ],
    ]);
  });

  test("falls back to the Trust Portal, then to nothing", () => {
    expect(summarize("CVE-2099-0100")).toEqual("trust");
    expect(summarize("CVE-2099-9999")).toEqual("none");
  });
});

describe("buildAliasIndex", () => {
  test("keeps every primary ID for an alias shared across sources", () => {
    const data: ScanData = {
      cve_reports: [
        {
          cve_id: "CVE-2099-0030",
          govulncheck_details: [
            { osv_id: "GO-2099-0030", aliases: ["GHSA-cccc-cccc-cccc"] },
          ],
        },
        {
          cve_id: "CVE-2099-0031",
          finding_details: [
            {
              references: ["https://github.com/advisories/GHSA-cccc-cccc-cccc"],
            },
          ],
        },
      ],
    };
    expect(buildAliasIndex(data)["GHSA-CCCC-CCCC-CCCC"]).toEqual([
      "CVE-2099-0030",
      "CVE-2099-0031",
    ]);
  });
});

describe("keywordSearch", () => {
  test("matches package names and descriptions case-insensitively", () => {
    expect(keywordSearch(scanData, "GRPC").map((r) => r.cve_id)).toEqual([
      "GHSA-bbbb-bbbb-bbbb",
      "GO-2099-0005",
    ]);
    expect(keywordSearch(scanData, "http/2").map((r) => r.cve_id)).toEqual([
      "CVE-2099-0001",
    ]);
  });
});

describe("fix provenance", () => {
  test("lists unique fixing commits", () => {
    expect(fixCommits(report("CVE-2099-0001"))).toEqual([
      "1111111aaaaaaa",
      "2222222bbbbbbb",
    ]);
  });

  test("lists merged and open PRs once each, by number", () => {
    const r: CveReport = {
      cve_id: "CVE-2099-0040",
      go_module_status: [
        {
          branch: "branch/v18",
          fixing_pr: { number: 9 },
          open_prs: [{ number: 3 }],
        },
        { branch: "branch/v17", open_prs: [{ number: 9 }, { number: 3 }] },
      ],
    };
    expect(fixPrs(r)).toEqual([
      { number: 3, merged: false },
      { number: 9, merged: true },
    ]);
  });
});

describe("descriptions", () => {
  test("short text is shown in full", () => {
    expect(truncateDescription("  Short.  ")).toEqual({
      text: "Short.",
      short: null,
    });
  });

  test("long text is cut at a sentence boundary", () => {
    const text = "A".repeat(200) + ". " + "B".repeat(300);
    expect(truncateDescription(text).short).toEqual("A".repeat(200) + ".");
  });

  test("long text without a usable sentence break is cut at a word", () => {
    const text = "word ".repeat(100);
    const short = truncateDescription(text).short!;
    expect(short.length).toBeLessThanOrEqual(340);
    expect(short.endsWith("word")).toBe(true);
  });

  test("splits paragraphs and flags markdown headings", () => {
    expect(formatDescription("## Impact\nLine one\nLine two\n\nNext")).toEqual([
      [
        { text: "Impact", heading: true },
        { text: "Line one", heading: false },
        { text: "Line two", heading: false },
      ],
      [{ text: "Next", heading: false }],
    ]);
  });
});

describe("helpers", () => {
  test("safeUrl only allows http(s)", () => {
    expect(safeUrl("https://example.com/a")).toEqual("https://example.com/a");
    expect(safeUrl("javascript:alert(1)")).toEqual("#");
    expect(safeUrl("not a url")).toEqual("#");
  });

  test("normalizeTarget strips the govulncheck binary suffix", () => {
    expect(normalizeTarget("repo/img:18.1.0:tbot")).toEqual("repo/img:18.1.0");
    expect(normalizeTarget("repo/img:18.1.0")).toEqual("repo/img:18.1.0");
  });

  test("compareVersions orders numerically", () => {
    expect(compareVersions("18.10.0", "18.9.9")).toBeGreaterThan(0);
    expect(compareVersions("18.1", "18.1.0")).toEqual(0);
  });

  test("firstSentence", () => {
    expect(firstSentence("One. Two.")).toEqual("One.");
    expect(firstSentence("No period")).toEqual("No period");
  });

  test("formatScanTime is in UTC", () => {
    expect(formatScanTime(scanData.timestamp)).toEqual(
      "Scan data from 4 Mar 2099, 07:57 UTC",
    );
    expect(formatScanTime(undefined)).toEqual("");
  });

  test("deepLinkQuery reads #cve=", () => {
    expect(deepLinkQuery("#cve=CVE-2099-0001")).toEqual("CVE-2099-0001");
    expect(deepLinkQuery("#other")).toBeNull();
  });
});
