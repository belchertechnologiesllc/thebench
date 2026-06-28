import React, { useState } from "react";
import Landing from "./screens/Landing.jsx";
import ParentResults from "./screens/ParentResults.jsx";
import AccountAndLocation from "./screens/AccountAndLocation.jsx";
import AdminIntakeConsole from "./screens/AdminIntakeConsole.jsx";

const TABS = [
  ["home", "Home"],
  ["parent", "For parents"],
  ["account", "Account"],
  ["admin", "Admin"],
];

export default function App() {
  const [view, setView] = useState("home");
  const display = "'Big Shoulders Display', system-ui, sans-serif";
  const mono = "'IBM Plex Mono', ui-monospace, monospace";
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Libre Franklin', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&family=Libre+Franklin:wght@400;500;600;700&display=swap');
        .navpill:focus-visible{outline:2px solid #BE3C2B;outline-offset:2px}
      `}</style>

      {/* demo chrome — removed when real routing/auth land */}
      <div style={{ background: "#221C13", color: "#EFE7D4", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", height: 44, flexShrink: 0, gap: 10, borderBottom: "3px solid #BE3C2B" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, overflowX: "auto" }}>
          <span onClick={() => setView("home")} style={{ fontFamily: display, fontWeight: 800, fontSize: 19, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" }}>On&nbsp;Deck</span>
          <div style={{ display: "flex", gap: 3 }}>
            {TABS.map(([k, label]) => (
              <button key={k} className="navpill" onClick={() => setView(k)}
                style={{ whiteSpace: "nowrap", border: "none", cursor: "pointer", fontFamily: display, fontWeight: 600, fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 3, color: view === k ? "#221C13" : "#CBBE9F", background: view === k ? "#EFE7D4" : "transparent" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <span style={{ fontFamily: mono, fontSize: 10.5, color: "#9A8E72", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>PREVIEW · SAMPLE DATA</span>
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
