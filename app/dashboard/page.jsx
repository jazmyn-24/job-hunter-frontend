"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isOnboarded, clearSession } from "../../lib/session";
import { getStats, getPipelineStatus, getScoreQueue, triggerPipeline } from "../../lib/api";
import "./dashboard.css";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ ICONS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ HELPERS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}

function formatLastRun(isoString) {
  if (!isoString) return "Never";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const FIELD_NAMES = {
  tech: "Technology", data: "Data & Analytics", biz: "Business & Finance",
  mkt: "Marketing", eng: "Engineering", health: "Health Sciences",
  design: "Architecture & Design", law: "Law & Policy", sci: "Science & Research",
  other: "Other",
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ SHIMMER ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Shimmer({ width = 80, height = 40 }) {
  return (
    <div style={{
      width,
      height,
      background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      borderRadius: 6,
    }} />
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ SIDEBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const NAV_ITEMS = [
  { label: "Dashboard",    icon: <IconGrid />,         badge: null },
  { label: "Jobs",         icon: <IconBriefcase />,    badge: null },
  { label: "Score queue",  icon: <IconStar />,         badge: null },
  { label: "Applications", icon: <IconCheckCircle />,  badge: null },
  { label: "CV Manager",   icon: <IconDocument />,     badge: null },
  { label: "Settings",     icon: <IconGear />,         badge: null },
];

function Sidebar({ name, field, onSignOut, onReset }) {
  return (
    <aside className="db-sidebar">
      <div className="db-sidebar-top">
        <div className="db-logo">job-hunter</div>
        <div className="db-agent-status">
          <span className="db-agent-dot" />
          Agent active
        </div>
        <nav className="db-nav">
          {NAV_ITEMS.map((item, i) => (
            <div key={item.label} className={"db-nav-item" + (i === 0 ? " active" : "")}>
              <span className="db-nav-icon">{item.icon}</span>
              <span className="db-nav-label">{item.label}</span>
              {item.badge && <span className="db-nav-badge">{item.badge}</span>}
            </div>
          ))}
        </nav>
      </div>

      <div className="db-sidebar-bottom">
        <div className="db-user-row">
          <div className="db-avatar">{getInitials(name)}</div>
          <div className="db-user-info">
            <div className="db-user-name">{name || "You"}</div>
            <div className="db-user-sub">{field || "Co-op student"}</div>
          </div>
        </div>
        <button className="db-signout" onClick={onSignOut}>Sign out</button>
        {process.env.NODE_ENV === "development" && (
          <button className="db-signout db-reset" onClick={onReset} style={{ marginTop: "4px", color: "#fca5a5" }}>
            Reset onboarding
          </button>
        )}
      </div>
    </aside>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ STAT CARD ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function StatCard({ label, icon, value, delta, deltaPositive, accentColor, highlight, loading }) {
  return (
    <div className={"db-stat-card" + (highlight ? " highlight" : "")}>
      <div className="db-stat-top">
        <span className="db-stat-label">{label}</span>
        <span className="db-stat-icon" style={{ color: accentColor }}>{icon}</span>
      </div>
      {loading
        ? <div style={{ marginTop: 8 }}><Shimmer width={80} height={40} /></div>
        : <div className="db-stat-value">{value}</div>
      }
      {loading
        ? <div style={{ marginTop: 6 }}><Shimmer width={120} height={14} /></div>
        : <div className={"db-stat-delta" + (deltaPositive ? " positive" : "")}>{delta}</div>
      }
      <div className="db-stat-bar" style={{ background: accentColor }} />
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ PIPELINE BANNER ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const STEP_KEYS   = ["scrape", "score", "tailor", "apply", "notify"];
const STEP_LABELS = { scrape: "Scrape", score: "Score", tailor: "Tailor", apply: "Apply", notify: "Notify" };

function PipelineBanner({ pipeline, loading, onRun, running }) {
  const steps   = pipeline?.steps ?? {};
  const lastRun = formatLastRun(pipeline?.last_run);

  return (
    <div className="db-pipeline">
      <div className="db-pipeline-left">
        <div className="db-pipeline-title">Pipeline status</div>
        <div className="db-pipeline-sub">
          Last run: <span className="db-mono">{loading ? "—" : lastRun}</span>
        </div>
      </div>
      <div className="db-pipeline-steps">
        {STEP_KEYS.map((key, i) => {
          const done = steps[key] === "complete";
          return (
            <span key={key} className="db-pipeline-step-wrap">
              {i > 0 && <span className="db-pipeline-arrow">→</span>}
              <span className={"db-pipeline-step" + (done ? " done" : "")}>
                {done ? "✓" : "○"} {STEP_LABELS[key]}
              </span>
            </span>
          );
        })}
      </div>
      <button className="db-run-btn" onClick={onRun} disabled={running || loading}>
        {running ? "Running…" : "Run now"}
      </button>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ SCORE QUEUE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function ScoreQueueSection({ queue, loading }) {
  return (
    <div className="db-queue">
      <div className="db-queue-header">
        <span className="db-queue-title">Score queue</span>
        <span className="db-queue-sub">Jobs scored ≥ 70</span>
      </div>
      {loading ? (
        <div className="db-queue-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="db-queue-card">
              <Shimmer width="60%" height={16} />
              <div style={{ marginTop: 6 }}><Shimmer width="40%" height={12} /></div>
            </div>
          ))}
        </div>
      ) : queue.length === 0 ? (
        <p className="db-queue-empty">
          No jobs in queue yet — run the scorer to see results
        </p>
      ) : (
        <div className="db-queue-list">
          {queue.map(job => (
            <a
              key={job.id}
              href={job.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="db-queue-card"
            >
              <div className="db-queue-card-top">
                <span className="db-queue-job-title">{job.title}</span>
                <span className="db-queue-score" style={{
                  color: job.score >= 85 ? "#059669" : job.score >= 70 ? "#7c3aed" : "#9ca3af"
                }}>
                  {Math.round(job.score)}
                </span>
              </div>
              <div className="db-queue-meta">
                {job.company && <span>{job.company}</span>}
                {job.company && job.location && <span className="db-queue-dot">·</span>}
                {job.location && <span>{job.location}</span>}
                {job.source && <span className="db-queue-source">{job.source}</span>}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function DashboardPage() {
  const router = useRouter();
  const [name,  setName]  = useState("");
  const [field, setField] = useState("");
  const [ready, setReady] = useState(false);

  const [stats,    setStats]    = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [queue,    setQueue]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [running,  setRunning]  = useState(false);

  useEffect(() => {
    if (!isOnboarded()) { router.replace("/auth"); return; }
    const session = getSession();
    setName(session?.name || "");
    const firstField = session?.onboardingData?.fields?.[0];
    setField(firstField ? FIELD_NAMES[firstField] || "" : "");
    setReady(true);

    Promise.all([getStats(), getPipelineStatus(), getScoreQueue(3)])
      .then(([s, p, q]) => {
        setStats(s);
        setPipeline(p);
        setQueue(q);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function signOut()         { clearSession(); router.push("/auth"); }
  function resetOnboarding() { clearSession(); router.push("/onboarding"); }

  async function handleRunNow() {
    setRunning(true);
    try { await triggerPipeline(); } catch (_) {}
    setTimeout(async () => {
      try {
        const [s, p, q] = await Promise.all([getStats(), getPipelineStatus(), getScoreQueue(3)]);
        setStats(s); setPipeline(p); setQueue(q);
      } catch (_) {}
      setRunning(false);
    }, 2000);
  }

  if (!ready) return null;

  const v = (val) => error ? "--" : val ?? "--";

  return (
    <div className="db-shell">
      <Sidebar name={name} field={field} onSignOut={signOut} onReset={resetOnboarding} />

      <main className="db-main">
        {/* Header */}
        <div className="db-header">
          <h1 className="db-greeting">{getGreeting()}, {name || "there"}</h1>
          <p className="db-subhead">
            Your agent ran{" "}
            <span className="db-mono">
              {loading ? "—" : formatLastRun(pipeline?.last_run)}
            </span>{" "}
            · Next run at <span className="db-mono">2:00 AM</span>
          </p>
        </div>

        {/* Stats */}
        <div className="db-stats-grid">
          <StatCard
            label="JOBS INDEXED"
            icon={<IconDatabase />}
            value={v(stats?.jobs_indexed?.toLocaleString())}
            delta={error ? "—" : `+${stats?.jobs_added_last_run ?? 0} added last 24h`}
            deltaPositive={!error && (stats?.jobs_added_last_run ?? 0) > 0}
            accentColor="#4361ee"
            loading={loading}
          />
          <StatCard
            label="SCORE QUEUE"
            icon={<IconStar />}
            value={v(stats?.score_queue)}
            delta="jobs scored 70 or above"
            deltaPositive={!error && (stats?.score_queue ?? 0) > 0}
            accentColor="#7c3aed"
            highlight
            loading={loading}
          />
          <StatCard
            label="APPLICATIONS SENT"
            icon={<IconSend />}
            value={v(stats?.applications_sent)}
            delta="this week"
            deltaPositive={false}
            accentColor="#0891b2"
            loading={loading}
          />
          <StatCard
            label="INTERVIEWS"
            icon={<IconCalendar />}
            value={v(stats?.interviews)}
            delta={stats?.interviews > 0 ? "active" : "none yet"}
            deltaPositive={!error && (stats?.interviews ?? 0) > 0}
            accentColor="#059669"
            loading={loading}
          />
        </div>

        {/* Pipeline */}
        <PipelineBanner pipeline={pipeline} loading={loading} onRun={handleRunNow} running={running} />

        {/* Error banner */}
        {error && (
          <p className="db-offline-banner">
            Backend offline — run: <span className="db-mono">cd backend &amp;&amp; uvicorn main:app --reload</span>
          </p>
        )}

        {/* Score queue */}
        <ScoreQueueSection queue={queue} loading={loading} />
      </main>
    </div>
  );
}
