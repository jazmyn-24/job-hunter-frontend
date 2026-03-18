"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./auth.css";
import { isOnboarded } from "../../lib/session";

/* ── SVG Icons ──────────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="0"   y="0"   width="8.5" height="8.5" fill="#F25022" />
      <rect x="9.5" y="0"   width="8.5" height="8.5" fill="#7FBA00" />
      <rect x="0"   y="9.5" width="8.5" height="8.5" fill="#00A4EF" />
      <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ── Auth Card ───────────────────────────────────────────────────────────── */
function AuthCard() {
  const router = useRouter();
  const [view, setView]             = useState("signin");
  const [email, setEmail]           = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(false);

  const isSignUp = view === "signup";

  function switchView(next) {
    setView(next);
    setEmail("");
    setEmailError("");
    setSent(false);
    setLoading(false);
  }

  function validateEmail(val) {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email";
    return "";
  }

  function handleOAuth() {
    router.push(isOnboarded() ? "/dashboard" : "/onboarding");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      const dest = isOnboarded() ? "/dashboard" : "/onboarding";
      setTimeout(() => router.push(dest), 1500);
    }, 800);
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  }

  return (
    <div className="auth-card">
      {/* Logo */}
      <div className="auth-logo">job-hunter</div>

      {/* Tabs */}
      <div className="auth-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={view === "signin"}
          className={`auth-tab${view === "signin" ? " active" : ""}`}
          onClick={() => switchView("signin")}
        >
          Sign in
        </button>
        <button
          role="tab"
          aria-selected={view === "signup"}
          className={`auth-tab${view === "signup" ? " active" : ""}`}
          onClick={() => switchView("signup")}
        >
          Sign up
        </button>
      </div>

      {/* Heading */}
      <h1 className="auth-title">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="auth-subtitle">
        {isSignUp ? "Start finding co-op jobs tonight" : "Sign in to continue"}
      </p>

      {/* OAuth */}
      <div className="auth-oauth-list">
        <button className="auth-oauth-btn" onClick={handleOAuth} type="button">
          <span className="auth-oauth-icon"><GoogleIcon /></span>
          <span className="auth-oauth-text">
            <span className="auth-oauth-label">Continue with Google</span>
          </span>
        </button>

        <button className="auth-oauth-btn" onClick={handleOAuth} type="button">
          <span className="auth-oauth-icon"><MicrosoftIcon /></span>
          <span className="auth-oauth-text">
            <span className="auth-oauth-label">Continue with Microsoft</span>
            <span className="auth-oauth-sub">northeastern.edu · any org email</span>
          </span>
        </button>

        <button className="auth-oauth-btn" onClick={handleOAuth} type="button">
          <span className="auth-oauth-icon"><LinkedInIcon /></span>
          <span className="auth-oauth-text">
            <span className="auth-oauth-label">Continue with LinkedIn</span>
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="auth-divider" aria-hidden="true">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">or</span>
        <div className="auth-divider-line" />
      </div>

      {/* Form / Success */}
      {sent ? (
        <div className="auth-success" role="status">
          <div className="auth-success-icon">✉️</div>
          <p className="auth-success-title">Check your inbox</p>
          <p className="auth-success-sub">Redirecting you now…</p>
        </div>
      ) : (
        <form className="auth-email-form" onSubmit={handleSubmit} noValidate>
          <input
            className={`auth-input${emailError ? " error" : ""}`}
            type="email"
            autoComplete="email"
            placeholder={isSignUp ? "you@northeastern.edu" : "your@email.com"}
            value={email}
            onChange={handleEmailChange}
            aria-label="Email address"
            aria-describedby={emailError ? "email-error" : undefined}
            disabled={loading}
          />
          {emailError && (
            <span id="email-error" className="auth-error-msg" role="alert">
              {emailError}
            </span>
          )}
          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                Sending…
              </>
            ) : isSignUp ? (
              "Get started free →"
            ) : (
              "Send magic link →"
            )}
          </button>
        </form>
      )}

      {/* Switch view */}
      <p className="auth-switch">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <button className="auth-switch-btn" onClick={() => switchView("signin")}>
              Sign in
            </button>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <button className="auth-switch-btn" onClick={() => switchView("signup")}>
              Sign up
            </button>
          </>
        )}
      </p>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function AuthPage() {
  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" aria-hidden="true" />
      <div className="auth-blob auth-blob-2" aria-hidden="true" />
      <div className="auth-blob auth-blob-3" aria-hidden="true" />

      {/* Left column */}
      <div className="auth-left">
        <p className="auth-eyebrow">CO-OP JOB PLATFORM FOR CANADA</p>
        <h1 className="auth-headline">
          The co-op job platform built for Canadian students.
        </h1>
        <p className="auth-herotext">
          AI finds, scores and applies to positions across Canada
          every night. Wake up to interviews, not job boards.
        </p>
        <div className="auth-pills">
          <span className="auth-pill">◉ Scrapes 12+ job boards nightly</span>
          <span className="auth-pill">★ AI scores every job against your profile</span>
          <span className="auth-pill">↗ Applies automatically while you sleep</span>
        </div>
        <p className="auth-indexed">473 jobs indexed · free to get started</p>
      </div>

      {/* Right column */}
      <div className="auth-right">
        <AuthCard />
      </div>
    </div>
  );
}
