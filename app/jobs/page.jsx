"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isOnboarded } from "../../lib/session";
import { getJobs, getJobDescription } from "../../lib/api";
import Sidebar from "../../components/Sidebar";
import "./jobs.css";
import "../dashboard/dashboard.css";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ HELPERS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function relativeDate(isoString) {
  if (!isoString) return null;
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (mins  < 60)  return "Just now";
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return `${months} month${months !== 1 ? "s" : ""} ago`;
}

function scoreBadgeClass(score) {
  if (score === null || score === undefined || score === 0) return "none";
  if (score >= 70) return "high";
  if (score >= 50) return "mid";
  return "low";
}

function scoreBadgeText(score) {
  if (!score) return "—";
  return String(Math.round(score));
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ DESCRIPTION FORMATTER ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function FormattedDescription({ text }) {
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  return (
    <div className="jobs-desc-formatted">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const isHeader =
          (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length >= 4 && trimmed.length < 80) ||
          (trimmed.endsWith(":") && trimmed.length < 60 && !/^[•\-\*\d]/.test(trimmed));
        const isBullet = /^[•\-\*]\s/.test(trimmed) || /^\d+[\.\)]\s/.test(trimmed);

        if (isHeader) {
          return <p key={i} className="jobs-desc-header">{trimmed}</p>;
        }
        if (isBullet) {
          const content = trimmed.replace(/^[•\-\*]\s*|^\d+[\.\)]\s*/, "");
          return (
            <div key={i} className="jobs-desc-bullet">
              <span className="jobs-desc-bullet-dot">•</span>
              <span>{content}</span>
            </div>
          );
        }
        return <p key={i} className="jobs-desc-para">{trimmed}</p>;
      })}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ SHIMMER ROW ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function ShimmerRow() {
  return (
    <div className="jobs-list-item" style={{ cursor: "default" }}>
      <div className="jobs-item-top">
        <div className="jobs-shimmer" style={{ width: "60%", height: 14 }} />
        <div className="jobs-shimmer" style={{ width: 28, height: 14 }} />
      </div>
      <div className="jobs-item-meta" style={{ marginTop: 6 }}>
        <div className="jobs-shimmer" style={{ width: 80, height: 11 }} />
        <div className="jobs-shimmer" style={{ width: 60, height: 11 }} />
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ JOB LIST ITEM ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function JobListItem({ job, selected, onClick }) {
  const cls = scoreBadgeClass(job.score);
  const date = relativeDate(job.scraped_at || job.posted_at);

  return (
    <div
      className={"jobs-list-item" + (selected ? " selected" : "")}
      onClick={onClick}
    >
      <div className="jobs-item-top">
        <span className="jobs-item-title">{job.title}</span>
        <span className={`jobs-score-badge ${cls}`}>{scoreBadgeText(job.score)}</span>
      </div>
      <div className="jobs-item-meta">
        {job.company && <span className="jobs-meta-company">{job.company}</span>}
        {job.company && job.location && <span className="jobs-meta-sep">·</span>}
        {job.location && <span className="jobs-meta-location">{job.location}</span>}
        {job.source && (
          <>
            <span className="jobs-meta-sep">·</span>
            <span className="jobs-meta-source">{job.source}</span>
          </>
        )}
        {date && <span className="jobs-meta-date">{date}</span>}
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ EMPTY STATE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function EmptyState() {
  return (
    <div className="jobs-empty-state">
      <svg className="jobs-empty-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p className="jobs-empty-title">Select a job to view details</p>
      <p className="jobs-empty-sub">Click any job on the left to see the full posting</p>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ JOB DETAIL ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function JobDetail({ job }) {
  const scored = job.score && job.score > 0;
  const postedDate = relativeDate(job.posted_at || job.scraped_at);

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
    <div>
      {/* Header */}
      <div className="jobs-detail-header">
        <div className="jobs-detail-left">
          <h1 className="jobs-detail-title">{job.title}</h1>
          {(job.company || job.location) && (
            <p className="jobs-detail-company">
              {[job.company, job.location].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="jobs-detail-meta">
            {job.source   && <span className="jobs-detail-source">{job.source}</span>}
            {postedDate   && <span className="jobs-detail-date">{postedDate}</span>}
            {job.job_type && <span className="jobs-detail-type">{job.job_type}</span>}
          </div>
        </div>

        <div className={`jobs-score-circle${scored ? "" : " unscored"}`}>
          <span className="jobs-score-circle-num">
            {scored ? Math.round(job.score) : "—"}
          </span>
          <span className="jobs-score-circle-label">
            {scored ? "score" : "not scored"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="jobs-actions">
        <a
          href={job.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="jobs-btn-secondary"
        >
          View original posting →
        </a>
        <button className="jobs-btn-primary">Apply manually</button>
      </div>

      <hr className="jobs-divider" />

      {/* Description */}
      <p className="jobs-desc-label">
        Description
        {descCached && <span className="jobs-desc-cached">· cached</span>}
      </p>

      {descLoading ? (
        <div>
          <p className="jobs-desc-fetch-label">Fetching full description…</p>
          <div className="jobs-shimmer" style={{ width: "90%", height: 13, marginBottom: 8 }} />
          <div className="jobs-shimmer" style={{ width: "75%", height: 13, marginBottom: 8 }} />
          <div className="jobs-shimmer" style={{ width: "55%", height: 13 }} />
        </div>
      ) : desc ? (
        <>
          <FormattedDescription text={desc} />
          {descFailed && job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="jobs-desc-fallback-link">
              View on original site →
            </a>
          )}
        </>
      ) : (
        <>
          <p className="jobs-desc-empty">No description available for this posting.</p>
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="jobs-desc-fallback-link">
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

const PERIOD_LABELS = {
  upcoming: "Fall 2026+",
  all:      "All jobs",
  "2027":   "2027+",
};

export default function JobsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [jobs,        setJobs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [sort,        setSort]        = useState("newest");
  const [period,      setPeriod]      = useState("upcoming");
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset,      setOffset]      = useState(0);

  const listRef   = useRef(null);
  const detailRef = useRef(null);

  useEffect(() => {
    if (!isOnboarded()) { router.replace("/auth"); return; }
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load jobs on mount, sort change, or period change
  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    setOffset(0);
    getJobs(sort, PAGE_SIZE, 0, period).then(({ total: t, jobs: j }) => {
      setTotal(t);
      setJobs(j);
      setSelectedJob(j[0] ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ready, sort, period]); // eslint-disable-line react-hooks/exhaustive-deps

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
        getJobs(sort, PAGE_SIZE, nextOffset, period).then(({ jobs: more }) => {
          setJobs(prev => [...prev, ...more]);
          setLoadingMore(false);
        }).catch(() => setLoadingMore(false));
      }
    }

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [jobs.length, total, loadingMore, offset, sort, period]);

  function handleJobClick(job) {
    setSelectedJob(job);
    if (detailRef.current) detailRef.current.scrollTop = 0;
  }

  function handleSortChange(newSort) {
    if (newSort === sort) return;
    setSort(newSort);
  }

  function handlePeriodChange(newPeriod) {
    if (newPeriod === period) return;
    setPeriod(newPeriod);
  }

  if (!ready) return null;

  return (
    <div className="jobs-shell">
      <Sidebar activePage="jobs" />

      <div className="jobs-main">
        {/* ── Left panel ── */}
        <div className="jobs-left">
          <div className="jobs-topbar">
            <div className="jobs-title-row">
              <span className="jobs-title">Jobs</span>
              <span className="jobs-count-badge">
                {total.toLocaleString()} {period === "all" ? "total" : "matching"}
              </span>
            </div>
            <div className="jobs-sort-bar">
              <button
                className={"jobs-sort-chip" + (sort === "newest" ? " active" : "")}
                onClick={() => handleSortChange("newest")}
              >
                Newest first
              </button>
              <button
                className={"jobs-sort-chip" + (sort === "score" ? " active" : "")}
                onClick={() => handleSortChange("score")}
              >
                Highest score
              </button>
            </div>
            <div className="jobs-filter-bar">
              {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={"jobs-sort-chip" + (period === key ? " active" : "")}
                  onClick={() => handlePeriodChange(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {period === "upcoming" && (
            <div className="jobs-period-banner">
              Showing co-op and internship positions for Fall 2026 and beyond
            </div>
          )}

          <div className="jobs-list" ref={listRef}>
            {loading
              ? Array.from({ length: 12 }, (_, i) => <ShimmerRow key={i} />)
              : jobs.map(job => (
                  <JobListItem
                    key={job.id}
                    job={job}
                    selected={selectedJob?.id === job.id}
                    onClick={() => handleJobClick(job)}
                  />
                ))
            }
            {loadingMore && (
              <div className="jobs-load-more">Loading more…</div>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="jobs-right" ref={detailRef}>
          {selectedJob
            ? <JobDetail job={selectedJob} />
            : <EmptyState />
          }
        </div>
      </div>
    </div>
  );
}
