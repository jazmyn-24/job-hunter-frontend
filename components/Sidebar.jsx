"use client";

import Link from "next/link";
import { clearSession, getSession } from "../lib/session";
import { useRouter } from "next/navigation";
import "../app/dashboard/dashboard.css";

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

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}

const NAV_ITEMS = [
  { label: "Dashboard",    icon: <IconGrid />,        href: "/dashboard" },
  { label: "Jobs",         icon: <IconBriefcase />,   href: "/jobs" },
  { label: "Score queue",  icon: <IconStar />,        href: "/queue" },
  { label: "Applications", icon: <IconCheckCircle />, href: "/applications" },
  { label: "CV Manager",   icon: <IconDocument />,    href: "/cv" },
  { label: "Settings",     icon: <IconGear />,        href: "/settings" },
];

export default function Sidebar({ activePage, counts = {} }) {
  const router = useRouter();
  const session = getSession();
  const name  = session?.name  || "";
  const field = session?.onboardingData?.fields?.[0] || "";

  const FIELD_NAMES = {
    tech: "Technology", data: "Data & Analytics", biz: "Business & Finance",
    mkt: "Marketing", eng: "Engineering", health: "Health Sciences",
    design: "Architecture & Design", law: "Law & Policy", sci: "Science & Research",
    other: "Other",
  };

  function signOut() {
    clearSession();
    router.push("/auth");
  }

  function resetOnboarding() {
    clearSession();
    router.push("/onboarding");
  }

  return (
    <aside className="db-sidebar">
      <div className="db-sidebar-top">
        <div className="db-logo">job-hunter</div>
        <div className="db-agent-status">
          <span className="db-agent-dot" />
          Agent active
        </div>
        <nav className="db-nav">
          {NAV_ITEMS.map((item) => {
            const badge = item.label === "Score queue" ? counts.scoreQueue : null;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={"db-nav-item" + (activePage === item.label.toLowerCase() ? " active" : "")}
              >
                <span className="db-nav-icon">{item.icon}</span>
                <span className="db-nav-label">{item.label}</span>
                {badge > 0 && (
                  <span className="db-nav-badge">{badge > 99 ? "99+" : badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="db-sidebar-bottom">
        <div className="db-user-row">
          <div className="db-avatar">{getInitials(name)}</div>
          <div className="db-user-info">
            <div className="db-user-name">{name || "You"}</div>
            <div className="db-user-sub">{FIELD_NAMES[field] || "Co-op student"}</div>
          </div>
        </div>
        <button className="db-signout" onClick={signOut}>Sign out</button>
        {process.env.NODE_ENV === "development" && (
          <button
            className="db-signout"
            onClick={resetOnboarding}
            style={{ marginTop: "4px", color: "#fca5a5" }}
          >
            Reset onboarding
          </button>
        )}
      </div>
    </aside>
  );
}
