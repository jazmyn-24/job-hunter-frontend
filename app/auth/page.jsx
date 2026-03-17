"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/* ── Auth Card ───────────────────────────────────────────────────────────── */
function AuthCard() {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const [view, setView]           = useState("signin");
  const [email, setEmail]         = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);

  const isSignUp = view === "signup";
  const isLoaded = signInLoaded && signUpLoaded;

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

  async function handleOAuth(provider) {
    if (!isLoaded) return;
    const strategy = {
      google:    "oauth_google",
      microsoft: "oauth_microsoft",
      github:    "oauth_github",
    }[provider];
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
      });
    } catch (err) {
      console.error("OAuth error:", err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    if (!isLoaded) return;

    setEmailError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp.create({ emailAddress: email });
        const { startEmailLinkFlow } = signUp.createEmailLinkFlow();
        // Fire without await — email sends immediately, flow resolves when link clicked
        startEmailLinkFlow({ redirectUrl: `${window.location.origin}/sso-callback` });
      } else {
        const si = await signIn.create({ identifier: email });
        const factor = si.supportedFirstFactors?.find(
          (ff) => ff.strategy === "email_link"
        );
        if (factor) {
          const { startEmailLinkFlow } = si.createEmailLinkFlow();
          startEmailLinkFlow({
            emailAddressId: factor.emailAddressId,
            redirectUrl: `${window.location.origin}/sso-callback`,
          });
        }
      }
      setLoading(false);
      setSent(true);
    } catch (err) {
      setLoading(false);
      setEmailError(err.errors?.[0]?.longMessage ?? "Something went wrong. Try again.");
    }
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
        <button className="auth-oauth-btn" onClick={() => handleOAuth("google")} type="button" disabled={!isLoaded}>
          <span className="auth-oauth-icon"><GoogleIcon /></span>
          <span className="auth-oauth-text">
            <span className="auth-oauth-label">Continue with Google</span>
          </span>
        </button>

        <button className="auth-oauth-btn" onClick={() => handleOAuth("microsoft")} type="button" disabled={!isLoaded}>
          <span className="auth-oauth-icon"><MicrosoftIcon /></span>
          <span className="auth-oauth-text">
            <span className="auth-oauth-label">Continue with Microsoft</span>
            <span className="auth-oauth-sub">northeastern.edu · any org email</span>
          </span>
        </button>

        <button className="auth-oauth-btn" onClick={() => handleOAuth("github")} type="button" disabled={!isLoaded}>
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

      {/* Form / Success */}
      {sent ? (
        <div className="auth-success" role="status">
          <div className="auth-success-icon">✉️</div>
          <p className="auth-success-title">Check your inbox</p>
          <p className="auth-success-sub">Magic link sent · check your spam if needed</p>
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
            disabled={loading || !isLoaded}
          />
          {emailError && (
            <span id="email-error" className="auth-error-msg" role="alert">
              {emailError}
            </span>
          )}
          <button className="auth-submit-btn" type="submit" disabled={loading || !isLoaded}>
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
