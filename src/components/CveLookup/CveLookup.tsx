import cn from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CveLookup.module.css";
import {
  advisoryUrl,
  buildAliasIndex,
  deepLinkQuery,
  descriptionOf,
  fixCommits,
  fixPrs,
  formatDescription,
  formatScanTime,
  imageStatus,
  indexReports,
  keywordSearch,
  lookupId,
  parseQuery,
  safeUrl,
  truncateDescription,
  verdict,
} from "./logic";
import type { CveReport, ScanData, TrustEntry } from "./types";

const TRUST_PORTAL_URL = "https://trust.goteleport.com";
const SUPPORT_URL = "mailto:support@goteleport.com";
const MAX_KEYWORD_RESULTS = 25;
// Give up on a stalled request rather than leaving searches pending.
const FETCH_TIMEOUT_MS = 20000;

export type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: ScanData }
  | { status: "failed" };

interface Index {
  byId: Record<string, CveReport[]>;
  aliases: Record<string, string[]>;
}

const ExternalLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a href={href} target="_blank" rel="noopener">
    {children}
  </a>
);

const TrustPortalLink = () => (
  <ExternalLink href={TRUST_PORTAL_URL}>Trust Portal</ExternalLink>
);

const SupportLink = () => <a href={SUPPORT_URL}>Teleport Support</a>;

const Row: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className={styles.row}>
    <span className={styles.rowLabel}>{label}</span>
    <span className={styles.rowValue}>{children}</span>
  </div>
);

const TrustNote: React.FC<{ trust: TrustEntry }> = ({ trust }) => (
  <div className={styles.trustNote}>
    🔒 <strong>Teleport Trust Portal:</strong>{" "}
    {trust.description || trust.title}{" "}
    <ExternalLink href={safeUrl(trust.url)}>
      Read the full update →
    </ExternalLink>
  </div>
);

// Advisory text, with a Show more / Show less toggle for long descriptions.
const Description: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const { text: full, short } = truncateDescription(text);
  if (!full) return null;
  const toggle = (
    <button
      type="button"
      className={styles.descToggle}
      aria-expanded={expanded}
      onClick={() => setExpanded(!expanded)}
    >
      {expanded ? "Show less" : "Show more"}
    </button>
  );
  if (short !== null && !expanded) {
    return (
      <div className={styles.desc}>
        <p>
          {short}… {toggle}
        </p>
      </div>
    );
  }
  const paragraphs = formatDescription(full);
  return (
    <div className={styles.desc}>
      {paragraphs.map((lines, pi) => (
        <p key={pi}>
          {lines.map((line, li) => (
            <React.Fragment key={li}>
              {li > 0 && <br />}
              {line.heading ? <strong>{line.text}</strong> : line.text}
            </React.Fragment>
          ))}
          {short !== null && pi === paragraphs.length - 1 && <> {toggle}</>}
        </p>
      ))}
    </div>
  );
};

const FixProvenance: React.FC<{ data: ScanData; report: CveReport }> = ({
  data,
  report,
}) => {
  const prs = fixPrs(report);
  if (prs.length) {
    return (
      <Row label={prs.length > 1 ? "Fix PRs" : "Fix PR"}>
        {prs.map((p, i) => (
          <React.Fragment key={p.number}>
            {i > 0 && ", "}
            <ExternalLink href={safeUrl(p.url)}>#{p.number}</ExternalLink>
            <span className={styles.muted}>
              {" "}
              ({p.merged ? "merged" : "in review"})
            </span>
          </React.Fragment>
        ))}
      </Row>
    );
  }
  const commits = fixCommits(report);
  if (!commits.length) return null;
  const repo = data.teleport_repo || "gravitational/teleport";
  return (
    <Row label={commits.length > 1 ? "Fix commits" : "Fix commit"}>
      {commits.map((sha, i) => (
        <React.Fragment key={sha}>
          {i > 0 && ", "}
          <ExternalLink
            href={`https://github.com/${repo}/commit/${encodeURIComponent(sha)}`}
          >
            {sha.slice(0, 7)}
          </ExternalLink>
        </React.Fragment>
      ))}
    </Row>
  );
};

const ReportCard: React.FC<{
  data: ScanData;
  report: CveReport;
  note?: string | null;
}> = ({ data, report, note }) => {
  const v = verdict(data, report);
  const images = v.falsePositive ? [] : imageStatus(data, report);
  const trust = data.trust_data?.[report.cve_id.toUpperCase()];
  const advisory = advisoryUrl(report.cve_id);
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cveId}>
          {advisory ? (
            <ExternalLink href={advisory}>{report.cve_id}</ExternalLink>
          ) : (
            report.cve_id
          )}
        </span>
        <span className={cn(styles.pill, styles[v.tone])}>{v.label}</span>
        <span className={styles.pkg}>{report.package_name}</span>
      </div>
      {note && <div className={styles.listNote}>{note}</div>}
      <Description text={descriptionOf(report)} />
      <div className={styles.rows}>
        <Row label="Status">{v.note}</Row>
        {images.map((s) => (
          <Row
            key={s.image + s.major}
            label={`${s.image.split("/").pop()} ${s.major}`}
          >
            last affected <strong>{s.lastAffected}</strong> &middot;{" "}
            {s.firstClean ? (
              <>
                fixed in <strong>{s.firstClean}</strong>
              </>
            ) : (
              "no fixed release in the current window"
            )}
          </Row>
        ))}
        <FixProvenance data={data} report={report} />
      </div>
      {trust && <TrustNote trust={trust} />}
    </div>
  );
};

// trust_data carries only descriptive metadata (title, description, url), so
// the advisory isn't classified here; the Trust Portal update does that.
const TrustOnlyCard: React.FC<{ id: string; trust: TrustEntry }> = ({
  id,
  trust,
}) => (
  <div className={styles.card}>
    <div className={styles.cardHead}>
      <span className={styles.cveId}>{id}</span>
      <span className={cn(styles.pill, styles.info)}>See Trust Portal</span>
    </div>
    <div className={styles.desc}>
      <p>
        This ID does not appear in the latest scan data, but Teleport has
        published an update about it on the Trust Portal. See that update for
        whether and how it affects Teleport.
      </p>
    </div>
    <TrustNote trust={trust} />
  </div>
);

// Absence from the scan data is not evidence the images are unaffected: the
// ID may be newer than the scan or tracked under an alias that wasn't
// captured. Keep this neutral; green verdicts need explicit scan data.
const NotFoundCard: React.FC<{ id: string }> = ({ id }) => (
  <div className={styles.card}>
    <div className={styles.cardHead}>
      <span className={styles.cveId}>{id}</span>
      <span className={cn(styles.pill, styles.info)}>Not in Scan Data</span>
    </div>
    <div className={styles.desc}>
      <p>
        This ID does not appear in the latest scan data, so we can’t confirm
        whether Teleport’s container images are affected. It may have been
        published after the scan date shown below, or be tracked under a
        different ID. Check the <TrustPortalLink /> or contact <SupportLink />.
      </p>
    </div>
  </div>
);

const Results: React.FC<{ query: string; data: ScanData; index: Index }> = ({
  query,
  data,
  index,
}) => {
  const parsed = parseQuery(query);
  if (parsed.kind === "empty") return null;
  if (parsed.kind === "ids") {
    return (
      <>
        {parsed.ids.map((id) => {
          const found = lookupId(data, index.byId, index.aliases, id);
          if (found.kind === "reports") {
            return found.matches.map((m, i) => (
              <ReportCard
                key={`${id}-${i}`}
                data={data}
                report={m.report}
                note={m.note}
              />
            ));
          }
          if (found.kind === "trust") {
            return <TrustOnlyCard key={id} id={id} trust={found.trust} />;
          }
          return <NotFoundCard key={id} id={id} />;
        })}
      </>
    );
  }
  const hits = keywordSearch(data, parsed.keyword);
  if (!hits.length) {
    return (
      <div className={styles.empty}>
        No CVEs matching “{parsed.keyword}” in the current scan.
      </div>
    );
  }
  return (
    <>
      <p className={styles.listNote}>
        {hits.length} result{hits.length === 1 ? "" : "s"}
        {hits.length > MAX_KEYWORD_RESULTS &&
          ` — showing the first ${MAX_KEYWORD_RESULTS}`}
      </p>
      {hits.slice(0, MAX_KEYWORD_RESULTS).map((r, i) => (
        <ReportCard key={`${r.cve_id}-${i}`} data={data} report={r} />
      ))}
    </>
  );
};

/**
 * CveLookupView renders the CVE lookup for already-loaded scan data. It is
 * separate from CveLookup, which fetches the data, so stories and tests can
 * render it from fixtures.
 * @param {LoadState} props.state - Whether the scan data is loading, loaded,
 * or failed to load.
 * @param {string} [props.initialQuery] - Query to run on render, e.g. from a
 * #cve= deep link.
 */
export const CveLookupView: React.FC<{
  state: LoadState;
  initialQuery?: string | null;
}> = ({ state, initialQuery }) => {
  // The input is uncontrolled: the query is read from it on submit.
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(initialQuery || "");
  useEffect(() => {
    if (initialQuery) {
      if (inputRef.current) inputRef.current.value = initialQuery;
      setSubmitted(initialQuery);
    }
  }, [initialQuery]);

  const data = state.status === "loaded" ? state.data : null;
  const index = useMemo<Index | null>(
    () =>
      data
        ? { byId: indexReports(data), aliases: buildAliasIndex(data) }
        : null,
    [data],
  );

  let results: React.ReactNode = null;
  if (state.status === "failed") {
    // Shown without a search, so readers aren't left waiting on data that
    // will never arrive.
    results = (
      <div className={styles.empty}>
        CVE data isn’t available right now. Try refreshing the page. If the
        problem persists, check the <TrustPortalLink /> or contact{" "}
        <SupportLink />.
      </div>
    );
  } else if (submitted.trim()) {
    results =
      data && index ? (
        <Results query={submitted} data={data} index={index} />
      ) : (
        <div className={styles.empty}>Loading scan data…</div>
      );
  }

  return (
    <div className={styles.cveLookup}>
      <form
        role="search"
        className={styles.searchRow}
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(inputRef.current?.value || "");
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          aria-label="CVE, GHSA, or Go vulnerability IDs, or a keyword"
          placeholder="CVE-2026-53489, GO-2026-5622, …"
          autoComplete="off"
          spellCheck={false}
          defaultValue={initialQuery || ""}
        />
        <button type="submit" className={styles.searchButton}>
          Search
        </button>
      </form>
      <p className={styles.hint}>
        Try an ID like <code>CVE-2026-45447</code>, a list like{" "}
        <code>CVE-2026-53489, CVE-2026-50195</code>, or a keyword like{" "}
        <code>containerd</code>.
      </p>
      <p className={styles.hint}>
        These results are AI generated — please contact <SupportLink /> if you
        have any questions about the search results or need more information
        about a CVE or other concern.
      </p>
      <div aria-live="polite">{results}</div>
      {data && (
        <p className={styles.scanMeta}>{formatScanTime(data.timestamp)}</p>
      )}
    </div>
  );
};

/**
 * CveLookup lets readers check whether a CVE, GHSA, or Go vulnerability ID
 * affects Teleport's published container images, using the scan report
 * published by gravitational/cve-tracker.
 * @param {string} props.dataUrl - URL of the scan report (latest.json). The
 * host must allow cross-origin GET requests from the docs site.
 */
const CveLookup: React.FC<{ dataUrl: string }> = ({ dataUrl }) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [initialQuery, setInitialQuery] = useState<string | null>(null);

  useEffect(() => {
    setInitialQuery(deepLinkQuery(window.location.hash));
    let active = true;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    fetch(dataUrl, { mode: "cors", signal: ctrl.signal })
      .then((resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.json();
      })
      .then((data: ScanData) => {
        if (active) setState({ status: "loaded", data });
      })
      .catch((err) => {
        if (!active) return;
        console.error(`CVE lookup: failed to load ${dataUrl}`, err);
        setState({ status: "failed" });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [dataUrl]);

  return <CveLookupView state={state} initialQuery={initialQuery} />;
};

export default CveLookup;
