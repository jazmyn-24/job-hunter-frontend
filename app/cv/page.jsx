"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { isOnboarded, getOrCreateSessionId } from "../../lib/session";
import { getCVs, addCV, updateCV, deleteCV } from "../../lib/api";
import "./cv.css";
import "../dashboard/dashboard.css";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ ICONS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function IconDoc() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ HELPERS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function formatSize(str) {
  if (!str) return "";
  return str;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ UPLOAD AREA ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function UploadArea({ pending, onAdd, onRemove, onTagChange, onSave, saving, totalSaved }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(fileList) {
    const allowed = Array.from(fileList).filter(
      f => f.size <= 5 * 1024 * 1024 &&
        (f.name.endsWith(".pdf") || f.name.endsWith(".docx"))
    );
    const remaining = 5 - totalSaved - pending.length;
    onAdd(allowed.slice(0, remaining));
  }

  return (
    <div>
      <div
        className={"cv-upload-area" + (dragOver ? " drag-over" : "")}
        onClick={() => inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <IconUpload />
        <p className="cv-upload-label">Drop your CV here or click to upload</p>
        <p className="cv-upload-sub">.pdf or .docx · max 5MB · up to 5 CVs total</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          multiple
          style={{ display: "none" }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {pending.length > 0 && (
        <>
          <div className="cv-pending-list">
            {pending.map((item, i) => (
              <div key={i} className="cv-pending-row">
                <span className="cv-doc-icon"><IconDoc /></span>
                <span className="cv-pending-name">{item.file.name}</span>
                <span className="cv-pending-size">{(item.file.size / 1024).toFixed(0)}KB</span>
                <input
                  className="cv-tag-input"
                  placeholder="Tag (e.g. ML, Data)"
                  value={item.tag}
                  onChange={e => onTagChange(i, e.target.value)}
                />
                <button className="cv-pending-remove" onClick={() => onRemove(i)}>×</button>
              </div>
            ))}
          </div>
          <button className="cv-save-btn" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : `Save ${pending.length} CV${pending.length > 1 ? "s" : ""}`}
          </button>
        </>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ CV ROW ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CVRow({ cv, onDelete, onSetDefault }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDelete(cv.id);
    setDeleting(false);
  }

  return (
    <div className={"cv-row" + (cv.is_default ? " is-default" : "")}>
      <span className="cv-doc-icon"><IconDoc /></span>
      <div className="cv-row-info">
        <div className="cv-row-top">
          <span className="cv-filename">{cv.filename}</span>
          {cv.tag && <span className="cv-tag-badge">{cv.tag}</span>}
          {cv.is_default && <span className="cv-default-badge">Default</span>}
        </div>
        <div className="cv-row-meta">
          {cv.file_size && <span>{cv.file_size} · </span>}
          {cv.created_at && <span>Added {formatDate(cv.created_at)}</span>}
        </div>
      </div>
      <div className="cv-row-actions">
        <label className="cv-default-toggle">
          <input
            type="checkbox"
            checked={cv.is_default}
            onChange={() => onSetDefault(cv.id, !cv.is_default)}
          />
          Set as default
        </label>
        <button className="cv-delete-btn" onClick={handleDelete} disabled={deleting} title="Remove CV">
          ×
        </button>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function CVPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [cvs,     setCvs]     = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const sessionId = typeof window !== "undefined" ? getOrCreateSessionId() : null;

  const load = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await getCVs(sessionId);
      setCvs(data);
    } catch (_) {
      setError("Could not load CVs — is the backend running?");
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    if (!isOnboarded()) { router.replace("/auth"); return; }
    setReady(true);
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAdd(files) {
    setPending(prev => [...prev, ...files.map(f => ({ file: f, tag: "" }))]);
  }

  function handleRemove(i) {
    setPending(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleTagChange(i, val) {
    setPending(prev => prev.map((item, idx) => idx === i ? { ...item, tag: val } : item));
  }

  async function handleSave() {
    if (!sessionId || pending.length === 0) return;
    setSaving(true);
    setError("");
    const isFirst = cvs.length === 0;
    try {
      for (let i = 0; i < pending.length; i++) {
        const { file, tag } = pending[i];
        await addCV(sessionId, {
          filename: file.name,
          tag,
          is_default: isFirst && i === 0,
          file_size: `${(file.size / 1024).toFixed(0)}KB`,
        });
      }
      setPending([]);
      await load();
    } catch (_) {
      setError("Failed to save CVs. Is the backend running?");
    }
    setSaving(false);
  }

  async function handleDelete(cvId) {
    setError("");
    try {
      await deleteCV(cvId);
      setCvs(prev => prev.filter(c => c.id !== cvId));
    } catch (_) {
      setError("Failed to delete CV.");
    }
  }

  async function handleSetDefault(cvId, value) {
    setError("");
    try {
      await updateCV(cvId, { is_default: value });
      setCvs(prev => prev.map(c => ({ ...c, is_default: c.id === cvId ? value : value ? false : c.is_default })));
    } catch (_) {
      setError("Failed to update CV.");
    }
  }

  if (!ready) return null;

  return (
    <div className="cv-shell">
      <Sidebar activePage="cv manager" />

      <main className="cv-main">
        {/* Header */}
        <div>
          <h1 className="cv-page-title">CV Manager</h1>
          <p className="cv-page-sub">Manage your CVs — we pick the best one per job</p>
        </div>

        {/* Upload */}
        <div className="cv-section">
          <div className="cv-section-title">Upload new CV</div>
          <UploadArea
            pending={pending}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onTagChange={handleTagChange}
            onSave={handleSave}
            saving={saving}
            totalSaved={cvs.length}
          />
          {error && <p className="cv-error">{error}</p>}
        </div>

        {/* CV List */}
        <div className="cv-section">
          <div className="cv-section-title">Your CVs</div>
          {loading ? (
            <p className="cv-loading">Loading…</p>
          ) : cvs.length === 0 ? (
            <div className="cv-empty">No CVs uploaded yet — add one above</div>
          ) : (
            <div className="cv-list">
              {cvs.map(cv => (
                <CVRow
                  key={cv.id}
                  cv={cv}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="cv-section">
          <div className="cv-section-title">How it works</div>
          <div className="cv-info-card">
            <div className="cv-info-title">How we pick your CV</div>
            <p className="cv-info-body">
              When a job comes in, we match it to your best CV based on the tags
              you've set. If no match is found, we use your default CV. You can
              always edit tailored versions before applying.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
