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

/* Derive a readable type chip from the job title */
function termChip(job) {
  const t = (job.title || "").toLowerCase();
  if (t.includes("co-op") || t.includes("coop") || t.includes("co op")) return "Co-op";
  if (t.includes("intern")) return "Internship";
  if (t.includes("student")) return "Student";
  return "Co-op / Intern";
}

const SCORE_OPTIONS = [
  { label: "Score 70+",  value: 70 },
  { label: "Score 85+",  value: 85 },
  { label: "Score 95+",  value: 95 },
  { label: "All scored", value: 0  },
];

const TERM_OPTIONS = [
  { label: "Fall 2026",      value: "fall2026"  },
  { label: "August 2026",     value: "aug2026"   },
  { label: "September 2026",  value: "sep2026"   },
  { label: "Winter 2027",     value: "winter2027" },
  { label: "Summer 2027",     value: "summer2027" },
  { label: "All upcoming",    value: "all"       },
];

const DOMAIN_OPTIONS = [
  { label: "All domains",          value: "all"       },
  { label: "ML & AI",              value: "ml"        },
  { label: "Data Engineering",     value: "data_eng"  },
  { label: "Cloud & DevOps",       value: "cloud"     },
  { label: "Software Development", value: "swe"       },
  { label: "Data Analytics",       value: "analytics" },
  { label: "Business & Finance",   value: "biz"       },
  { label: "Other",                value: "other"     },
];

const SKILL_OPTIONS = [
  { label: "Any skills",           value: "any"       },
  { label: "Python",               value: "python"    },
  { label: "SQL",                  value: "sql"       },
  { label: "AWS",                  value: "aws"       },
  { label: "Machine Learning",     value: "ml"        },
  { label: "React / Frontend",     value: "react"     },
  { label: "Kubernetes / Docker",  value: "k8s"       },
  { label: "Data Analytics",       value: "analytics" },
];

const PAGE_SIZE = 20;

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

  const [jobs,        setJobs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState("");
  const [skipped,     setSkipped]     = useState(new Set());

  const [minScore, setMinScore] = useState(70);
  const [term,     setTerm]     = useState("fall2026");
  const [domain,   setDomain]   = useState("all");
  const [skill,    setSkill]    = useState("any");

  const load = useCallback(async (filters, offset = 0, append = false) => {
    try {
      const data = await getScoreQueue({ ...filters, limit: PAGE_SIZE, offset });
      setTotal(data.total ?? 0);
      setJobs(prev => append ? [...prev, ...(data.jobs ?? [])] : (data.jobs ?? []));
    } catch (_) {
      setError("Could not load queue — is the backend running?");
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  const currentFilters = { minScore, term, domain, skill };

  useEffect(() => {
    if (!isOnboarded()) { router.replace("/auth"); return; }
    setReady(true);
    load(currentFilters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function applyFilters(next) {
    setLoading(true);
    setSkipped(new Set());
    setError("");
    load(next);
  }

  function handleScore(e) {
    const v = Number(e.target.value);
    setMinScore(v);
    applyFilters({ ...currentFilters, minScore: v });
  }
  function handleTerm(e) {
    const v = e.target.value;
    setTerm(v);
    applyFilters({ ...currentFilters, term: v });
  }
  function handleDomain(e) {
    const v = e.target.value;
    setDomain(v);
    applyFilters({ ...currentFilters, domain: v });
  }
  function handleSkillFilter(e) {
    const v = e.target.value;
    setSkill(v);
    applyFilters({ ...currentFilters, skill: v });
  }
  function handleSkip(id) {
    setSkipped(prev => new Set([...prev, id]));
  }
  function handleLoadMore() {
    setLoadingMore(true);
    load(currentFilters, jobs.length, true);
  }

  if (!ready) return null;

  const visibleJobs = jobs.filter(j => !skipped.has(j.id));
  const hasMore = jobs.length < total;

  // Active filter banner text
  const nonDefault = [
    term   !== "fall2026" && TERM_OPTIONS.find(o => o.value === term)?.label,
    domain !== "all"      && DOMAIN_OPTIONS.find(o => o.value === domain)?.label,
    skill  !== "any"      && SKILL_OPTIONS.find(o => o.value === skill)?.label,
  ].filter(Boolean);
  const showBanner = nonDefault.length > 0;

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

        {/* Filter row */}
        <div className="queue-filter-row">
          <select className="queue-filter-dropdown" value={minScore} onChange={handleScore}>
            {SCORE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select className="queue-filter-dropdown" value={term} onChange={handleTerm}>
            {TERM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select className="queue-filter-dropdown" value={domain} onChange={handleDomain}>
            {DOMAIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select className="queue-filter-dropdown" value={skill} onChange={handleSkillFilter}>
            {SKILL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {!loading && (
            <span className="queue-count">
              {total} job{total !== 1 ? "s" : ""}
              {skipped.size > 0 && ` · ${skipped.size} skipped`}
            </span>
          )}
        </div>

        {/* Active filter banner */}
        {showBanner && !loading && (
          <div className="queue-active-banner">
            Showing: {[
              TERM_OPTIONS.find(o => o.value === term)?.label,
              domain !== "all" && DOMAIN_OPTIONS.find(o => o.value === domain)?.label,
              skill  !== "any" && SKILL_OPTIONS.find(o => o.value === skill)?.label,
            ].filter(Boolean).join(" · ")} · {total} result{total !== 1 ? "s" : ""}
          </div>
        )}

        {error && <p className="queue-error">{error}</p>}

        {/* List */}
        {loading ? (
          <p className="queue-loading">Loading…</p>
        ) : visibleJobs.length === 0 ? (
          <div className="queue-empty">
            <div className="queue-empty-icon">⭐</div>
            <div className="queue-empty-title">
              {total === 0 ? "No jobs match these filters" : "All jobs skipped"}
            </div>
            <p className="queue-empty-sub">
              {total === 0
                ? "Try broadening the filters above"
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
