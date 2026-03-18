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
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (mins  < 60)  return "Just now";
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return `${months} month${months !== 1 ? "s" : ""} ago`;
}

function scoreTier(score) {
  if (!score || score === 0) return "none";
  if (score >= 70) return "high";
  if (score >= 50) return "mid";
  return "low";
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ DESCRIPTION FORMATTER ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function FormattedDescription({ text }) {
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  return (
    <div className="ind-desc-body">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const isHeader =
          (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length >= 4 && trimmed.length < 80) ||
          (trimmed.endsWith(":") && trimmed.length < 60 && !/^[•\-\*\d]/.test(trimmed));
        const isBullet = /^[•\-\*]\s/.test(trimmed) || /^\d+[\.\)]\s/.test(trimmed);

        if (isHeader) {
          return <p key={i} className="ind-desc-header">{trimmed}</p>;
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
    <div
      className="ind-shimmer"
      style={{ width, height, borderRadius: 4, ...style }}
    />
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
  const tier = scoreTier(job.score);
  const date = relativeDate(job.scraped_at || job.posted_at);

  return (
    <div
      className={"ind-card" + (selected ? " selected" : "")}
      onClick={onClick}
    >
      <div className="ind-card-title">{job.title}</div>
      <div className="ind-card-company">
        {[job.company, job.location].filter(Boolean).join(" · ")}
      </div>
      <div className="ind-card-tags">
        {job.source && <span className="ind-tag">{job.source}</span>}
        {job.job_type && <span className="ind-tag">{job.job_type}</span>}
        {job.score > 0 && (
          <span className={`ind-score-tag ${tier}`}>
            {Math.round(job.score)} match
          </span>
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
  const scored = job.score && job.score > 0;
  const tier   = scoreTier(job.score);
  const posted = relativeDate(job.posted_at || job.scraped_at);

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
      {/* Mobile back */}
      {onBack && (
        <button className="ind-back-btn" onClick={onBack}>
          ← Back to results
        </button>
      )}

      {/* Header */}
      <h1 className="ind-detail-title">{job.title}</h1>
      {(job.company || job.location) && (
        <p className="ind-detail-company">
          {[job.company, job.location].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="ind-detail-meta">
        {job.source   && <span className="ind-tag">{job.source}</span>}
        {job.job_type && <span className="ind-tag">{job.job_type}</span>}
        {posted       && <span className="ind-meta-date">{posted}</span>}
        {scored && (
          <span className={`ind-score-pill ${tier}`}>
            {Math.round(job.score)} / 100
          </span>
        )}
      </div>

      {/* Actions */}
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

      {/* Description */}
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

const PERIOD_LABELS = {
  fall2026: "Fall 2026+",
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
  const [period,      setPeriod]      = useState("fall2026");
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
          {/* Topbar */}
          <div className="ind-topbar">
            <div className="ind-topbar-row">
              <span className="ind-topbar-title">Jobs</span>
              <span className="ind-count-badge">
                {total.toLocaleString()} {period === "all" ? "total" : "matching"}
              </span>
            </div>

            {/* Sort chips */}
            <div className="ind-chip-row">
              <button
                className={"ind-chip" + (sort === "newest" ? " active" : "")}
                onClick={() => sort !== "newest" && setSort("newest")}
              >
                Newest
              </button>
              <button
                className={"ind-chip" + (sort === "score" ? " active" : "")}
                onClick={() => sort !== "score" && setSort("score")}
              >
                Best match
              </button>
            </div>

            {/* Period chips */}
            <div className="ind-chip-row">
              {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={"ind-chip" + (period === key ? " active" : "")}
                  onClick={() => period !== key && setPeriod(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {period === "fall2026" && (
            <div className="ind-period-banner">
              Showing co-op and internship positions for Fall 2026 and beyond
            </div>
          )}

          {/* Job list */}
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
            ? (
              <JobDetail
                job={selectedJob}
                onBack={mobileView === "detail" ? () => setMobileView("list") : null}
              />
            )
            : <EmptyState />
          }
        </div>
      </div>
    </div>
  );
}
