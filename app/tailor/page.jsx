"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import { getOrCreateSessionId } from "../../lib/session";
import {
  getJobs,
  tailorCV,
  getTailorHistory,
  getTailoredCV,
  getTailoredPdfUrl,
} from "../../lib/api";
import "./tailor.css";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ HELPERS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function scoreColor(score) {
  if (score >= 80) return "green";
  if (score >= 60) return "gray";
  return "red";
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ ANALYSIS TAB ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function AnalysisTab({ result }) {
  const hm = result?.hiring_manager_analysis || {};
  const rm = result?.relevance_map || {};

  return (
    <div>
      {/* Key priorities */}
      {hm.key_priorities?.length > 0 && (
        <div className="tl-card">
          <div className="tl-card-title">Key Priorities</div>
          <ul className="tl-list">
            {hm.key_priorities.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {/* Hidden expectations */}
      {hm.hidden_expectations?.length > 0 && (
        <div className="tl-card">
          <div className="tl-card-title">Hidden Expectations</div>
          <ul className="tl-list">
            {hm.hidden_expectations.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Success profile */}
      {hm.success_profile && (
        <div className="tl-card">
          <div className="tl-card-title">What Success Looks Like</div>
          <p className="tl-card-text">{hm.success_profile}</p>
        </div>
      )}

      {/* Yes pile factors */}
      {hm.yes_pile_factors?.length > 0 && (
        <div className="tl-card">
          <div className="tl-card-title">What Gets You in the Yes Pile</div>
          <div className="tl-tag-list">
            {hm.yes_pile_factors.map((f, i) => <span key={i} className="tl-tag green">{f}</span>)}
          </div>
        </div>
      )}

      {/* Worries */}
      {hm.worries?.length > 0 && (
        <div className="tl-card">
          <div className="tl-card-title">Hiring Manager Worries</div>
          <ul className="tl-list">
            {hm.worries.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Highlight first / must-have keywords */}
      {rm.highlight_first?.length > 0 && (
        <div className="tl-card">
          <div className="tl-card-title">Lead With These</div>
          <div className="tl-tag-list">
            {rm.highlight_first.map((s, i) => <span key={i} className="tl-tag">{s}</span>)}
          </div>
        </div>
      )}

      {rm.must_have_keywords?.length > 0 && (
        <div className="tl-card">
          <div className="tl-card-title">Must-Have Keywords</div>
          <div className="tl-tag-list">
            {rm.must_have_keywords.map((k, i) => <span key={i} className="tl-tag red">{k}</span>)}
          </div>
        </div>
      )}

      {rm.downplay?.length > 0 && (
        <div className="tl-card">
          <div className="tl-card-title">Downplay These</div>
          <div className="tl-tag-list">
            {rm.downplay.map((d, i) => <span key={i} className="tl-tag gray">{d}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ CV PREVIEW TAB ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CVPreviewTab({ cv }) {
  if (!cv) return null;

  const sectionOrder = cv.section_order || ["summary", "skills", "experience", "education", "projects"];

  return (
    <div className="tl-cv-preview">
      {/* Header */}
      {cv.name && <div className="tl-cv-name">{cv.name}</div>}
      {(cv.email || cv.phone || cv.linkedin || cv.github) && (
        <div className="tl-cv-contact">
          {[cv.email, cv.phone, cv.linkedin, cv.github].filter(Boolean).join("  |  ")}
        </div>
      )}

      {sectionOrder.map((section) => {
        if (section === "summary" && cv.summary) {
          return (
            <div key="summary">
              <div className="tl-cv-section">Professional Summary</div>
              <p className="tl-cv-summary">{cv.summary}</p>
            </div>
          );
        }

        if (section === "skills" && cv.skills?.categories?.length > 0) {
          return (
            <div key="skills">
              <div className="tl-cv-section">{cv.skills.section_title || "Technical Skills"}</div>
              {cv.skills.categories.map((cat, i) => (
                <div key={i} className="tl-skills-row">
                  <div className="tl-skills-cat">{cat.name}:</div>
                  <div className="tl-skills-val">{(cat.items || []).join(", ")}</div>
                </div>
              ))}
            </div>
          );
        }

        if (section === "experience" && cv.experience?.length > 0) {
          return (
            <div key="experience">
              <div className="tl-cv-section">Experience</div>
              {cv.experience.map((exp, i) => (
                <div key={i}>
                  <div className="tl-cv-role">{exp.title}</div>
                  <div className="tl-cv-meta">
                    <span>{exp.company}{exp.location ? `  ·  ${exp.location}` : ""}</span>
                    <span>{exp.dates}</span>
                  </div>
                  {(exp.bullets || []).map((b, j) => (
                    <div key={j} className="tl-cv-bullet">{b}</div>
                  ))}
                </div>
              ))}
            </div>
          );
        }

        if (section === "education" && cv.education?.length > 0) {
          return (
            <div key="education">
              <div className="tl-cv-section">Education</div>
              {cv.education.map((edu, i) => (
                <div key={i}>
                  <div className="tl-cv-role">{edu.degree}</div>
                  <div className="tl-cv-meta">
                    <span>{edu.institution}</span>
                    <span>{edu.dates}</span>
                  </div>
                  {edu.details && <div className="tl-cv-summary">{edu.details}</div>}
                </div>
              ))}
            </div>
          );
        }

        if (section === "projects" && cv.projects?.length > 0) {
          return (
            <div key="projects">
              <div className="tl-cv-section">Projects</div>
              {cv.projects.map((proj, i) => (
                <div key={i}>
                  <div className="tl-cv-proj-name">{proj.name}</div>
                  {proj.description && <div className="tl-cv-proj-desc">{proj.description}</div>}
                  {proj.tech?.length > 0 && (
                    <div className="tl-cv-proj-tech">Tech: {proj.tech.join(", ")}</div>
                  )}
                </div>
              ))}
            </div>
          );
        }

        if (section === "certifications" && cv.certifications?.length > 0) {
          return (
            <div key="certifications">
              <div className="tl-cv-section">Certifications</div>
              {cv.certifications.map((cert, i) => (
                <div key={i} className="tl-cv-bullet">{cert}</div>
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ MAIN PAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function TailorPage() {
  const sessionId = getOrCreateSessionId() || "";

  // Jobs list + search
  const [jobs, setJobs] = useState([]);
  const [jobSearch, setJobSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  // Result
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Tailoring CV…");
  const [error, setError] = useState(null);
  const [hasCV, setHasCV] = useState(true);

  /* Load jobs on mount */
  useEffect(() => {
    getJobs({ limit: 200, sort: "score", term: "fall2026" })
      .then((data) => setJobs(data.jobs || data || []))
      .catch(() => {});
  }, []);

  /* Load tailor history */
  const loadHistory = useCallback(() => {
    if (!sessionId) return;
    getTailorHistory(sessionId)
      .then((data) => setHistory(data || []))
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  /* Filter jobs by search */
  const filteredJobs = jobs.filter((j) => {
    const q = jobSearch.toLowerCase();
    return !q || j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q);
  });

  /* Select a history item */
  async function selectHistory(item) {
    setSelectedHistoryId(item.id);
    setSelectedJob(null);
    setError(null);
    setResult(null);
    setActiveTab("analysis");
    try {
      const data = await getTailoredCV(item.id);
      const content = typeof data.tailored_content === "string"
        ? JSON.parse(data.tailored_content)
        : data.tailored_content;
      setResult({ ...content, tailored_cv_id: item.id });
    } catch {
      setError("Failed to load tailored CV.");
    }
  }

  /* Run tailor */
  async function handleTailor() {
    if (!sessionId) {
      setError("Profile not synced. Please go to the Dashboard and click Sync Profile first.");
      return;
    }
    if (!selectedJob) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedHistoryId(null);

    const messages = [
      "Analyzing job posting…",
      "Mapping your experience…",
      "Thinking like the hiring manager…",
      "Reframing your CV…",
      "Writing cover letter…",
    ];
    let mi = 0;
    setLoadingText(messages[0]);
    const interval = setInterval(() => {
      mi = (mi + 1) % messages.length;
      setLoadingText(messages[mi]);
    }, 4000);

    try {
      const data = await tailorCV(selectedJob.id, sessionId);
      setResult(data);
      setActiveTab("analysis");
      loadHistory();
    } catch (err) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("no cv") || msg.toLowerCase().includes("cv not found")) {
        setHasCV(false);
        setError(null);
      } else {
        setError(msg || "Tailor failed. Please try again.");
      }
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  const pdfUrl = result?.tailored_cv_id ? getTailoredPdfUrl(result.tailored_cv_id) : null;

  /* ── Render ── */
  return (
    <div className="tl-shell">
      <Sidebar activePage="tailor" />

      <div className="tl-main">
        {/* Top bar */}
        <div className="tl-topbar">
          <div className="tl-topbar-title">CV Tailor</div>
          <div className="tl-topbar-sub">The Hiring Manager Whisperer — strategic CV reframing for each application</div>
        </div>

        {/* No-CV banner */}
        {!hasCV && (
          <div className="tl-no-cv-banner" style={{ margin: "12px 20px 0" }}>
            <span>⚠</span>
            <span>No CV uploaded. Go to <a href="/cv" style={{ color: "inherit", fontWeight: 600 }}>CV Manager</a> to upload your resume first.</span>
          </div>
        )}

        <div className="tl-body">
          {/* ── LEFT PANEL ── */}
          <div className="tl-left">

            {/* Job search */}
            <div className="tl-left-section">
              <div className="tl-section-label">Select a Job</div>
              <input
                className="tl-search-input"
                placeholder="Search jobs…"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
              />
            </div>

            {/* Job list */}
            <div className="tl-job-list">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className={"tl-job-item" + (selectedJob?.id === job.id ? " selected" : "")}
                  onClick={() => {
                    setSelectedJob(job);
                    setSelectedHistoryId(null);
                    setResult(null);
                    setError(null);
                    setHasCV(true);
                  }}
                >
                  <div className="tl-job-title">{job.title}</div>
                  <div className="tl-job-company">{job.company}</div>
                  {job.score > 0 && (
                    <div className="tl-job-score">Match: {Math.round(job.score)}%</div>
                  )}
                </div>
              ))}
              {filteredJobs.length === 0 && (
                <div style={{ padding: "20px 16px", fontSize: 13, color: "#a0a0a0" }}>No jobs found</div>
              )}
            </div>

            {/* Tailor history */}
            {history.length > 0 && (
              <div className="tl-left-section" style={{ flexShrink: 0 }}>
                <div className="tl-section-label">Tailor History</div>
              </div>
            )}
            {history.length > 0 && (
              <div className="tl-history-list">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={"tl-history-item" + (selectedHistoryId === item.id ? " selected" : "")}
                    onClick={() => selectHistory(item)}
                  >
                    <div className="tl-history-title">
                      {item.job_title || `Job #${item.job_id}`}
                    </div>
                    <div className="tl-history-date">{fmtDate(item.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="tl-right">

            {/* Action bar */}
            {(selectedJob || result) && (
              <div className="tl-action-bar">
                {selectedJob && (
                  <div className="tl-selected-job">
                    <div className="tl-selected-title">{selectedJob.title}</div>
                    <div className="tl-selected-company">{selectedJob.company}</div>
                  </div>
                )}
                {!selectedJob && result && (
                  <div className="tl-selected-job">
                    <div className="tl-selected-title">Tailored CV</div>
                    <div className="tl-selected-company">From history</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {selectedJob && (
                    <button
                      className="tl-btn-tailor"
                      onClick={handleTailor}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="tl-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                          Working…
                        </>
                      ) : (
                        <>✨ Tailor CV</>
                      )}
                    </button>
                  )}

                  {pdfUrl && (
                    <a
                      className="tl-btn-pdf"
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ↓ PDF
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Result area */}
            <div className="tl-result">
              {/* Loading state */}
              {loading && (
                <div className="tl-empty">
                  <div className="tl-spinner" />
                  <div className="tl-loading-text">{loadingText}</div>
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="tl-error">{error}</div>
              )}

              {/* Empty state — nothing selected */}
              {!loading && !error && !result && !selectedJob && (
                <div className="tl-empty">
                  <div style={{ fontSize: 32 }}>✨</div>
                  <div className="tl-empty-title">Hiring Manager Whisperer</div>
                  <div className="tl-empty-sub">Select a job from the left, then click "Tailor CV"</div>
                </div>
              )}

              {/* Empty state — job selected but not yet tailored */}
              {!loading && !error && !result && selectedJob && (
                <div className="tl-empty">
                  <div style={{ fontSize: 32 }}>🎯</div>
                  <div className="tl-empty-title">{selectedJob.title}</div>
                  <div className="tl-empty-sub">Click "Tailor CV" to reframe your resume for this role</div>
                </div>
              )}

              {/* Result tabs */}
              {!loading && result && (
                <>
                  <div className="tl-tabs">
                    {["analysis", "cv", "cover"].map((tab) => {
                      const labels = { analysis: "Analysis", cv: "CV Preview", cover: "Cover Letter" };
                      return (
                        <button
                          key={tab}
                          className={"tl-tab" + (activeTab === tab ? " active" : "")}
                          onClick={() => setActiveTab(tab)}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  {activeTab === "analysis" && (
                    <AnalysisTab result={result} />
                  )}

                  {activeTab === "cv" && (
                    <CVPreviewTab cv={result.tailored_cv} />
                  )}

                  {activeTab === "cover" && (
                    <div className="tl-cover-letter">
                      {result.cover_letter || "No cover letter generated."}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
