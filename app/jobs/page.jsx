"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
        if (isHeader) return <h4 key={i} className="ind-desc-header">{trimmed}</h4>;
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
  return <div className="ind-shimmer" style={{ width, height, borderRadius: 4, ...style }} />;
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
  const tier    = scoreTier(job.score);
  const date    = relativeDate(job.scraped_at || job.posted_at);
  const scored  = hasScore(job.score);
  const term    = extractTerm(job);
  const jobType = extractJobType(job);

  return (
    <div className={"ind-card" + (selected ? " selected" : "")} onClick={onClick}>
      <div className="ind-card-title">{job.title}</div>
      <div className="ind-card-company">
        {[job.company, job.location].filter(Boolean).join(" · ")}
      </div>
      {job.salary && <div className="ind-card-salary">{job.salary}</div>}
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
    if (longDesc) { setDescCached(true); setDescLoading(false); return; }
    setDescCached(false);
    setDescLoading(true);
    getJobDescription(job.id)
      .then(data => { setDesc(data.description || job.description || ""); setDescCached(!!data.cached); setDescLoading(false); })
      .catch(() => { setDescFailed(true); setDescLoading(false); });
  }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ind-detail">
      {onBack && <button className="ind-back-btn" onClick={onBack}>← Back to results</button>}
      <h1 className="ind-detail-title">{job.title}</h1>
      {(job.company || job.location) && (
        <p className="ind-detail-company">{[job.company, job.location].filter(Boolean).join(" · ")}</p>
      )}
      {job.salary && <p className="ind-detail-salary">{job.salary}</p>}
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
        <a href={job.url || "#"} target="_blank" rel="noopener noreferrer" className="ind-btn-view">
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
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="ind-fallback-link">View on original site →</a>
          )}
        </>
      ) : (
        <>
          <p className="ind-no-desc">No description available for this posting.</p>
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="ind-fallback-link">View on original site →</a>
          )}
        </>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ FILTER STATE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const DEFAULT_FILTERS = {
  sort: "newest",
  datePosted: "any",
  term: "fall2026",   // single value
  jobType: "all",     // "all" | "coop" | "intern" | "student"
  locations: [],
  domains: [],
  companies: [],
  minScore: 0,
};

const DOMAIN_KWS = {
  "ML & AI":              ["machine learning", " ml ", "artificial intelligence", "deep learning", "nlp", "computer vision", "llm", "generative"],
  "Data Engineering":     ["data engineer", "etl", "databricks", "spark", "kafka", "data platform"],
  "Software Development": ["software developer", "software engineer", "full stack", "frontend", "backend", "web developer", "mobile developer"],
  "Cloud & DevOps":       ["cloud", "devops", "kubernetes", "docker", "aws", "azure", "gcp", "infrastructure", "sre"],
  "Data Analytics":       ["data analyst", "analytics", "business intelligence", "tableau", "power bi", "looker"],
  "Business & Finance":   ["business analyst", "finance", "accounting", "financial analyst", "investment"],
};

function matchesDomain(job, domains) {
  if (!domains.length) return true;
  const text = ((job.title || "") + " " + (job.description || "")).toLowerCase();
  return domains.some(domain => (DOMAIN_KWS[domain] || []).some(kw => text.includes(kw)));
}

function filtersToParams(f) {
  const termMap = { fall2026: "fall2026", summer2026: "summer2026", winter2027: "2027", summer2027: "2027", any_upcoming: "all_upcoming" };
  return {
    sort: f.sort,
    term: termMap[f.term] || "fall2026",
    jobType: f.jobType,
    datePosted: f.datePosted,
    companies: f.companies,
    locations: f.locations,
  };
}

function countPanelFilters(f) {
  return (f.sort !== "newest" ? 1 : 0) + f.companies.length + (f.minScore > 0 ? 1 : 0);
}

function cloneFilters(f) {
  return { ...f, locations: [...f.locations], domains: [...f.domains], companies: [...f.companies] };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ ICONS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
    <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ QUICK FILTER CHIPS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const CHIP_LOCATIONS = ["Vancouver, BC", "Toronto, Ontario", "Remote", "Calgary, Alberta", "Ottawa, Ontario", "Montreal, Quebec", "Any location"];
const CHIP_DOMAINS   = ["ML & AI", "Data Engineering", "Software Development", "Cloud & DevOps", "Data Analytics", "Business & Finance"];

function QuickFilterChips({ filters, onChange, onAllFilters, panelHasActive }) {
  const [openDd, setOpenDd] = useState(null);
  const rowRef = useRef(null);

  useEffect(() => {
    function onMouseDown(e) {
      if (rowRef.current && !rowRef.current.contains(e.target)) setOpenDd(null);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function toggle(dd) { setOpenDd(prev => prev === dd ? null : dd); }

  function setVal(key, val) {
    onChange({ ...filters, [key]: val });
    setOpenDd(null);
  }

  function toggleArr(key, val) {
    const arr = filters[key];
    onChange({ ...filters, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] });
  }

  const DATE_LABELS = { "24h": "Past 24h", week: "Past week", month: "Past month" };
  const TERM_LABELS = { fall2026: "Fall 2026+", summer2026: "Summer 2026", winter2027: "Winter 2027", summer2027: "Summer 2027", any_upcoming: "Any upcoming" };
  const TYPE_LABELS = { all: "Co-op & Internship", coop: "Co-op only", intern: "Internship only", student: "Student positions" };

  const dateActive = filters.datePosted !== "any";
  const termActive = filters.term !== "fall2026";
  const typeActive = filters.jobType !== "all";
  const locActive  = filters.locations.length > 0;
  const domActive  = filters.domains.length > 0;

  const dateLabel = dateActive ? DATE_LABELS[filters.datePosted] : "Date posted";
  const termLabel = termActive ? `Term: ${TERM_LABELS[filters.term] || filters.term}` : "Term";
  const typeLabel = typeActive ? `Job type: ${TYPE_LABELS[filters.jobType] || filters.jobType}` : "Job type";
  const locLabel  = locActive
    ? (filters.locations.length === 1 ? `${filters.locations[0].split(",")[0]}` : `Location (${filters.locations.length})`)
    : "Location";
  const domLabel  = domActive
    ? (filters.domains.length === 1 ? filters.domains[0] : `Domain (${filters.domains.length})`)
    : "Domain";

  return (
    <div className="qf-row" ref={rowRef}>

      {/* Date posted */}
      <div className="qf-wrap">
        <button className={`qf-chip${dateActive ? " active" : ""}`} onClick={() => toggle("date")}>
          {dateLabel} <ChevronDown />
        </button>
        {openDd === "date" && (
          <div className="qf-dropdown">
            {[["any","Any time"],["24h","Past 24 hours"],["week","Past week"],["month","Past month"]].map(([val, label]) => (
              <div key={val} className={`qf-option${filters.datePosted === val ? " selected" : ""}`} onClick={() => setVal("datePosted", val)}>
                {label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Term */}
      <div className="qf-wrap">
        <button className={`qf-chip${termActive ? " active" : ""}`} onClick={() => toggle("term")}>
          {termLabel} <ChevronDown />
        </button>
        {openDd === "term" && (
          <div className="qf-dropdown">
            {[["fall2026","Fall 2026+"],["summer2026","Summer 2026"],["winter2027","Winter 2027"],["summer2027","Summer 2027"],["any_upcoming","Any upcoming"]].map(([val, label]) => (
              <div key={val} className={`qf-option${filters.term === val ? " selected" : ""}`} onClick={() => setVal("term", val)}>
                {label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job type */}
      <div className="qf-wrap">
        <button className={`qf-chip${typeActive ? " active" : ""}`} onClick={() => toggle("type")}>
          {typeLabel} <ChevronDown />
        </button>
        {openDd === "type" && (
          <div className="qf-dropdown">
            {[["all","Co-op & Internship"],["coop","Co-op only"],["intern","Internship only"],["student","Student positions"]].map(([val, label]) => (
              <div key={val} className={`qf-option${filters.jobType === val ? " selected" : ""}`} onClick={() => setVal("jobType", val)}>
                {label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Location */}
      <div className="qf-wrap">
        <button className={`qf-chip${locActive ? " active" : ""}`} onClick={() => toggle("loc")}>
          {locLabel} <ChevronDown />
        </button>
        {openDd === "loc" && (
          <div className="qf-dropdown">
            {CHIP_LOCATIONS.map(loc => (
              <div key={loc} className={`qf-option qf-option-check${filters.locations.includes(loc) ? " selected" : ""}`} onClick={() => toggleArr("locations", loc)}>
                <div className={`fp-checkbox${filters.locations.includes(loc) ? " checked" : ""}`}>
                  {filters.locations.includes(loc) && <CheckIcon />}
                </div>
                {loc}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Domain */}
      <div className="qf-wrap">
        <button className={`qf-chip${domActive ? " active" : ""}`} onClick={() => toggle("dom")}>
          {domLabel} <ChevronDown />
        </button>
        {openDd === "dom" && (
          <div className="qf-dropdown">
            {CHIP_DOMAINS.map(dom => (
              <div key={dom} className={`qf-option qf-option-check${filters.domains.includes(dom) ? " selected" : ""}`} onClick={() => toggleArr("domains", dom)}>
                <div className={`fp-checkbox${filters.domains.includes(dom) ? " checked" : ""}`}>
                  {filters.domains.includes(dom) && <CheckIcon />}
                </div>
                {dom}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All filters */}
      <button className={`qf-chip qf-all-filters-chip${panelHasActive ? " has-active" : ""}`} onClick={onAllFilters} style={{ marginLeft: "auto" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
        </svg>
        All filters
        {panelHasActive && <span className="fp-active-dot" />}
      </button>

    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ FILTER PANEL ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function FilterPanel({ draft, setDraft, onApply, onClose, onReset, liveCount, jobs }) {
  const [companySearch, setCompanySearch] = useState("");

  const topCompanies = useMemo(() => {
    const counts = {};
    jobs.forEach(j => { if (j.company) counts[j.company] = (counts[j.company] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name]) => name);
  }, [jobs]);

  const filteredCompanies = companySearch
    ? topCompanies.filter(c => c.toLowerCase().includes(companySearch.toLowerCase()))
    : topCompanies;

  function toggle(field, val) {
    const arr = draft[field];
    setDraft({ ...draft, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] });
  }

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      <div className="fp-overlay" onClick={onClose} />
      <div className="fp-panel">

        <div className="fp-header">
          <span className="fp-header-title">More filters</span>
          <button className="fp-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="fp-body">

          {/* Sort by */}
          <div className="fp-section">
            <div className="fp-section-title">Sort by</div>
            <div className="fp-radio-row">
              {[["newest", "Most recent"], ["score", "Highest score"]].map(([val, label]) => (
                <div key={val} className={`fp-radio-item${draft.sort === val ? " selected" : ""}`} onClick={() => setDraft({ ...draft, sort: val })}>
                  <div className={`fp-radio-circle${draft.sort === val ? " checked" : ""}`}>
                    {draft.sort === val && <div className="fp-radio-dot" />}
                  </div>
                  <span className="fp-option-label">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Min match score */}
          <div className="fp-section">
            <div className="fp-section-title">
              Min. match score: <span style={{ color: "#2557a7" }}>{draft.minScore > 0 ? `${draft.minScore}+` : "Any"}</span>
            </div>
            <input
              type="range"
              min={0} max={100} step={5}
              value={draft.minScore}
              onChange={e => setDraft({ ...draft, minScore: Number(e.target.value) })}
              className="fp-score-slider"
            />
            <div className="fp-slider-labels">
              <span>Any</span><span>50</span><span>100</span>
            </div>
          </div>

          {/* Company */}
          <div className="fp-section fp-section-last">
            <div className="fp-section-title">Company</div>
            <input
              type="text"
              className="fp-company-search"
              placeholder="Search companies..."
              value={companySearch}
              onChange={e => setCompanySearch(e.target.value)}
            />
            {filteredCompanies.length === 0 && <p className="fp-no-companies">No companies in current results</p>}
            {filteredCompanies.map(company => (
              <div key={company} className="fp-checkbox-item" onClick={() => toggle("companies", company)}>
                <div className={`fp-checkbox${draft.companies.includes(company) ? " checked" : ""}`}>
                  {draft.companies.includes(company) && <CheckIcon />}
                </div>
                <span className="fp-option-label">{company}</span>
              </div>
            ))}
          </div>

        </div>

        <div className="fp-footer">
          <button className="fp-btn-reset" onClick={onReset}>Reset</button>
          <button className="fp-btn-show" onClick={onApply}>
            Show {liveCount.toLocaleString()} results
          </button>
        </div>

      </div>
    </>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const PAGE_SIZE = 50;

export default function JobsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [jobs,         setJobs]         = useState([]);
  const [total,        setTotal]        = useState(0);
  const [selectedJob,  setSelectedJob]  = useState(null);
  const [filters,      setFilters]      = useState(cloneFilters(DEFAULT_FILTERS));
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [draftFilters, setDraftFilters] = useState(null);
  const [liveCount,    setLiveCount]    = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [offset,       setOffset]       = useState(0);
  const [mobileView,   setMobileView]   = useState("list");

  const listRef        = useRef(null);
  const detailRef      = useRef(null);
  const liveCountTimer = useRef(null);

  useEffect(() => {
    if (!isOnboarded()) { router.replace("/auth"); return; }
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Main data fetch — triggered by filters change
  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    setOffset(0);
    const p = filtersToParams(filters);
    getJobs({ ...p, limit: PAGE_SIZE, offset: 0 }).then(({ total: t, jobs: j }) => {
      setTotal(t);
      setLiveCount(t);
      setJobs(j);
      setSelectedJob(j[0] ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [ready, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live count while panel is open (only panel draft changes)
  useEffect(() => {
    if (!panelOpen || !draftFilters) return;
    if (liveCountTimer.current) clearTimeout(liveCountTimer.current);
    liveCountTimer.current = setTimeout(() => {
      const p = filtersToParams(draftFilters);
      getJobs({ ...p, limit: 1, offset: 0 }).then(({ total: t }) => setLiveCount(t)).catch(() => {});
    }, 350);
    return () => { if (liveCountTimer.current) clearTimeout(liveCountTimer.current); };
  }, [draftFilters, panelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    function onScroll() {
      if (loadingMore || jobs.length >= total) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 80) {
        const nextOffset = offset + PAGE_SIZE;
        setLoadingMore(true);
        setOffset(nextOffset);
        const p = filtersToParams(filters);
        getJobs({ ...p, limit: PAGE_SIZE, offset: nextOffset }).then(({ jobs: more }) => {
          setJobs(prev => [...prev, ...more]);
          setLoadingMore(false);
        }).catch(() => setLoadingMore(false));
      }
    }
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [jobs.length, total, loadingMore, offset, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  function openPanel() {
    setDraftFilters(cloneFilters(filters));
    setLiveCount(total);
    setPanelOpen(true);
  }

  function applyPanel() {
    setFilters(draftFilters);
    setPanelOpen(false);
  }

  function resetPanel() {
    setDraftFilters(cloneFilters(DEFAULT_FILTERS));
  }

  function removePill(key, val) {
    const next = cloneFilters(filters);
    if (key === "sort")       next.sort = "newest";
    else if (key === "datePosted") next.datePosted = "any";
    else if (key === "term")  next.term = "fall2026";
    else if (key === "jobType") next.jobType = "all";
    else if (key === "location") next.locations = next.locations.filter(l => l !== val);
    else if (key === "domain")   next.domains   = next.domains.filter(d => d !== val);
    else if (key === "company")  next.companies = next.companies.filter(c => c !== val);
    else if (key === "minScore") next.minScore = 0;
    setFilters(next);
  }

  function clearAll() {
    setFilters(cloneFilters(DEFAULT_FILTERS));
  }

  function handleJobClick(job) {
    setSelectedJob(job);
    setMobileView("detail");
    if (detailRef.current) detailRef.current.scrollTop = 0;
  }

  const panelActiveCount = countPanelFilters(filters);

  const pills = useMemo(() => {
    const result = [];
    const DATE_LABELS = { "24h": "Past 24h", week: "Past week", month: "Past month" };
    const TERM_LABELS = { summer2026: "Summer 2026", winter2027: "Winter 2027", summer2027: "Summer 2027", any_upcoming: "Any upcoming" };
    const TYPE_LABELS = { coop: "Co-op only", intern: "Internship only", student: "Student positions" };

    if (filters.datePosted !== "any")
      result.push({ key: "datePosted", val: filters.datePosted, label: DATE_LABELS[filters.datePosted] || filters.datePosted });
    if (filters.term !== "fall2026")
      result.push({ key: "term", val: filters.term, label: TERM_LABELS[filters.term] || filters.term });
    if (filters.jobType !== "all")
      result.push({ key: "jobType", val: filters.jobType, label: TYPE_LABELS[filters.jobType] || filters.jobType });
    filters.locations.forEach(l => result.push({ key: "location", val: l, label: l }));
    filters.domains.forEach(d => result.push({ key: "domain", val: d, label: d }));
    filters.companies.forEach(c => result.push({ key: "company", val: c, label: c }));
    if (filters.sort !== "newest")
      result.push({ key: "sort", val: filters.sort, label: filters.sort === "score" ? "Highest score" : filters.sort });
    if (filters.minScore > 0)
      result.push({ key: "minScore", val: filters.minScore, label: `Score ≥ ${filters.minScore}` });
    return result;
  }, [filters]);

  // Client-side post-filters (domain keywords + min score)
  const displayedJobs = useMemo(() => {
    let result = filters.domains.length ? jobs.filter(j => matchesDomain(j, filters.domains)) : jobs;
    if (filters.minScore > 0) result = result.filter(j => hasScore(j.score) && j.score >= filters.minScore);
    return result;
  }, [jobs, filters.domains, filters.minScore]);

  const displayCount = (filters.domains.length || filters.minScore > 0) ? displayedJobs.length : total;

  if (!ready) return null;

  return (
    <div className="ind-shell">
      <Sidebar activePage="jobs" />

      {panelOpen && draftFilters && (
        <FilterPanel
          draft={draftFilters}
          setDraft={setDraftFilters}
          onApply={applyPanel}
          onClose={() => setPanelOpen(false)}
          onReset={resetPanel}
          liveCount={liveCount}
          jobs={jobs}
        />
      )}

      <div className="ind-main">
        <div className={"ind-left" + (mobileView === "detail" ? " ind-hidden-mobile" : "")}>

          {/* Title row */}
          <div className="ind-topbar">
            <div className="ind-topbar-row">
              <span className="ind-topbar-title">Jobs</span>
              <span className="ind-count-badge">{total.toLocaleString()} matching</span>
            </div>
          </div>

          {/* Row 1 — Quick filter chips */}
          <QuickFilterChips
            filters={filters}
            onChange={setFilters}
            onAllFilters={openPanel}
            panelHasActive={panelActiveCount > 0}
          />

          {/* Row 2 — Results count + active pills */}
          <div className="qf-results-row">
            <span className="qf-results-count">
              {loading ? "Loading…" : `${displayCount.toLocaleString()} results`}
            </span>
            {pills.map((pill, i) => (
              <span key={i} className="fp-pill">
                {pill.label}
                <button className="fp-pill-x" onClick={() => removePill(pill.key, pill.val)}>×</button>
              </span>
            ))}
            {pills.length > 0 && (
              <button className="fp-clear-all" onClick={clearAll}>Clear all</button>
            )}
          </div>

          {/* Job list */}
          <div className="ind-list" ref={listRef}>
            {loading
              ? Array.from({ length: 12 }, (_, i) => <ShimmerCard key={i} />)
              : displayedJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    selected={selectedJob?.id === job.id}
                    onClick={() => handleJobClick(job)}
                  />
                ))
            }
            {loadingMore && <div className="ind-load-more">Loading more…</div>}
          </div>
        </div>

        {/* Right panel */}
        <div className={"ind-right" + (mobileView === "list" ? " ind-hidden-mobile" : "")} ref={detailRef}>
          {selectedJob
            ? <JobDetail job={selectedJob} onBack={mobileView === "detail" ? () => setMobileView("list") : null} />
            : <EmptyState />
          }
        </div>
      </div>
    </div>
  );
}
