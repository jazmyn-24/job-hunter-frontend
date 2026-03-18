"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isOnboarded } from "../../lib/session";
import { getJobs } from "../../lib/api";
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
            {job.source  && <span className="jobs-detail-source">{job.source}</span>}
            {postedDate  && <span className="jobs-detail-date">{postedDate}</span>}
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
      <p className="jobs-desc-label">Description</p>
      {job.description ? (
        <div className="jobs-desc-text">{job.description}</div>
      ) : (
        <p className="jobs-desc-empty">No description available for this posting.</p>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const PAGE_SIZE = 50;

export default function JobsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [jobs,        setJobs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [sort,        setSort]        = useState("newest");
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset,      setOffset]      = useState(0);

  const listRef   = useRef(null);
  const detailRef = useRef(null);

  useEffect(() => {
    if (!isOnboarded()) { router.replace("/auth"); return; }
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load jobs on mount or sort change
  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    setOffset(0);
    getJobs(sort, PAGE_SIZE, 0).then(({ total: t, jobs: j }) => {
      setTotal(t);
      setJobs(j);
      setSelectedJob(j[0] ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ready, sort]); // eslint-disable-line react-hooks/exhaustive-deps

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
        getJobs(sort, PAGE_SIZE, nextOffset).then(({ jobs: more }) => {
          setJobs(prev => [...prev, ...more]);
          setLoadingMore(false);
        }).catch(() => setLoadingMore(false));
      }
    }

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [jobs.length, total, loadingMore, offset, sort]);

  function handleJobClick(job) {
    setSelectedJob(job);
    if (detailRef.current) detailRef.current.scrollTop = 0;
  }

  function handleSortChange(newSort) {
    if (newSort === sort) return;
    setSort(newSort);
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
              <span className="jobs-count-badge">{total.toLocaleString()} total</span>
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
          </div>

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
