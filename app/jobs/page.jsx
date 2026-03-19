"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isOnboarded } from "../../lib/session";
import { getJobs, getJobDescription } from "../../lib/api";
import Sidebar from "../../components/Sidebar";
import "./jobs.css";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ HELPERS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function relativeDate(isoString) {
  if (!isoString) return null;
  const diff = Date.now() - new Date(isoString).getTime();
  const mins   = Math.floor(diff / 60000);
  const hours  = Math.floor(mins / 60);
  const days   = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  if (mins  < 60)  return "Just now";
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return `${months} month${months !== 1 ? "s" : ""} ago`;
}

function hasScore(score) {
  return score !== null && score !== undefined && score > 0;
}

function scoreTier(score) {
  if (!hasScore(score)) return "none";
  if (score >= 70) return "high";
  if (score >= 50) return "mid";
  return "low";
}

function extractTerm(job) {
  const combined = ((job.title || "") + " " + (job.description || "")).toLowerCase();
  if (combined.includes("fall 2026"))    return "Fall 2026";
  if (combined.includes("summer 2026"))  return "Summer 2026";
  if (combined.includes("winter 2026"))  return "Winter 2026";
  if (combined.includes("spring 2026"))  return "Spring 2026";
  if (combined.includes("january 2026")) return "Jan 2026";
  if (combined.includes("may 2026"))     return "May 2026";
  if (combined.includes("fall 2027"))    return "Fall 2027";
  if (combined.includes("summer 2027"))  return "Summer 2027";
  if (combined.includes("2026"))         return "2026";
  if (combined.includes("2027"))         return "2027";
  const title = (job.title || "").toLowerCase();
  if (title.includes("co-op") || title.includes("coop")) return "Co-op";
  if (title.includes("intern"))     return "Internship";
  if (title.includes("student"))    return "Student";
  if (title.includes("placement"))  return "Placement";
  return "Co-op / Intern";
}

function extractJobType(job) {
  const title = (job.title || "").toLowerCase();
  if (title.includes("co-op") || title.includes("coop")) return "Co-op";
  if (title.includes("intern"))    return "Internship";
  if (title.includes("student"))   return "Student";
  if (title.includes("placement")) return "Placement";
  return "Co-op / Intern";
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ DESCRIPTION FORMATTER ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function FormattedDescription({ text }) {
  if (!text) return null;
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  return (
    <div className="ind-desc-body">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const isHeader =
          (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length > 3 && trimmed.length < 80) ||
          (trimmed.endsWith(":") && trimmed.length < 60 && !/^[•\-\*\d]/.test(trimmed));
        const isBullet = /^[•\-\*]\s/.test(trimmed) || /^\d+[\.\)]\s/.test(trimmed);

        if (isHeader) {
          return (
            <h4 key={i} className="ind-desc-header">{trimmed}</h4>
          );
        }
        if (isBullet) {
          const content = trimmed.replace(/^[•\-\*]\s*|^\d+[\.\)]\s*/, "");
          return (
            <div key={i} className="ind-desc-bullet">
              <span className="ind-desc-dot">•</span>
              <span>{content}</span>
            </div>
          );
        }
        return <p key={i} className="ind-desc-para">{trimmed}</p>;
      })}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ SHIMMER ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Shimmer({ width, height, style = {} }) {
  return (
    <div className="ind-shimmer" style={{ width, height, borderRadius: 4, ...style }} />
  );
}

function ShimmerCard() {
  return (
    <div className="ind-card" style={{ cursor: "default" }}>
      <Shimmer width="65%" height={16} />
      <Shimmer width="40%" height={13} style={{ marginTop: 6 }} />
      <Shimmer width="30%" height={11} style={{ marginTop: 6 }} />
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ JOB CARD ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function JobCard({ job, selected, onClick }) {
  const tier     = scoreTier(job.score);
  const date     = relativeDate(job.scraped_at || job.posted_at);
  const scored   = hasScore(job.score);
  const term     = extractTerm(job);
  const jobType  = extractJobType(job);

  return (
    <div
      className={"ind-card" + (selected ? " selected" : "")}
      onClick={onClick}
    >
      <div className="ind-card-title">{job.title}</div>
      <div className="ind-card-company">
        {[job.company, job.location].filter(Boolean).join(" · ")}
      </div>
      {job.salary && (
        <div className="ind-card-salary">{job.salary}</div>
      )}
      <div className="ind-card-tags">
        <span className="ind-term-chip">{term}</span>
        <span className="ind-type-tag green">{jobType}</span>
        {scored ? (
          <span className={`ind-score-tag ${tier}`}>{Math.round(job.score)} match</span>
        ) : (
          <span className="ind-score-tag unscored">--</span>
        )}
        {date && <span className="ind-card-date">{date}</span>}
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ EMPTY STATE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function EmptyState() {
  return (
    <div className="ind-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p className="ind-empty-title">Select a job to view details</p>
      <p className="ind-empty-sub">Click any listing on the left</p>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ JOB DETAIL ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function JobDetail({ job, onBack }) {
  const scored   = hasScore(job.score);
  const tier     = scoreTier(job.score);
  const posted   = relativeDate(job.posted_at || job.scraped_at);
  const term     = extractTerm(job);
  const jobType  = extractJobType(job);

  const hasLongDesc = job.description && job.description.length > 500;
  const [desc,        setDesc]        = useState(job.description || "");
  const [descLoading, setDescLoading] = useState(!hasLongDesc);
  const [descCached,  setDescCached]  = useState(hasLongDesc);
  const [descFailed,  setDescFailed]  = useState(false);

  useEffect(() => {
    const longDesc = job.description && job.description.length > 500;
    setDesc(job.description || "");
    setDescFailed(false);

    if (longDesc) {
      setDescCached(true);
      setDescLoading(false);
      return;
    }

    setDescCached(false);
    setDescLoading(true);
    getJobDescription(job.id)
      .then(data => {
        setDesc(data.description || job.description || "");
        setDescCached(!!data.cached);
        setDescLoading(false);
      })
      .catch(() => {
        setDescFailed(true);
        setDescLoading(false);
      });
  }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ind-detail">
      {onBack && (
        <button className="ind-back-btn" onClick={onBack}>← Back to results</button>
      )}

      <h1 className="ind-detail-title">{job.title}</h1>
      {(job.company || job.location) && (
        <p className="ind-detail-company">
          {[job.company, job.location].filter(Boolean).join(" · ")}
        </p>
      )}
      {job.salary && (
        <p className="ind-detail-salary">{job.salary}</p>
      )}

      <div className="ind-detail-meta">
        <span className="ind-term-chip">{term}</span>
        <span className="ind-meta-sep">·</span>
        <span className="ind-type-tag green">{jobType}</span>
        {posted && <><span className="ind-meta-sep">·</span><span className="ind-meta-date">{posted}</span></>}
        {scored ? (
          <><span className="ind-meta-sep">·</span><span className={`ind-score-pill ${tier}`}>{Math.round(job.score)} / 100</span></>
        ) : (
          <><span className="ind-meta-sep">·</span><span className="ind-not-scored">Not scored yet</span></>
        )}
      </div>

      <div className="ind-actions">
        <button className="ind-btn-apply">Apply now</button>
        <a
          href={job.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="ind-btn-view"
        >
          View original posting →
        </a>
      </div>

      <hr className="ind-divider" />

      <p className="ind-section-label">
        About the job
        {descCached && <span className="ind-cached-badge">· cached</span>}
      </p>

      {descLoading ? (
        <div>
          <p className="ind-fetching-label">Fetching full description…</p>
          <Shimmer width="90%" height={13} style={{ marginBottom: 8 }} />
          <Shimmer width="75%" height={13} style={{ marginBottom: 8 }} />
          <Shimmer width="55%" height={13} />
        </div>
      ) : desc ? (
        <>
          <FormattedDescription text={desc} />
          {descFailed && job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="ind-fallback-link">
              View on original site →
            </a>
          )}
        </>
      ) : (
        <>
          <p className="ind-no-desc">No description available for this posting.</p>
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="ind-fallback-link">
              View on original site →
            </a>
          )}
        </>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const PAGE_SIZE = 50;

const TYPE_LABELS = {
  all:       "Co-op & Internship",
  coop:      "Co-op",
  intern:    "Internship",
  student:   "Student",
  all_types: "All types",
};

const TERM_LABELS = {
  fall2026:    "Fall 2026+",
  summer2026:  "Summer 2026",
  all_upcoming:"All upcoming",
  "2027":      "2027 only",
  all:         "All",
};

export default function JobsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [jobs,        setJobs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [sort,        setSort]        = useState("newest");
  const [term,        setTerm]        = useState("fall2026");
  const [jobType,     setJobType]     = useState("all");
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset,      setOffset]      = useState(0);
  const [mobileView,  setMobileView]  = useState("list");

  const listRef   = useRef(null);
  const detailRef = useRef(null);

  useEffect(() => {
    if (!isOnboarded()) { router.replace("/auth"); return; }
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    setOffset(0);
    getJobs(sort, PAGE_SIZE, 0, term, jobType).then(({ total: t, jobs: j }) => {
      setTotal(t);
      setJobs(j);
      setSelectedJob(j[0] ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ready, sort, term, jobType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    function onScroll() {
      if (loadingMore) return;
      if (jobs.length >= total) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 80) {
        const nextOffset = offset + PAGE_SIZE;
        setLoadingMore(true);
        setOffset(nextOffset);
        getJobs(sort, PAGE_SIZE, nextOffset, term, jobType).then(({ jobs: more }) => {
          setJobs(prev => [...prev, ...more]);
          setLoadingMore(false);
        }).catch(() => setLoadingMore(false));
      }
    }
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [jobs.length, total, loadingMore, offset, sort, term, jobType]);

  function handleJobClick(job) {
    setSelectedJob(job);
    setMobileView("detail");
    if (detailRef.current) detailRef.current.scrollTop = 0;
  }

  if (!ready) return null;

  return (
    <div className="ind-shell">
      <Sidebar activePage="jobs" />

      <div className="ind-main">
        {/* ── Left panel ── */}
        <div className={"ind-left" + (mobileView === "detail" ? " ind-hidden-mobile" : "")}>
          <div className="ind-topbar">
            <div className="ind-topbar-row">
              <span className="ind-topbar-title">Jobs</span>
              <span className="ind-count-badge">
                {total.toLocaleString()} matching
              </span>
            </div>

            {/* Filter dropdowns */}
            <div className="ind-filter-row">
              <div className="ind-filter-group">
                <label className="ind-filter-label">Sort by</label>
                <select
                  className="ind-filter-select"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                >
                  <option value="newest">Most recent</option>
                  <option value="score">Highest score</option>
                  <option value="company_asc">Company A–Z</option>
                  <option value="company_desc">Company Z–A</option>
                </select>
              </div>

              <div className="ind-filter-group">
                <label className="ind-filter-label">Term</label>
                <select
                  className="ind-filter-select"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                >
                  <option value="fall2026">Fall 2026+</option>
                  <option value="summer2026">Summer 2026</option>
                  <option value="all_upcoming">All upcoming (2026 & 2027)</option>
                  <option value="2027">2027 only</option>
                  <option value="all">All jobs (no filter)</option>
                </select>
              </div>

              <div className="ind-filter-group">
                <label className="ind-filter-label">Type</label>
                <select
                  className="ind-filter-select"
                  value={jobType}
                  onChange={e => setJobType(e.target.value)}
                >
                  <option value="all">Co-op & Internship</option>
                  <option value="coop">Co-op only</option>
                  <option value="intern">Internship only</option>
                  <option value="student">Student positions</option>
                  <option value="all_types">All types</option>
                </select>
              </div>
            </div>
          </div>

          <div className="ind-period-banner">
            Showing <strong>{TYPE_LABELS[jobType]}</strong> positions
            {" · "}{TERM_LABELS[term]}
            {" · "}{loading ? "…" : total.toLocaleString()} results
          </div>

          <div className="ind-list" ref={listRef}>
            {loading
              ? Array.from({ length: 12 }, (_, i) => <ShimmerCard key={i} />)
              : jobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    selected={selectedJob?.id === job.id}
                    onClick={() => handleJobClick(job)}
                  />
                ))
            }
            {loadingMore && (
              <div className="ind-load-more">Loading more…</div>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div
          className={"ind-right" + (mobileView === "list" ? " ind-hidden-mobile" : "")}
          ref={detailRef}
        >
          {selectedJob
            ? <JobDetail
                job={selectedJob}
                onBack={mobileView === "detail" ? () => setMobileView("list") : null}
              />
            : <EmptyState />
          }
        </div>
      </div>
    </div>
  );
}
