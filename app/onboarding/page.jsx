"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./onboarding.css";

const TOTAL_STEPS = 6;

const ROLES = [
  "ML Engineering", "Data Engineering", "Data Analyst",
  "Cloud Engineering", "DevOps", "Software Development",
  "Backend Engineering", "Data Science", "AI/LLM Engineering",
  "Solutions Architecture", "Business Intelligence",
  "Product Analytics", "Other",
];

const LOCATIONS = [
  "Vancouver", "Toronto", "Calgary", "Edmonton", "Ottawa",
  "Montreal", "Waterloo", "Remote (Canada)", "Open to anything",
];

const START_DATES = [
  "August 2026", "September 2026", "January 2027", "May 2027",
];

const DURATIONS = ["4 months", "8 months", "12 months", "Flexible"];

const MODES = [
  {
    id: "auto",
    icon: "⚡",
    iconBg: "#f59e0b",
    name: "Auto — trust the machine",
    desc: "Scrape, score, tailor and apply fully automated. Wake up to your morning digest.",
  },
  {
    id: "balanced",
    icon: "⚖",
    iconBg: "#4361ee",
    name: "Balanced — review before apply",
    desc: "Jobs scored automatically. You approve each application before it goes out.",
  },
  {
    id: "power",
    icon: "🎛",
    iconBg: "#7c3aed",
    name: "Power — full control",
    desc: "Every step is manual. Full visibility into everything the agent does.",
  },
];

/* ── Upload icon SVG ─────────────────────────────────────────────────────── */
function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

/* ── Animated checkmark ──────────────────────────────────────────────────── */
function Checkmark() {
  return (
    <svg className="check-svg" viewBox="0 0 52 52">
      <circle className="check-circle" cx="26" cy="26" r="25" fill="none" />
      <path className="check-mark" fill="none" d="M14 27l8 8 16-16" />
    </svg>
  );
}

/* ── Step 1: Name ────────────────────────────────────────────────────────── */
function StepName({ value, onChange }) {
  return (
    <div>
      <input
        className="ob-input"
        type="text"
        placeholder="Jazmyn Singh"
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus
      />
    </div>
  );
}

/* ── Step 2: CV Upload ───────────────────────────────────────────────────── */
function StepCV({ files, setFiles }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function addFiles(incoming) {
    const remaining = 5 - files.length;
    const toAdd = Array.from(incoming).slice(0, remaining).map(f => ({
      id: `${f.name}-${f.size}-${Date.now()}`,
      name: f.name,
      size: f.size,
      tag: "",
    }));
    setFiles(prev => [...prev, ...toAdd]);
  }

  function removeFile(id) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  function updateTag(id, tag) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, tag } : f));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (files.length >= 5) return;
    addFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        className={`ob-upload-area${dragging ? " dragging" : ""}${files.length >= 5 ? " disabled" : ""}`}
        onClick={() => files.length < 5 && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <UploadIcon />
        <p className="ob-upload-label">Drop your CV here or click to upload</p>
        <p className="ob-upload-hint">.pdf or .docx · max 5MB per file</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        multiple
        className="ob-file-input"
        onChange={e => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {files.length > 0 && (
        <div className="ob-file-list">
          {files.map(f => (
            <div key={f.id} className="ob-file-row">
              <span className="ob-file-icon">📄</span>
              <span className="ob-file-name">{f.name}</span>
              <span className="ob-file-size">{formatSize(f.size)}</span>
              <input
                className="ob-tag-input"
                type="text"
                placeholder="e.g. Data, ML, General"
                value={f.tag}
                onChange={e => updateTag(f.id, e.target.value)}
              />
              <button className="ob-remove-btn" onClick={() => removeFile(f.id)} type="button">×</button>
            </div>
          ))}
        </div>
      )}
      <p className="ob-file-count">{files.length} / 5 CVs uploaded</p>
    </div>
  );
}

/* ── Step 3: Target Roles ────────────────────────────────────────────────── */
function StepRoles({ selected, setSelected, customRole, setCustomRole }) {
  function toggle(role) {
    setSelected(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  return (
    <div>
      <div className="ob-chips">
        {ROLES.map(role => (
          <button
            key={role}
            type="button"
            className={`ob-chip${selected.includes(role) ? " selected" : ""}`}
            onClick={() => toggle(role)}
          >
            {role}
          </button>
        ))}
      </div>
      {selected.includes("Other") && (
        <input
          className="ob-input"
          style={{ marginTop: 12 }}
          type="text"
          placeholder="Add custom role..."
          value={customRole}
          onChange={e => setCustomRole(e.target.value)}
        />
      )}
      <p className="ob-selection-count">{selected.length} role{selected.length !== 1 ? "s" : ""} selected</p>
    </div>
  );
}

/* ── Step 4: Locations ───────────────────────────────────────────────────── */
function StepLocations({ selected, setSelected }) {
  function toggle(loc) {
    setSelected(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  }

  return (
    <div>
      <div className="ob-chips">
        {LOCATIONS.map(loc => (
          <button
            key={loc}
            type="button"
            className={`ob-chip${selected.includes(loc) ? " selected" : ""}`}
            onClick={() => toggle(loc)}
          >
            {loc}
          </button>
        ))}
      </div>
      <p className="ob-selection-count">{selected.length} location{selected.length !== 1 ? "s" : ""} selected</p>
    </div>
  );
}

/* ── Step 5: Dates ───────────────────────────────────────────────────────── */
function StepDates({ startDate, setStartDate, duration, setDuration }) {
  return (
    <div>
      <label className="ob-field-label">Preferred start date</label>
      <select
        className="ob-input ob-select"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
      >
        {START_DATES.map(d => <option key={d}>{d}</option>)}
      </select>

      <div style={{ marginTop: 20 }}>
        <label className="ob-field-label">Co-op duration</label>
        <div className="ob-chips" style={{ marginTop: 8 }}>
          {DURATIONS.map(d => (
            <button
              key={d}
              type="button"
              className={`ob-chip${duration === d ? " selected" : ""}`}
              onClick={() => setDuration(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Step 6: Automation Mode ─────────────────────────────────────────────── */
function StepMode({ mode, setMode }) {
  return (
    <div className="ob-mode-list">
      {MODES.map(m => (
        <button
          key={m.id}
          type="button"
          className={`ob-mode-card${mode === m.id ? " selected" : ""}`}
          onClick={() => setMode(m.id)}
        >
          <span className="ob-mode-icon" style={{ background: m.iconBg }}>
            {m.icon}
          </span>
          <span className="ob-mode-text">
            <span className="ob-mode-name">{m.name}</span>
            <span className="ob-mode-desc">{m.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Step meta ───────────────────────────────────────────────────────────── */
const STEP_META = [
  { label: "STEP 1 — LET'S START",    title: "What's your name?",              sub: "We'll use this to personalize your experience." },
  { label: "STEP 2 — YOUR CV",         title: "Upload your CV(s)",              sub: "Upload one or more CVs. Tag each one so we know when to use it — we'll pick the best match per job." },
  { label: "STEP 3 — TARGET ROLES",    title: "What roles are you targeting?",  sub: "Select all that apply. These help us score jobs more accurately against your profile." },
  { label: "STEP 4 — LOCATION",        title: "Where do you want to work?",     sub: "Select all locations you're open to." },
  { label: "STEP 5 — AVAILABILITY",    title: "When are you available?",        sub: "This helps us filter for the right start dates." },
  { label: "STEP 6 — AUTOMATION",      title: "How hands-on do you want to be?", sub: "You can change this anytime from your dashboard." },
];

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep]         = useState(1);
  const [direction, setDirection] = useState("right");
  const [animKey, setAnimKey]   = useState(0);
  const [done, setDone]         = useState(false);

  // Form state
  const [name, setName]               = useState("");
  const [cvFiles, setCvFiles]         = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [customRole, setCustomRole]   = useState("");
  const [selectedLocs, setSelectedLocs] = useState([]);
  const [startDate, setStartDate]     = useState("August 2026");
  const [duration, setDuration]       = useState("");
  const [mode, setMode]               = useState("balanced");

  function goNext() {
    if (step < TOTAL_STEPS) {
      setDirection("right");
      setAnimKey(k => k + 1);
      setStep(s => s + 1);
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2500);
    }
  }

  function goBack() {
    if (step > 1) {
      setDirection("left");
      setAnimKey(k => k + 1);
      setStep(s => s - 1);
    }
  }

  const meta = STEP_META[step - 1];
  const progress = (step / TOTAL_STEPS) * 100;

  if (done) {
    return (
      <div className="ob-page">
        <div className="ob-card ob-success-card">
          <Checkmark />
          <h2 className="ob-success-title">You&apos;re all set!</h2>
          <p className="ob-success-sub">Your agent is running its first job search.</p>
          <p className="ob-success-note">We&apos;ll notify you when results are ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ob-page">
      <div className="ob-card">
        {/* Progress */}
        <div className="ob-progress-header">
          <span className="ob-step-counter">Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="ob-progress-track">
          <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Step content */}
        <div
          key={animKey}
          className={`ob-step-content ob-slide-${direction}`}
        >
          <p className="ob-step-label">{meta.label}</p>
          <h2 className="ob-step-title">{meta.title}</h2>
          <p className="ob-step-sub">{meta.sub}</p>

          {step === 1 && <StepName value={name} onChange={setName} />}
          {step === 2 && <StepCV files={cvFiles} setFiles={setCvFiles} />}
          {step === 3 && (
            <StepRoles
              selected={selectedRoles}
              setSelected={setSelectedRoles}
              customRole={customRole}
              setCustomRole={setCustomRole}
            />
          )}
          {step === 4 && <StepLocations selected={selectedLocs} setSelected={setSelectedLocs} />}
          {step === 5 && (
            <StepDates
              startDate={startDate}
              setStartDate={setStartDate}
              duration={duration}
              setDuration={setDuration}
            />
          )}
          {step === 6 && <StepMode mode={mode} setMode={setMode} />}
        </div>

        {/* Navigation */}
        <div className="ob-nav">
          <div className="ob-nav-back">
            {step > 1 && (
              <button className="ob-btn-back" type="button" onClick={goBack}>
                Back
              </button>
            )}
          </div>

          <div className="ob-dots">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span
                key={i}
                className={`ob-dot${i + 1 === step ? " active" : ""}`}
              />
            ))}
          </div>

          <button className="ob-btn-next" type="button" onClick={goNext}>
            {step === TOTAL_STEPS ? "Start job search →" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
