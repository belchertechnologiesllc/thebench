import React from "react";

const c = {
  ink: "#1A201A", paper: "#F4F6F0", card: "#FFFFFF", line: "#E5E8DF",
  turf: "#2F6B3D", turfDeep: "#234E2D", turfSoft: "#EAF1E7",
  clay: "#B4552D", ink2: "#3C4338", mute: "#6C7366", faint: "#99A091",
};
const display = "'Bricolage Grotesque', system-ui, sans-serif";
const body = "'Public Sans', system-ui, sans-serif";
const mono = "'IBM Plex Mono', ui-monospace, monospace";

const STEPS = [
  ["Clubs answer, facts get checked", "At intake each club completes a questionnaire built on verifiable specifics — innings, pitch-count policy, certifications, practice-to-game ratio — not slogans. An admin spot-checks the evidence before a listing goes live."],
  ["A hidden rubric does the scoring", "Answers map to twelve development categories through a rubric the club never sees. No club sets its own score, so a paid listing can't become a sales pitch."],
  ["You weight what matters to you", "Tell us your priorities and your home ZIP. The board ranks clubs your way — this season only — and shows which ones have open tryout spots near you."],
];

export default function Landing({ go }) {
  const eyebrow = { fontFamily: display, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.clay };
  const btn = (primary) => ({
    fontFamily: body, fontWeight: 700, fontSize: 15, cursor: "pointer", borderRadius: 8, padding: "13px 22px",
    border: primary ? "none" : `1.5px solid ${c.line}`, background: primary ? c.turf : "#fff", color: primary ? "#fff" : c.ink2,
  });
  return (
    <div style={{ fontFamily: body, background: c.paper, color: c.ink, minHeight: "100%" }}>
      <style>{`*{box-sizing:border-box} .lbtn:focus-visible{outline:2px solid ${c.turf};outline-offset:2px}`}</style>

      {/* hero */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(36px,6vw,76px) 22px 40px" }}>
        <p style={eyebrow}>Youth baseball, compared honestly</p>
        <h1 style={{ fontFamily: display, fontWeight: 700, fontSize: "clamp(32px,6vw,58px)", lineHeight: 1.02, letterSpacing: "-0.02em", margin: "10px 0 0", maxWidth: 860 }}>
          Find the club that actually grows your player — not just the one that wins Saturday.
        </h1>
        <p style={{ fontSize: "clamp(16px,2.4vw,19px)", color: c.mute, maxWidth: 660, marginTop: 18, lineHeight: 1.5 }}>
          A managed directory that scores youth baseball organizations on development quality across twelve categories, ranks them by <em>your</em> priorities, and shows you who has open spots within driving distance.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <button className="lbtn" style={btn(true)} onClick={() => go("parent")}>Explore as a parent</button>
          <button className="lbtn" style={btn(false)} onClick={() => go("admin")}>See the admin side</button>
        </div>
        <p style={{ fontFamily: mono, fontSize: 12, color: c.faint, marginTop: 18 }}>Preview on sample clubs · payments and live data come next</p>
      </section>

      {/* how it works */}
      <section style={{ background: "#fff", borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "44px 22px" }}>
          <p style={eyebrow}>How it works</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 24, marginTop: 18 }}>
            {STEPS.map(([h, p], i) => (
              <div key={i}>
                <div style={{ fontFamily: mono, fontSize: 13, color: c.turf }}>{String(i + 1).padStart(2, "0")}</div>
                <h3 style={{ fontFamily: display, fontWeight: 600, fontSize: 20, margin: "6px 0 8px", lineHeight: 1.15 }}>{h}</h3>
                <p style={{ fontSize: 14.5, color: c.mute, margin: 0, lineHeight: 1.5 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* integrity line */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "44px 22px" }}>
        <div style={{ background: c.turfSoft, border: `1px solid ${c.turf}33`, borderRadius: 12, padding: "26px 28px", maxWidth: 760 }}>
          <p style={{ ...eyebrow, color: c.turfDeep }}>Why you can trust the scores</p>
          <p style={{ fontFamily: display, fontWeight: 600, fontSize: "clamp(19px,2.6vw,24px)", lineHeight: 1.3, margin: "8px 0 0", color: c.ink }}>
            Clubs pay to be listed, but they never see the categories or their own scores. Ratings come from checkable facts, not self-praise — so the rankings stay honest.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <button className="lbtn" style={btn(true)} onClick={() => go("parent")}>Start with your priorities</button>
          <button className="lbtn" style={btn(false)} onClick={() => go("account")}>Set up a parent account</button>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${c.line}`, padding: "22px", textAlign: "center", color: c.faint, fontSize: 13 }}>
        The Bench · a preview build · sample data, not real club ratings
      </footer>
    </div>
  );
}
