// Shape of the scan report published by gravitational/cve-tracker
// (latest.json). Only the fields the lookup reads are listed.

export interface ScanData {
  timestamp?: string;
  teleport_repo?: string;
  // Every image:tag the scan covered.
  scanned_targets?: string[];
  // Targets whose OS packages were checked. A subset of scanned_targets:
  // some images (e.g. the event handler) have no OS packages to check.
  os_pkg_checked_targets?: string[];
  cve_reports?: CveReport[];
  // Teleport Trust Portal updates, keyed by uppercased CVE ID.
  trust_data?: Record<string, TrustEntry>;
}

export interface CveReport {
  // Primary ID: usually a CVE, but a GHSA or GO ID when no CVE exists.
  cve_id: string;
  package_name?: string;
  package_type?: "go-module" | "debian" | string;
  summary?: string;
  // image:tag targets the finding was reported in. govulncheck targets carry
  // an extra :binary suffix.
  affected_targets?: string[];
  false_positive_reason?: string | null;
  govulncheck_confirmed?: boolean | null;
  govulncheck_details?: GovulncheckDetail[];
  finding_details?: FindingDetail[];
  go_module_status?: BranchStatus[];
  debian_status?: { status?: string } | null;
}

export interface GovulncheckDetail {
  osv_id?: string;
  aliases?: string[] | null;
}

export interface FindingDetail {
  description?: string;
  references?: string[];
}

export interface BranchStatus {
  branch: string;
  is_fixed?: boolean;
  first_fixed_tag?: string | null;
  fix_merged_unreleased?: boolean;
  fixing_commit?: string | null;
  // Only present in the PR view of the data, not the published report.
  fixing_pr?: PullRequest | null;
  open_prs?: PullRequest[] | null;
}

export interface PullRequest {
  number: number;
  url?: string;
}

export interface TrustEntry {
  title?: string;
  description?: string;
  url?: string;
  date?: string;
}
