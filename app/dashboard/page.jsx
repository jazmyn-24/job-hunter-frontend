"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isOnboarded, getOrCreateSessionId, getSession } from "../../lib/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { getStats, getPipelineStatus, getScoreQueue, triggerPipeline, runScorer, getScorerStatus } from "../../lib/api";
import Sidebar from "../../components/Sidebar";
import "./dashboard.css";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ ICONS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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

function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function IconSync() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
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

/* Sidebar is now the shared component — imported above */

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

function PipelineBanner({ pipeline, loading, onRun, running, onScore, scoring, scorerResult, onSync, syncing }) {
  const steps   = pipeline?.steps ?? {};
  const lastRun = formatLastRun(pipeline?.last_run);

  return (
    <div className="db-pipeline">
      <div className="db-pipeline-left">
        <div className="db-pipeline-title">Pipeline status</div>
        <div className="db-pipeline-sub">
          Last run: <span className="db-mono">{loading ? "—" : lastRun}</span>
        </div>
        {scorerResult && !scorerResult.error && (
          <div className="db-pipeline-sub" style={{ marginTop: 2, color: "#059669" }}>
            Scored: {scorerResult.scored} jobs · {scorerResult.failed} failed
          </div>
        )}
        {scorerResult?.error && (
          <div className="db-pipeline-sub" style={{ marginTop: 2, color: "#dc2626", fontSize: 12 }}>
            Scorer error: {scorerResult.error}
          </div>
        )}
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
      <div style={{ display: "flex", gap: 8 }}>
        <button className="db-run-btn" onClick={onScore} disabled={scoring || loading}
          style={{ background: scoring ? "#9ca3af" : "#059669" }}>
          {scoring ? "Scoring…" : "Score jobs"}
        </button>
        <button className="db-run-btn" onClick={onSync} disabled={syncing || loading}
          style={{ background: syncing ? "#9ca3af" : "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
          <IconSync />
          {syncing ? "Syncing…" : "Sync profile"}
        </button>
        <button className="db-run-btn" onClick={onRun} disabled={running || loading}>
          {running ? "Running…" : "Run now"}
        </button>
      </div>
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
  const [ready, setReady] = useState(false);

  const [stats,        setStats]        = useState(null);
  const [pipeline,     setPipeline]     = useState(null);
  const [queue,        setQueue]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [running,      setRunning]      = useState(false);
  const [scoring,      setScoring]      = useState(false);
  const [scorerResult, setScorerResult] = useState(null);
  const [syncing,      setSyncing]      = useState(false);

  useEffect(() => {
    if (!isOnboarded()) { router.replace("/auth"); return; }
    setReady(true);

    Promise.all([getStats(), getPipelineStatus(), getScoreQueue(70, 3)])
      .then(([s, p, q]) => {
        setStats(s);
        setPipeline(p);
        setQueue(q.jobs ?? q);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // signOut/resetOnboarding now live inside the shared Sidebar component

  async function handleRunNow() {
    setRunning(true);
    try { await triggerPipeline(); } catch (_) {}
    setTimeout(async () => {
      try {
        const [s, p, q] = await Promise.all([getStats(), getPipelineStatus(), getScoreQueue(70, 3)]);
        setStats(s); setPipeline(p); setQueue(q.jobs ?? q);
      } catch (_) {}
      setRunning(false);
    }, 2000);
  }

  async function handleRunScorer() {
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;
    setScoring(true);
    setScorerResult(null);
    try {
      const result = await runScorer(sessionId);
      setScorerResult(result);
      if (!result.error) {
        const [s, q] = await Promise.all([getStats(), getScoreQueue(70, 3)]);
        setStats(s); setQueue(q.jobs ?? q);
      }
    } catch (e) {
      setScorerResult({ scored: 0, failed: 0, error: e.message || "Request failed" });
    }
    setScoring(false);
  }

  async function handleSyncProfile() {
    const session = getSession();
    const sessionId = getOrCreateSessionId();
    if (!session?.onboardingData) {
      alert("No onboarding data found — please complete onboarding first");
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, ...session.onboardingData }),
      });
      if (res.ok) {
        alert("Profile synced to backend successfully!");
      } else {
        alert("Sync failed — is the backend running?");
      }
    } catch (_) {
      alert("Sync failed — is the backend running?");
    }
    setSyncing(false);
  }

  if (!ready) return null;

  const v = (val) => error ? "--" : val ?? "--";

  return (
    <div className="db-shell">
      <Sidebar activePage="dashboard" counts={{ scoreQueue: stats?.score_queue }} />

      <main className="db-main">
        {/* Header */}
        <div className="db-header">
          <h1 className="db-greeting">{getGreeting()}</h1>
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
        <PipelineBanner pipeline={pipeline} loading={loading} onRun={handleRunNow} running={running}
          onScore={handleRunScorer} scoring={scoring} scorerResult={scorerResult}
          onSync={handleSyncProfile} syncing={syncing} />

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
