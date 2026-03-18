"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isOnboarded, clearSession } from "../../lib/session";

export default function DashboardPage() {
  const router  = useRouter();
  const [name, setName]     = useState("");
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    if (!isOnboarded()) {
      router.replace("/auth");
      return;
    }
    const session = getSession();
    setName(session?.name || "");
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function signOut() {
    clearSession();
    router.push("/auth");
  }

  function resetOnboarding() {
    clearSession();
    router.push("/onboarding");
  }

  if (!ready) return null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
      background: "#f9fafb",
      position: "relative",
    }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
          Dashboard
        </p>
        <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "28px", fontWeight: 700, color: "#0a0a0a", margin: "0 0 8px" }}>
          Welcome back{name ? `, ${name}` : ""}
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
          Your job agent is running. Full dashboard coming soon.
        </p>
      </div>

      <div style={{ position: "fixed", bottom: "24px", right: "24px", display: "flex", gap: "8px" }}>
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={resetOnboarding}
            style={{
              background: "none",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              padding: "8px 16px",
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#f87171",
              cursor: "pointer",
            }}
          >
            Reset onboarding
          </button>
        )}
        <button
          onClick={signOut}
          style={{
            background: "none",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px 16px",
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            color: "#9ca3af",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
