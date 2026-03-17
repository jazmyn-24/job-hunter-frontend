"use client";

import { useState } from "react";
import "./auth.css";

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

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0a0a">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/* ── Left panel ─────────────────────────────────────────────────────────── */
function AuthLeft() {
  return (
    <aside className="auth-left">
      {/* Decorative circles */}
      <div className="auth-left-circle-top" aria-hidden="true" />
      <div className="auth-left-circle-bottom" aria-hidden="true" />

      <div className="auth-logo">job-hunter</div>

      <div className="auth-left-body">
        <p className="auth-eyebrow">CO-OP JOB PLATFORM</p>
        <h2 className="auth-left-headline">
          The co-op job platform built for Canadian students.
        </h2>
        <p className="auth-left-sub">
          AI finds, scores and applies to positions across Canada every
          night. Wake up to interviews, not job boards.
        </p>
        <ul className="auth-left-features">
          <li>
            <span className="auth-feature-dot" aria-hidden="true" />
            Scrapes 12+ job boards every night
          </li>
          <li>
            <span className="auth-feature-dot" aria-hidden="true" />
            Scores every job against your profile
          </li>
          <li>
            <span className="auth-feature-dot" aria-hidden="true" />
            Applies automatically while you sleep
          </li>
        </ul>
      </div>

      <p className="auth-left-footer">473 jobs indexed</p>
    </aside>
  );
}

/* ── Right panel ─────────────────────────────────────────────────────────── */
function AuthRight() {
  const [view, setView] = useState("signin");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError("");
    setLoading(true);
    // Simulate network delay, then show success
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  }

  function handleOAuth(provider) {
    // Stub — wire to backend OAuth endpoints
    console.log("OAuth:", provider);
  }

  return (
    <div className="auth-right">
      <div className="auth-form-wrap">
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
          {isSignUp ? "Get started free" : "Welcome back"}
        </h1>
        <p className="auth-subtitle">
          {isSignUp
            ? "No credit card · takes 30 seconds"
            : "Sign in to your account"}
        </p>

        {/* OAuth */}
        <div className="auth-oauth-list">
          <button className="auth-oauth-btn" onClick={() => handleOAuth("google")} type="button">
            <span className="auth-oauth-icon"><GoogleIcon /></span>
            <span className="auth-oauth-text">
              <span className="auth-oauth-label">Continue with Google</span>
            </span>
          </button>

          <button className="auth-oauth-btn" onClick={() => handleOAuth("microsoft")} type="button">
            <span className="auth-oauth-icon"><MicrosoftIcon /></span>
            <span className="auth-oauth-text">
              <span className="auth-oauth-label">Continue with Microsoft</span>
              <span className="auth-oauth-sub">northeastern.edu · any org email</span>
            </span>
          </button>

          <button className="auth-oauth-btn" onClick={() => handleOAuth("github")} type="button">
            <span className="auth-oauth-icon"><GitHubIcon /></span>
            <span className="auth-oauth-text">
              <span className="auth-oauth-label">Continue with GitHub</span>
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider" aria-hidden="true">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or</span>
          <div className="auth-divider-line" />
        </div>

        {/* Magic link / success */}
        {sent ? (
          <div className="auth-success" role="status">
            <div className="auth-success-icon">✉️</div>
            <p className="auth-success-title">Check your inbox</p>
            <p className="auth-success-sub">
              Magic link sent · check your spam if needed
            </p>
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
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function AuthPage() {
  return (
    <div className="auth-page">
      <AuthLeft />
      <AuthRight />
    </div>
  );
}
