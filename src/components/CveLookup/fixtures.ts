// Synthetic scan data for unit tests and stories. IDs use the 2099 year so
// they can't be mistaken for real advisories.
import type { ScanData } from "./types";

const ent = "public.ecr.aws/gravitational/teleport-ent-distroless";
const tbot = "public.ecr.aws/gravitational/tbot-distroless";
const handler = "public.ecr.aws/gravitational/teleport-plugin-event-handler";
const tags = ["17.1.0", "17.1.1", "18.1.0", "18.1.1", "18.2.0"];
const targets = (image: string) => tags.map((t) => `${image}:${t}`);

export const scanData: ScanData = {
  timestamp: "2099-03-04T07:57:05.020827Z",
  teleport_repo: "gravitational/teleport",
  scanned_targets: [...targets(ent), ...targets(tbot), ...targets(handler)],
  // The event handler image has no OS packages to check.
  os_pkg_checked_targets: [...targets(ent), ...targets(tbot)],
  trust_data: {
    "CVE-2099-0100": {
      title: "Host kernel advisory",
      description: "Teleport's guidance on the kernel advisory.",
      url: "https://trust.goteleport.com/updates/cve-2099-0100",
    },
  },
  cve_reports: [
    {
      // Fixed in a release on every supported branch.
      cve_id: "CVE-2099-0001",
      package_name: "golang.org/x/net",
      package_type: "go-module",
      govulncheck_confirmed: true,
      affected_targets: [`${ent}:17.1.0:teleport`, `${ent}:18.1.0:teleport`],
      govulncheck_details: [
        {
          osv_id: "GO-2099-0001",
          aliases: ["CVE-2099-0001", "GHSA-aaaa-aaaa-aaaa"],
        },
      ],
      finding_details: [
        { description: "Excessive memory use in the HTTP/2 server." },
      ],
      go_module_status: [
        { branch: "master", is_fixed: true, first_fixed_tag: "v18.1.1" },
        {
          branch: "branch/v18",
          is_fixed: true,
          first_fixed_tag: "v18.1.1",
          fixing_commit: "1111111aaaaaaa",
        },
        {
          branch: "branch/v17",
          is_fixed: true,
          first_fixed_tag: "v17.1.1",
          fixing_commit: "2222222bbbbbbb",
        },
      ],
    },
    {
      // One CVE, two OS packages: both reports must be shown.
      cve_id: "CVE-2099-0002",
      package_name: "libssl3",
      package_type: "debian",
      affected_targets: [`${ent}:18.1.0`, `${ent}:18.1.1`],
      finding_details: [{ description: "OpenSSL issue." }],
    },
    {
      cve_id: "CVE-2099-0002",
      package_name: "openssl",
      package_type: "debian",
      affected_targets: [`${ent}:18.1.0`],
      debian_status: { status: "resolved" },
      finding_details: [{ description: "OpenSSL issue." }],
    },
    {
      // Not reachable according to govulncheck.
      cve_id: "CVE-2099-0003",
      package_name: "github.com/example/unused",
      package_type: "go-module",
      govulncheck_confirmed: false,
      affected_targets: [`${handler}:18.1.0`],
    },
    {
      // Same vulnerability as CVE-2099-0005, filed under its GHSA ID.
      cve_id: "GHSA-bbbb-bbbb-bbbb",
      package_name: "google.golang.org/grpc",
      package_type: "go-module",
      false_positive_reason:
        "The vulnerable handler is not registered. Scanner evidence follows.",
      govulncheck_details: [
        {
          osv_id: "GO-2099-0005",
          aliases: ["GO-2099-0005", "GHSA-bbbb-bbbb-bbbb"],
        },
      ],
    },
    {
      cve_id: "GO-2099-0005",
      package_name: "google.golang.org/grpc",
      package_type: "go-module",
      govulncheck_confirmed: true,
      affected_targets: [`${tbot}:18.1.0:tbot`],
      govulncheck_details: [
        {
          osv_id: "GO-2099-0005",
          aliases: ["GO-2099-0005", "GHSA-bbbb-bbbb-bbbb"],
        },
      ],
      go_module_status: [
        { branch: "branch/v18", is_fixed: true, first_fixed_tag: "v18.1.1" },
      ],
    },
    {
      // Fixed on branches but not in any release yet.
      cve_id: "CVE-2099-0006",
      package_name: "github.com/example/pending",
      package_type: "go-module",
      go_module_status: [
        { branch: "branch/v18", is_fixed: true, first_fixed_tag: null },
      ],
    },
    {
      // Still open, with a merged fix awaiting release.
      cve_id: "CVE-2099-0007",
      package_name: "github.com/example/open",
      package_type: "go-module",
      go_module_status: [
        { branch: "branch/v18", is_fixed: false, fix_merged_unreleased: true },
      ],
    },
  ],
};
