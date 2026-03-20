"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { isOnboarded } from "../../lib/session";
import { getScoreQueue } from "../../lib/api";
import "./queue.css";
import "../dashboard/dashboard.css";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ HELPERS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function scoreClass(score) {
  if (score >= 85) return "score-green";
  if (score >= 70) return "score-blue";
  if (score >= 50) return "score-amber";
  return "score-gray";
}

const FILTER_OPTIONS = [
  { label: "All scored",  value: 0  },
  { label: "Score 70+",   value: 70 },
  { label: "Score 80+",   value: 80 },
  { label: "Score 85+",   value: 85 },
];

const PAGE_SIZE = 20;

/* Derive a human-readable term chip from title + job_type */
function termChip(job) {
  const t = (job.title || "").toLowerCase();
  if (t.includes("co-op") || t.includes("coop") || t.includes("co op")) return "Co-op";
  if (t.includes("intern")) return "Internship";
  if (t.includes("student")) return "Student";
  // Fall back to job_type but normalize "Full-time" on co-op roles
  const jt = (job.job_type || "").toLowerCase();
  if (jt.includes("co") || jt.includes("intern")) return job.job_type;
  return "Co-op / Intern";
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ JOB CARD ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function JobCard({ job, onSkip, skipped }) {
  return (
    <div className={"queue-card" + (skipped ? " skipped" : "")}>
      {/* Score circle */}
      <div className={`queue-score-circle ${scoreClass(job.score)}`}>
        {Math.round(job.score)}
      </div>

      {/* Body */}
      <div className="queue-card-body">
        <div className="queue-card-top">
          <span className="queue-job-title">{job.title}</span>
        </div>

        <div className="queue-card-meta">
          {job.company && <span>{job.company}</span>}
          {job.company && job.location && <span className="queue-dot">·</span>}
          {job.location && <span>{job.location}</span>}
          <span className="queue-type-badge">{termChip(job)}</span>
        </div>

        {job.score_rationale && (
          <p className="queue-rationale">{job.score_rationale}</p>
        )}

        {/* Skills */}
        {((job.matched_skills?.length > 0) || (job.missing_skills?.length > 0)) && (
          <div className="queue-skills">
            {(job.matched_skills || []).map((s) => (
              <span key={s} className="skill-matched">✓ {s}</span>
            ))}
            {(job.missing_skills || []).slice(0, 3).map((s) => (
              <span key={s} className="skill-missing">✗ {s}</span>
            ))}
          </div>
        )}

        {/* Red flags */}
        {job.red_flags?.length > 0 && (
          <div className="queue-red-flags">
            <strong>Heads up:</strong> {job.red_flags.join(" · ")}
          </div>
        )}

        {/* Actions */}
        <div className="queue-actions">
          {job.url ? (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="queue-apply-btn"
            >
              Apply →
            </a>
          ) : (
            <button className="queue-apply-btn" disabled style={{ opacity: 0.4 }}>
              No link
            </button>
          )}
          <button className="queue-skip-btn" onClick={() => onSkip(job.id)}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function QueuePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [jobs,      setJobs]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,     setError]     = useState("");
  const [minScore,  setMinScore]  = useState(70);
  const [skipped,   setSkipped]   = useState(new Set());

  const load = useCallback(async (score, offset = 0, append = false) => {
    try {
      const data = await getScoreQueue(score, PAGE_SIZE, offset);
      setTotal(data.total ?? 0);
      setJobs(prev => append ? [...prev, ...(data.jobs ?? [])] : (data.jobs ?? []));
    } catch (_) {
      setError("Could not load queue — is the backend running?");
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    if (!isOnboarded()) { router.replace("/auth"); return; }
    setReady(true);
    load(minScore);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterChange(e) {
    const score = Number(e.target.value);
    setMinScore(score);
    setLoading(true);
    setSkipped(new Set());
    setError("");
    load(score);
  }

  function handleSkip(id) {
    setSkipped(prev => new Set([...prev, id]));
  }

  function handleLoadMore() {
    setLoadingMore(true);
    load(minScore, jobs.length, true);
  }

  if (!ready) return null;

  const visibleJobs = jobs.filter(j => !skipped.has(j.id));
  const hasMore = jobs.length < total;

  return (
    <div className="queue-shell">
      <Sidebar activePage="score queue" counts={{ scoreQueue: total }} />

      <main className="queue-main">
        {/* Header */}
        <div>
          <h1 className="queue-page-title">Score Queue</h1>
          <p className="queue-page-sub">
            Jobs matched to your profile — review, apply, or skip
          </p>
        </div>

        {/* Controls */}
        <div className="queue-controls">
          <span className="queue-filter-label">Filter:</span>
          <select
            className="queue-filter-select"
            value={minScore}
            onChange={handleFilterChange}
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {!loading && (
            <span className="queue-count">
              {total} job{total !== 1 ? "s" : ""}
              {skipped.size > 0 && ` · ${skipped.size} skipped`}
            </span>
          )}
        </div>

        {error && <p className="queue-error">{error}</p>}

        {/* List */}
        {loading ? (
          <p className="queue-loading">Loading…</p>
        ) : visibleJobs.length === 0 ? (
          <div className="queue-empty">
            <div className="queue-empty-icon">⭐</div>
            <div className="queue-empty-title">
              {total === 0
                ? "No scored jobs yet"
                : "All jobs skipped"}
            </div>
            <p className="queue-empty-sub">
              {total === 0
                ? "Run the scorer from the dashboard to match jobs to your profile"
                : "Change the filter or refresh to see more"}
            </p>
            {total === 0 && (
              <Link href="/dashboard" className="queue-empty-btn">
                Go to dashboard
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="queue-list">
              {visibleJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSkip={handleSkip}
                  skipped={skipped.has(job.id)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="queue-load-more">
                <button
                  className="queue-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading…" : `Load more (${total - jobs.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
