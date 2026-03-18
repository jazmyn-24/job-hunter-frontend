"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./onboarding.css";
import { saveSession, getSession, isOnboarded } from "../../lib/session";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ DATA ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const FIELDS = [
  { id: "tech",   name: "Technology",                desc: "Software, ML, Cloud, DevOps",             color: "#4361ee" },
  { id: "data",   name: "Data & Analytics",           desc: "Data Engineering, BI, Analytics",         color: "#7c3aed" },
  { id: "biz",    name: "Business & Finance",         desc: "Accounting, Finance, Management",         color: "#0891b2" },
  { id: "mkt",    name: "Marketing & Communications", desc: "Marketing, PR, Content, Social",          color: "#db2777" },
  { id: "eng",    name: "Engineering",                desc: "Mechanical, Civil, Electrical, Chemical", color: "#d97706" },
  { id: "health", name: "Health Sciences",            desc: "Nursing, Pharmacy, Kinesiology",          color: "#059669" },
  { id: "design", name: "Architecture & Design",      desc: "UX/UI, Architecture, Interior Design",    color: "#dc2626" },
  { id: "law",    name: "Law & Policy",               desc: "Legal, Policy, Compliance, Government",   color: "#7c3aed" },
  { id: "sci",    name: "Science & Research",         desc: "Biology, Chemistry, Physics, Research",   color: "#0284c7" },
  { id: "other",  name: "Other",                      desc: "Something else entirely",                 color: "#6b7280" },
];

const ROLES = {
  tech:   ["ML Engineering","Data Engineering","Software Development","Backend Engineering","Frontend Engineering","Full Stack","DevOps","Cloud Engineering","Site Reliability Engineering","Platform Engineering","Mobile Development","AI/LLM Engineering","Solutions Architecture","Cybersecurity","QA Engineering","Technical Program Management","Embedded Systems"],
  data:   ["Data Analyst","Business Intelligence","Data Engineering","Analytics Engineering","Data Science","Product Analytics","Quantitative Analysis","Reporting Analyst","Database Admin","Research Analyst","Statistical Analyst"],
  biz:    ["Financial Analyst","Accounting","Audit","Tax","Business Analyst","Operations","Supply Chain","Project Management","Strategy","Consulting","Investment Banking","Risk Management","Compliance","Human Resources","Administrative"],
  mkt:    ["Digital Marketing","Content Marketing","Social Media","SEO/SEM","Public Relations","Copywriting","Brand Management","Market Research","Communications","Event Planning","Email Marketing","Growth Marketing"],
  eng:    ["Mechanical Engineering","Civil Engineering","Electrical Engineering","Chemical Engineering","Structural Engineering","Environmental Engineering","Manufacturing","Quality Assurance","Product Design","Materials Engineering","Aerospace","Biomedical Engineering"],
  health: ["Nursing","Pharmacy","Kinesiology","Health Administration","Medical Research","Public Health","Nutrition","Occupational Therapy","Physiotherapy","Lab Technician","Healthcare IT","Clinical Research"],
  design: ["UX Design","UI Design","Product Design","Architecture","Interior Design","Landscape Architecture","Industrial Design","Graphic Design","Motion Design","Design Research","Visual Design"],
  law:    ["Legal Research","Policy Analysis","Compliance","Government Relations","Paralegal","Contract Management","Regulatory Affairs","Public Policy","Advocacy","International Relations"],
  sci:    ["Biology Research","Chemistry","Physics","Environmental Science","Geology","Materials Science","Laboratory Technician","Research Assistant","Clinical Research","Data Collection","Field Research"],
};
ROLES.other = [...new Set(Object.values(ROLES).flat())];

const SKILLS = {
  tech: {
    "Languages":        ["Python","JavaScript","TypeScript","Java","C++","C#","Go","Rust","R","Scala","Swift","Kotlin","SQL","Bash","MATLAB"],
    "Data & ML":        ["TensorFlow","PyTorch","Scikit-learn","Pandas","NumPy","Spark","Kafka","dbt","Airflow","MLflow","LangChain","RAG","Computer Vision","NLP","Machine Learning","Deep Learning"],
    "Cloud & DevOps":   ["AWS","Azure","GCP","Docker","Kubernetes","Terraform","CI/CD","GitHub Actions","Jenkins","Linux","Prometheus","Grafana","Ansible","Infrastructure as Code"],
    "Databases":        ["PostgreSQL","MySQL","MongoDB","Redis","Snowflake","BigQuery","DynamoDB","Elasticsearch","Cassandra"],
    "Web & Frameworks": ["React","Next.js","Node.js","FastAPI","Django","Flask","Spring Boot","GraphQL","REST APIs","Microservices","HTML/CSS","Vue.js","Angular"],
  },
  data: {
    "Analytics Tools":  ["Excel (Advanced)","Tableau","Power BI","SQL","Python","R","dbt","Looker","Metabase","Databricks"],
    "Data Engineering": ["Spark","Kafka","Airflow","dbt","Snowflake","BigQuery","Redshift","ETL","Data Pipelines","Data Modelling"],
    "Statistics":       ["Statistical Analysis","A/B Testing","Hypothesis Testing","Regression","Forecasting","Predictive Modelling"],
  },
  biz: {
    "Software Tools":   ["Excel (Advanced)","PowerPoint","Word","Google Sheets","Tableau","Power BI","Salesforce","SAP","QuickBooks","Bloomberg Terminal","SQL"],
    "Finance":          ["Financial Modelling","DCF Analysis","Valuation","Financial Reporting","Budgeting","Forecasting","Risk Analysis","Portfolio Management","CFA Knowledge"],
    "Business":         ["Business Analysis","Process Improvement","Agile","Scrum","Project Management","JIRA","Confluence","Stakeholder Management","Requirements Gathering","Change Management","Six Sigma"],
  },
  mkt: {
    "Digital":          ["SEO","SEM","Google Analytics","Google Ads","Meta Ads","HubSpot","Mailchimp","Hootsuite","Klaviyo"],
    "Content":          ["Copywriting","Content Strategy","Blogging","Video Production","Adobe Creative Suite","Canva","Photography","Podcast Production"],
    "Strategy":         ["Market Research","Competitor Analysis","Brand Strategy","Campaign Management","A/B Testing","CRM Management","Email Marketing","Influencer Marketing"],
  },
  eng: {
    "Software":         ["AutoCAD","SolidWorks","MATLAB","ANSYS","Revit","Civil 3D","Inventor","SketchUp","CATIA","Rhino"],
    "Technical":        ["Finite Element Analysis","Structural Analysis","Thermodynamics","Fluid Mechanics","Circuit Design","PCB Design","PLC Programming","GD&T","Technical Drawing","ISO Standards"],
  },
  health: {
    "Clinical":         ["Patient Care","Clinical Assessment","Medication Administration","IV Therapy","Wound Care","Vital Signs Monitoring","EMR/EHR Systems","HIPAA"],
    "Lab & Research":   ["PCR","Cell Culture","Microscopy","HPLC","Spectroscopy","Pipetting","Sample Processing","Lab Safety","GLP","GMP"],
    "Research Tools":   ["SPSS","REDCap","Clinical Trials","Literature Review","IRB Protocols","Data Collection","Systematic Review","Evidence-Based Practice"],
  },
  design: {
    "Software":         ["Figma","Sketch","Adobe XD","InVision","AutoCAD","Revit","SketchUp","Rhino","Illustrator","Photoshop","InDesign","After Effects","Blender"],
    "Skills":           ["User Research","Wireframing","Prototyping","Usability Testing","Design Systems","Typography","Spatial Design","3D Modelling","Rendering"],
  },
  law: {
    "Legal":            ["Legal Research","Contract Drafting","Due Diligence","Westlaw","LexisNexis","Case Analysis","Legal Writing","Regulatory Compliance","Corporate Law","Litigation Support"],
    "Policy":           ["Policy Analysis","Legislative Research","Stakeholder Engagement","Report Writing","Government Relations","Public Consultation","FOIA Requests"],
  },
  sci: {
    "Lab":              ["PCR","Cell Culture","Gel Electrophoresis","Microscopy","Spectroscopy","Titration","Centrifugation","HPLC","Mass Spectrometry","Lab Safety","GLP"],
    "Analysis":         ["R","Python","SPSS","GraphPad Prism","Literature Review","Statistical Analysis","Experimental Design","Scientific Writing","Grant Writing"],
  },
};

const UNIVERSAL_SKILLS = {
  "Communication":      ["Technical Writing","Presentation Skills","Public Speaking","Documentation","Report Writing","Client Communication","Stakeholder Management"],
  "Soft Skills":        ["Leadership","Teamwork","Problem Solving","Critical Thinking","Time Management","Adaptability","Attention to Detail","Cross-functional Collaboration","Mentoring","Analytical Thinking"],
  "Languages (spoken)": ["English","French","Mandarin","Hindi","Spanish","Arabic","Punjabi","Urdu","Portuguese","Japanese","Korean","German","Italian","Tagalog","Tamil","Bengali"],
};

function getSkillsForField(fields) {
  const arr = Array.isArray(fields) ? fields : (fields ? [fields] : []);
  const nonOther = arr.filter(id => id !== "other");
  if (arr.length === 0 || arr.every(id => id === "other")) {
    const all = {};
    Object.values(SKILLS).forEach(groups =>
      Object.entries(groups).forEach(([g, skills]) => {
        all[g] = [...new Set([...(all[g] || []), ...skills])];
      })
    );
    return { ...all, ...UNIVERSAL_SKILLS };
  }
  const merged = {};
  nonOther.forEach(id => {
    if (SKILLS[id]) {
      Object.entries(SKILLS[id]).forEach(([g, skills]) => {
        merged[g] = [...new Set([...(merged[g] || []), ...skills])];
      });
    }
  });
  if (arr.includes("other")) {
    Object.values(SKILLS).forEach(groups =>
      Object.entries(groups).forEach(([g, skills]) => {
        merged[g] = [...new Set([...(merged[g] || []), ...skills])];
      })
    );
  }
  return { ...merged, ...UNIVERSAL_SKILLS };
}

const LOCATIONS   = ["Vancouver","Toronto","Calgary","Edmonton","Ottawa","Montreal","Waterloo","Remote (Canada)","Open to anything"];
const START_DATES = ["January 2026","May 2026","August 2026","September 2026","January 2027","May 2027","Flexible"];
const DURATIONS   = ["4 months","8 months","12 months","Flexible"];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ SHARED ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Chip({ label, selected, onClick }) {
  return (
    <button type="button" className={"ob-chip" + (selected ? " selected" : "")} onClick={onClick}>
      {label}
    </button>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={"ob-toggle" + (checked ? " on" : "")} onClick={() => onChange(!checked)}>
      <span className="ob-toggle-circle" />
    </button>
  );
}

function StepHeader({ label, headline, sub }) {
  return (
    <div className="ob-step-header">
      <div className="ob-step-label">{label}</div>
      <h2 className="ob-step-headline">{headline}</h2>
      {sub && <p className="ob-step-sub">{sub}</p>}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ SKILLS SEARCH ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function SkillsSearch({ fields, selected, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const wrapRef           = useRef(null);

  const groups  = getSkillsForField(fields);
  const allFlat = Object.values(groups).flat();

  const filtered = query.trim()
    ? Object.fromEntries(
        Object.entries(groups)
          .map(([g, s]) => [g, s.filter(sk => sk.toLowerCase().includes(query.toLowerCase()))])
          .filter(([, s]) => s.length > 0)
      )
    : groups;

  const isCustom = query.trim() &&
    !allFlat.some(s => s.toLowerCase() === query.trim().toLowerCase()) &&
    !selected.includes(query.trim());

  function toggle(skill) {
    onChange(selected.includes(skill) ? selected.filter(s => s !== skill) : [...selected, skill]);
  }

  function addCustom() {
    const t = query.trim();
    if (t && !selected.includes(t)) onChange([...selected, t]);
    setQuery("");
    setOpen(false);
  }

  useEffect(() => {
    function outside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <div className="ob-skills-wrap" ref={wrapRef}>
      {selected.length > 0 && (
        <div className="ob-skill-chips">
          {selected.map(s => (
            <span key={s} className="ob-skill-chip">
              {s}
              <button type="button" onClick={() => onChange(selected.filter(x => x !== s))}>x</button>
            </span>
          ))}
        </div>
      )}
      <div className="ob-skills-input-wrap">
        <input
          className="ob-input"
          placeholder="Search or type a skill..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <div className="ob-skills-dropdown">
            {Object.entries(filtered).map(([group, skills]) => (
              <div key={group}>
                <div className="ob-skills-group">{group}</div>
                {skills.map(skill => (
                  <div
                    key={skill}
                    className={"ob-skills-item" + (selected.includes(skill) ? " selected" : "")}
                    onMouseDown={e => { e.preventDefault(); toggle(skill); }}
                  >
                    <span>{skill}</span>
                    {selected.includes(skill) && <span className="ob-skills-check">v</span>}
                  </div>
                ))}
              </div>
            ))}
            {isCustom && (
              <div className="ob-skills-item ob-skills-custom" onMouseDown={e => { e.preventDefault(); addCustom(); }}>
                + Add "{query.trim()}"
              </div>
            )}
            {Object.keys(filtered).length === 0 && !isCustom && (
              <div className="ob-skills-empty">No results</div>
            )}
          </div>
        )}
      </div>
      <div className="ob-count">{selected.length} skills selected</div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ STEPS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Step1({ data, onChange }) {
  return (
    <div>
      <StepHeader label="STEP 1 — LET'S START" headline="What's your name?" sub="We'll use this to personalize your experience." />
      <input className="ob-input" placeholder="Jazmyn Singh" value={data.name} onChange={e => onChange(e.target.value)} autoFocus />
    </div>
  );
}

function Step2({ data, onChange }) {
  function toggle(id) {
    onChange(data.fields.includes(id) ? data.fields.filter(f => f !== id) : [...data.fields, id]);
  }
  return (
    <div>
      <StepHeader label="STEP 2 — TARGET AREAS" headline="What areas are you looking to work in?" sub="Select all that apply — you can target multiple areas." />
      <div className="ob-field-grid">
        {FIELDS.map(f => (
          <button key={f.id} type="button" className={"ob-field-card" + (data.fields.includes(f.id) ? " selected" : "")} onClick={() => toggle(f.id)}>
            <span className="ob-field-dot" style={{ background: f.color }} />
            <span className="ob-field-text">
              <span className="ob-field-name">{f.name}</span>
              <span className="ob-field-desc">{f.desc}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="ob-count">{data.fields.length} {data.fields.length === 1 ? "area" : "areas"} selected</div>
    </div>
  );
}

function Step3({ data, onChange }) {
  const [custom, setCustom] = useState("");
  const fields = data.fields.length > 0 ? data.fields : ["other"];
  const hasOther = fields.includes("other");

  // Build grouped roles: [{fieldId, fieldName, roles[]}]
  const groups = fields
    .filter(id => id !== "other")
    .map(id => {
      const f = FIELDS.find(f => f.id === id);
      return { id, name: f ? f.name : id, roles: ROLES[id] || [] };
    });

  // "other" = all roles not already shown
  const shownRoles = new Set(groups.flatMap(g => g.roles));
  const otherRoles = ROLES.other.filter(r => !shownRoles.has(r));
  if (hasOther && fields.length === 1) {
    groups.push({ id: "other", name: "Other", roles: ROLES.other });
  } else if (hasOther && otherRoles.length > 0) {
    groups.push({ id: "other", name: "Other", roles: otherRoles });
  }

  function toggle(r) {
    onChange(data.roles.includes(r) ? data.roles.filter(x => x !== r) : [...data.roles, r]);
  }

  function addCustom() {
    const r = custom.trim();
    if (r && !data.roles.includes(r)) { onChange([...data.roles, r]); setCustom(""); }
  }

  return (
    <div>
      <StepHeader label="STEP 3 — TARGET ROLES" headline="What roles are you targeting?" sub="Select all that apply." />
      {groups.map(g => (
        <div key={g.id} className="ob-role-group">
          {fields.length > 1 && <div className="ob-role-group-label">{g.name.toUpperCase()}</div>}
          <div className="ob-chips-wrap">
            {g.roles.map(r => <Chip key={r} label={r} selected={data.roles.includes(r)} onClick={() => toggle(r)} />)}
          </div>
        </div>
      ))}
      {hasOther && (
        <div className="ob-custom-role">
          <input className="ob-input" placeholder="Add a custom role..." value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustom()} />
          <button type="button" className="ob-add-btn" onClick={addCustom}>Add</button>
        </div>
      )}
      <div className="ob-count">{data.roles.length} roles selected</div>
    </div>
  );
}

function Step4({ data, onChange }) {
  return (
    <div>
      <StepHeader label="STEP 4 — SKILLS" headline="What are your key skills?" sub="Search and add skills — technical and non-technical." />
      <SkillsSearch fields={data.fields} selected={data.skills} onChange={onChange} />
    </div>
  );
}

function Step5({ data, onChange }) {
  const inputRef = useRef(null);

  function handleFiles(fileList) {
    const valid = Array.from(fileList).filter(f =>
      f.size <= 5 * 1024 * 1024 && (f.name.endsWith(".pdf") || f.name.endsWith(".docx"))
    );
    onChange([...data.cvFiles, ...valid.map(f => ({ file: f, tag: "" }))].slice(0, 5));
  }

  return (
    <div>
      <StepHeader label="STEP 5 — YOUR CV" headline="Upload your CV(s)" sub="Upload one or more CVs. Tag each one so we know when to use it — we'll pick the best match per job." />
      <div
        className="ob-upload-area"
        onClick={() => inputRef.current && inputRef.current.click()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={e => e.preventDefault()}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="ob-upload-label">Drop your CV here or click to upload</p>
        <p className="ob-upload-sub">.pdf or .docx · max 5MB · up to 5 CVs</p>
        <input ref={inputRef} type="file" accept=".pdf,.docx" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
      </div>
      {data.cvFiles.length > 0 && (
        <div className="ob-cv-list">
          {data.cvFiles.map((cv, i) => (
            <div key={i} className="ob-cv-row">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="ob-cv-name">{cv.file.name}</span>
              <span className="ob-cv-size">{(cv.file.size / 1024).toFixed(0)}KB</span>
              <input className="ob-cv-tag" placeholder="e.g. Data, ML, General" value={cv.tag} onChange={e => onChange(data.cvFiles.map((c, j) => j === i ? { ...c, tag: e.target.value } : c))} />
              <button type="button" className="ob-cv-remove" onClick={() => onChange(data.cvFiles.filter((_, j) => j !== i))}>x</button>
            </div>
          ))}
        </div>
      )}
      <div className="ob-count">{data.cvFiles.length} / 5 CVs uploaded</div>
    </div>
  );
}

function Step6({ data, onChange }) {
  function toggle(loc) {
    onChange(data.locations.includes(loc) ? data.locations.filter(l => l !== loc) : [...data.locations, loc]);
  }
  return (
    <div>
      <StepHeader label="STEP 6 — LOCATION" headline="Where do you want to work?" sub="Select all locations you're open to." />
      <div className="ob-chips-wrap">
        {LOCATIONS.map(loc => <Chip key={loc} label={loc} selected={data.locations.includes(loc)} onClick={() => toggle(loc)} />)}
      </div>
    </div>
  );
}

function Step7({ data, onChange }) {
  function upd(k, v) { onChange({ ...data.profiles, [k]: v }); }
  return (
    <div>
      <StepHeader label="STEP 7 — YOUR PROFILES" headline="Add your professional profiles" sub="Optional but recommended — helps us tailor your applications and cover letters." />
      <div className="ob-profiles">
        <div className="ob-profile-field">
          <label className="ob-label">LinkedIn</label>
          <div className="ob-input-icon-wrap">
            <svg className="ob-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="#0077B5">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <input className="ob-input ob-input-with-icon" placeholder="linkedin.com/in/yourname" value={data.profiles.linkedin} onChange={e => upd("linkedin", e.target.value)} />
          </div>
        </div>
        <div className="ob-profile-field">
          <label className="ob-label">GitHub</label>
          <div className="ob-input-icon-wrap">
            <svg className="ob-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="#6b7280">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            <input className="ob-input ob-input-with-icon" placeholder="github.com/yourname" value={data.profiles.github} onChange={e => upd("github", e.target.value)} />
          </div>
        </div>
        <div className="ob-profile-field">
          <label className="ob-label">Portfolio</label>
          <div className="ob-input-icon-wrap">
            <svg className="ob-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <input className="ob-input ob-input-with-icon" placeholder="yourname.com (optional)" value={data.profiles.portfolio} onChange={e => upd("portfolio", e.target.value)} />
          </div>
        </div>
      </div>
      <p className="ob-privacy">These are never shared without your permission.</p>
    </div>
  );
}

function Step8({ data, onChange }) {
  function toggleDate(d) {
    onChange("startDates", data.startDates.includes(d) ? data.startDates.filter(x => x !== d) : [...data.startDates, d]);
  }
  function toggleDuration(d) {
    onChange("durations", data.durations.includes(d) ? data.durations.filter(x => x !== d) : [...data.durations, d]);
  }
  return (
    <div>
      <StepHeader label="STEP 8 — AVAILABILITY" headline="When are you available?" sub="This helps us filter for the right start dates and lengths." />
      <div className="ob-profile-field">
        <label className="ob-label">Preferred start date</label>
        <div className="ob-chips-wrap">
          {START_DATES.map(d => <Chip key={d} label={d} selected={data.startDates.includes(d)} onClick={() => toggleDate(d)} />)}
        </div>
      </div>
      <div className="ob-profile-field" style={{ marginTop: "20px" }}>
        <label className="ob-label">Co-op duration</label>
        <div className="ob-chips-wrap">
          {DURATIONS.map(d => <Chip key={d} label={d} selected={data.durations.includes(d)} onClick={() => toggleDuration(d)} />)}
        </div>
      </div>
    </div>
  );
}

function Step9({ data, onChange }) {
  const modes = [
    { id: "auto",     name: "Auto — trust the machine",       desc: "Fully automated. Scrape, score, tailor and apply overnight. Check your morning digest.", bg: "#fef3c7", color: "#b45309", symbol: "A" },
    { id: "balanced", name: "Balanced — review before apply", desc: "Jobs scored automatically. You approve each application before it goes out.",            bg: "#eef2ff", color: "#3730a3", symbol: "B" },
    { id: "power",    name: "Power — full control",           desc: "Every step is manual. Full visibility into everything the agent does.",                    bg: "#f5f3ff", color: "#6d28d9", symbol: "P" },
  ];
  return (
    <div>
      <StepHeader label="STEP 9 — AUTOMATION" headline="How hands-on do you want to be?" sub="You can change this anytime from settings." />
      <div className="ob-modes">
        {modes.map(m => (
          <button key={m.id} type="button" className={"ob-mode-card" + (data.automationMode === m.id ? " selected" : "")} onClick={() => onChange(m.id)}>
            <div className="ob-mode-icon" style={{ background: m.bg, color: m.color }}>{m.symbol}</div>
            <div className="ob-mode-text">
              <div className="ob-mode-name">{m.name}</div>
              <div className="ob-mode-desc">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step10({ data, onChange }) {
  function upd(k, v) { onChange({ ...data.notifications, [k]: v }); }
  const toggles = [
    { key: "morning",   title: "Morning digest",     desc: "Daily summary of overnight applications" },
    { key: "highScore", title: "High score alert",    desc: "Instant alert when a job scores 85 or above" },
    { key: "interview", title: "Interview reminders", desc: "24 hours before scheduled interviews" },
    { key: "weekly",    title: "Weekly stats",         desc: "Sunday summary of the week" },
  ];
  return (
    <div>
      <StepHeader label="STEP 10 — NOTIFICATIONS" headline="How do you want to be notified?" sub="We'll keep you in the loop without spamming you." />
      <div className="ob-profile-field">
        <label className="ob-label">Notification email</label>
        <input className="ob-input" type="email" placeholder="jazmyn@northeastern.edu" value={data.notifications.email} onChange={e => upd("email", e.target.value)} />
      </div>
      <div className="ob-toggles">
        {toggles.map(t => (
          <div key={t.key} className="ob-toggle-row">
            <div>
              <div className="ob-toggle-title">{t.title}</div>
              <div className="ob-toggle-desc">{t.desc}</div>
            </div>
            <ToggleSwitch checked={data.notifications[t.key]} onChange={v => upd(t.key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="ob-page">
      <div className="ob-card ob-success-card">
        <div className="ob-checkmark">
          <svg viewBox="0 0 52 52" className="ob-check-svg">
            <circle className="ob-check-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="ob-check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h2 className="ob-success-title">You're all set!</h2>
        <p className="ob-success-sub">Your agent is running its first job search.</p>
        <p className="ob-success-note">We'll notify you when results are ready.</p>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ MAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function OnboardingPage() {
  const router = useRouter();

  const [ready,     setReady]     = useState(false);
  const [step,      setStep]      = useState(1);
  const [direction, setDirection] = useState("forward");
  const [animKey,   setAnimKey]   = useState(0);
  const [error,     setError]     = useState("");
  const [shaking,   setShaking]   = useState(false);
  const [done,      setDone]      = useState(false);

  const [form, setForm] = useState({
    name:           "",
    fields:         [],
    roles:          [],
    skills:         [],
    cvFiles:        [],
    locations:      [],
    profiles:       { linkedin: "", github: "", portfolio: "" },
    startDates:     [],
    durations:      [],
    automationMode: "balanced",
    notifications:  { email: "", morning: true, highScore: true, interview: true, weekly: false },
  });

  useEffect(() => {
    if (isOnboarded()) {
      router.replace("/dashboard");
      return;
    }
    const session = getSession();
    if (session?.onboardingData) {
      setForm(prev => ({ ...prev, ...session.onboardingData, cvFiles: [] }));
      setStep(session.onboardingStep || 1);
    }
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function update(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
    setError("");
  }

  function persistStep(nextStep, currentForm) {
    const { cvFiles, ...serializable } = currentForm;
    saveSession({ ...getSession(), onboardingStep: nextStep, onboardingData: serializable });
  }

  function validate() {
    if (step === 1 && !form.name.trim())             return "Please enter your name to continue";
    if (step === 2 && form.fields.length === 0)      return "Please select at least one area to continue";
    if (step === 3 && form.roles.length === 0)   return "Please select at least one role";
    if (step === 4 && form.skills.length === 0)  return "Please add at least one skill";
    if (step === 5 && form.cvFiles.length === 0) return "Please upload at least one CV";
    return "";
  }

  function goNext() {
    const err = validate();
    if (err) {
      setError(err);
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      return;
    }
    if (step === 10) {
      const { cvFiles, ...serializable } = form;
      saveSession({
        ...getSession(),
        onboardingComplete: true,
        completedAt: new Date().toISOString(),
        name: form.name,
        onboardingData: serializable,
      });
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2500);
      return;
    }
    setError("");
    persistStep(step + 1, form);
    setDirection("forward");
    setAnimKey(k => k + 1);
    setStep(s => s + 1);
  }

  function goBack() {
    setDirection("back");
    setAnimKey(k => k + 1);
    setStep(s => s - 1);
    setError("");
  }

  if (!ready) return null;
  if (done) return <SuccessState />;

  const steps = [
    <Step1  key={1}  data={form} onChange={v => update("name", v)} />,
    <Step2  key={2}  data={form} onChange={v => update("fields", v)} />,
    <Step3  key={3}  data={form} onChange={v => update("roles", v)} />,
    <Step4  key={4}  data={form} onChange={v => update("skills", v)} />,
    <Step5  key={5}  data={form} onChange={v => update("cvFiles", v)} />,
    <Step6  key={6}  data={form} onChange={v => update("locations", v)} />,
    <Step7  key={7}  data={form} onChange={v => update("profiles", v)} />,
    <Step8  key={8}  data={form} onChange={(k, v) => { setForm(p => ({ ...p, [k]: v })); setError(""); }} />,
    <Step9  key={9}  data={form} onChange={v => update("automationMode", v)} />,
    <Step10 key={10} data={form} onChange={v => update("notifications", v)} />,
  ];

  return (
    <div className="ob-page">
      <div className="ob-card">
        <div className="ob-progress-bar">
          <div className="ob-progress-fill" style={{ width: ((step / 10) * 100) + "%" }} />
        </div>
        <div className="ob-header">
          <div className="ob-dots">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className={"ob-dot" + (i + 1 === step ? " active" : "")} />
            ))}
          </div>
          <div className="ob-step-counter">Step {step} of 10</div>
        </div>
        <div key={animKey} className={"ob-step-content " + (direction === "forward" ? "slide-forward" : "slide-back")}>
          {steps[step - 1]}
        </div>
        <div className="ob-nav">
          {error && <p className="ob-error">{error}</p>}
          <div className="ob-nav-buttons">
            {step > 1 && (
              <button type="button" className="ob-btn-back" onClick={goBack}>Back</button>
            )}
            <button type="button" className={"ob-btn-next" + (shaking ? " shake" : "")} onClick={goNext}>
              {step === 10 ? "Start job search" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
