import React, { useState } from "react";
import Landing from "./screens/Landing.jsx";
import ParentResults from "./screens/ParentResults.jsx";
import AccountAndLocation from "./screens/AccountAndLocation.jsx";
import AdminIntakeConsole from "./screens/AdminIntakeConsole.jsx";

const TABS = [
  ["home", "Home"],
  ["parent", "For parents"],
  ["account", "Parent account"],
  ["admin", "Admin console"],
];

export default function App() {
  const [view, setView] = useState("home");
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Public Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=IBM+Plex+Mono:wght@400;500;600&family=Public+Sans:wght@400;500;600;700&display=swap');
        .navpill:focus-visible { outline: 2px solid #B4552D; outline-offset: 2px; }
      `}</style>

      {/* preview switcher (demo chrome — remove when wiring real routing/auth) */}
      <div style={{ background: "#0F1115", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", height: 42, flexShrink: 0, gap: 8 }}>
        <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {TABS.map(([k, label]) => (
            <button key={k} className="navpill" onClick={() => setView(k)}
              style={{ whiteSpace: "nowrap", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, letterSpacing: "0.02em", padding: "6px 12px", borderRadius: 20, color: view === k ? "#0F1115" : "#C7CCD4", background: view === k ? "#fff" : "transparent" }}>
              {label}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#7E8794", whiteSpace: "nowrap" }}>Preview · sample data</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {view === "home" && <Landing go={setView} />}
        {view === "parent" && <ParentResults />}
        {view === "account" && <AccountAndLocation />}
        {view === "admin" && <AdminIntakeConsole />}
      </div>
    </div>
  );
}
