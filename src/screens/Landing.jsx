import React from "react";

/* On Deck — "sandlot scorebook" landing. Warm newsprint, ruled lines, red
   lace stitching as the divider motif, ballpark-signage type, ink stamps,
   asymmetry. Built to feel hand-kept, not generated. */

const c = {
  paper: "#EFE7D4", paper2: "#F6F0E0", ink: "#221C13", ink2: "#473C28",
  green: "#1E4D32", greenDeep: "#143524", red: "#BE3C2B", gold: "#C2883A",
  line: "#D6C9AC", mute: "#6E6147", faint: "#9A8E72",
};
const display = "'Big Shoulders Display', system-ui, sans-serif";
const text = "'Libre Franklin', system-ui, sans-serif";
const mono = "'IBM Plex Mono', ui-monospace, monospace";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

let lid = 0;
function Stitch({ color = c.red, h = 13 }) {
  const id = `lace${lid++}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" style={{ display: "block" }} aria-hidden="true">
      <defs>
        <pattern id={id} width="3.6" height={h} patternUnits="userSpaceOnUse">
          <path d={`M1 ${h * 0.28} L2.6 ${h * 0.72}`} stroke={color} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M2.6 ${h * 0.28} L1 ${h * 0.72}`} stroke={color} strokeWidth="1.1" strokeLinecap="round" />
        </pattern>
      </defs>
      <line x1="0" y1={h / 2} x2="100" y2={h / 2} stroke={color} strokeWidth="0.5" opacity="0.45" vectorEffect="non-scaling-stroke" />
      <rect width="100" height={h} fill={`url(#${id})`} />
    </svg>
  );
}

function Baseball() {
  const ticks = [];
  for (let i = 0; i < 7; i++) {
    const y = 50 + i * 14;
    ticks.push(<path key={`l${i}`} d={`M${46 - Math.sin(i / 6 * Math.PI) * 10} ${y} l9 4`} stroke={c.red} strokeWidth="2" strokeLinecap="round" />);
    ticks.push(<path key={`r${i}`} d={`M${154 + Math.sin(i / 6 * Math.PI) * 10} ${y} l-9 4`} stroke={c.red} strokeWidth="2" strokeLinecap="round" />);
  }
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
      <circle cx="100" cy="100" r="82" fill={c.paper2} stroke={c.ink} strokeWidth="3" />
      <path d="M46 40 C 72 84, 72 116, 46 160" fill="none" stroke={c.red} strokeWidth="2" opacity="0.85" />
      <path d="M154 40 C 128 84, 128 116, 154 160" fill="none" stroke={c.red} strokeWidth="2" opacity="0.85" />
      {ticks}
    </svg>
  );
}

const STEPS = [
  ["Clubs answer. Facts get checked.", "At intake every club fills out a questionnaire built on verifiable specifics — innings, pitch-count policy, certifications, practice-to-game ratio — not slogans. An admin checks the evidence before a listing goes live."],
  ["A hidden rubric does the scoring.", "Answers map to twelve development categories through a rubric the club never sees. No club sets its own number, so a paid listing can't quietly become a sales pitch."],
  ["You weigh what matters. We rank.", "Tell us your priorities and your home ZIP. The board ranks clubs your way, this season only, and flags which ones have open tryout spots near you."],
];

export default function Landing({ go }) {
  const tag = { fontFamily: mono, fontSize: 11.5, letterSpacing: "0.18em", textTransform: "uppercase", color: c.red, fontWeight: 600 };
  const btn = (primary) => ({
    fontFamily: display, fontWeight: 700, fontSize: 17, letterSpacing: "0.03em", textTransform: "uppercase", cursor: "pointer",
    padding: "12px 24px", borderRadius: 3, transition: "transform .12s ease, box-shadow .12s ease",
    border: primary ? "none" : `2px solid ${c.ink}`,
    background: primary ? c.green : "transparent", color: primary ? c.paper2 : c.ink,
    boxShadow: primary ? `3px 3px 0 ${c.greenDeep}` : `3px 3px 0 ${c.line}`,
  });

  return (
    <div style={{ fontFamily: text, color: c.ink, background: c.paper, minHeight: "100%", position: "relative",
      backgroundImage: `repeating-linear-gradient(${c.ink}0d 0 1px, transparent 1px 31px)`, backgroundPosition: "0 96px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500;700;800;900&family=Libre+Franklin:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box}
        .ob:focus-visible{outline:2px solid ${c.red};outline-offset:3px}
        .ob:hover{transform:translate(-1px,-1px)}
        @media (prefers-reduced-motion: reduce){ .ob{transition:none} .ob:hover{transform:none} }
      `}</style>
      {/* paper grain overlay */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.05, mixBlendMode: "multiply", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto", padding: "0 22px" }}>
        {/* HERO */}
        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1.45fr) minmax(0,1fr)", gap: 28, alignItems: "center", padding: "clamp(34px,6vw,66px) 0 30px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={tag}>Independent · Scored · Yours</span>
            </div>
            <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: "clamp(40px,7.4vw,84px)", lineHeight: 0.92, letterSpacing: "-0.005em", margin: 0, textTransform: "uppercase" }}>
              Scout the club,<br />not the{" "}
              <span style={{ color: c.red, position: "relative", whiteSpace: "nowrap" }}>scoreboard
                <svg viewBox="0 0 200 12" preserveAspectRatio="none" width="100%" height="10" style={{ position: "absolute", left: 0, bottom: "-2px" }} aria-hidden="true">
                  <path d="M2 8 Q 50 2, 100 7 T 198 5" fill="none" stroke={c.red} strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>.
            </h1>
            <p style={{ fontSize: "clamp(15px,2.1vw,18px)", color: c.ink2, maxWidth: 480, marginTop: 18, lineHeight: 1.55 }}>
              A managed directory that scores youth baseball organizations on how well they actually develop players — then ranks them by what <em>your</em> family cares about, and shows who has open spots nearby.
            </p>
            <div style={{ display: "flex", gap: 13, flexWrap: "wrap", marginTop: 26 }}>
              <button className="ob" style={btn(true)} onClick={() => go("parent")}>Explore as a parent</button>
              <button className="ob" style={btn(false)} onClick={() => go("admin")}>See the admin side</button>
            </div>
          </div>

          {/* baseball + ink stamp */}
          <div style={{ position: "relative", justifySelf: "center", width: "min(320px,72vw)", aspectRatio: "1" }}>
            <Baseball />
            <div style={{ position: "absolute", bottom: -6, right: -10, transform: "rotate(-11deg)", border: `2.5px solid ${c.red}`, color: c.red, fontFamily: display, fontWeight: 700, textTransform: "uppercase", padding: "4px 12px", borderRadius: 4, letterSpacing: "0.06em", background: "rgba(239,231,212,.78)" }}>
              <div style={{ fontSize: 20, lineHeight: 0.9 }}>Preview</div>
              <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: "0.18em" }}>SAMPLE DATA</div>
            </div>
          </div>
        </section>

        <Stitch />

        {/* HOW IT WORKS — scorebook entries, not cards */}
        <section style={{ padding: "40px 0 8px" }}>
          <h2 style={{ fontFamily: display, fontWeight: 700, fontSize: 16, letterSpacing: "0.16em", textTransform: "uppercase", color: c.green, margin: "0 0 22px" }}>How the scoring works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(248px,1fr))", gap: 0 }}>
            {STEPS.map(([h, p], i) => (
              <div key={i} style={{ padding: "4px 22px 18px 0", borderLeft: i === 0 ? "none" : `1px solid ${c.line}`, paddingLeft: i === 0 ? 0 : 24 }}>
                <div style={{ fontFamily: display, fontWeight: 800, fontSize: 52, lineHeight: 0.8, color: c.red, transform: "rotate(-3deg)", display: "inline-block", marginBottom: 10 }}>{i + 1}</div>
                <h3 style={{ fontFamily: display, fontWeight: 700, fontSize: 23, lineHeight: 1.04, textTransform: "uppercase", margin: "0 0 8px" }}>{h}</h3>
                <p style={{ fontSize: 14.5, color: c.mute, margin: 0, lineHeight: 1.55 }}>{p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOUSE RULES — stamped notice */}
        <section style={{ padding: "34px 0 12px" }}>
          <div style={{ position: "relative", border: `2px solid ${c.ink}`, background: c.paper2, padding: "26px 28px", maxWidth: 780 }}>
            <div style={{ position: "absolute", top: -13, left: 22, background: c.red, color: c.paper2, fontFamily: display, fontWeight: 700, fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 12px", transform: "rotate(-1.5deg)" }}>House rules</div>
            <p style={{ fontFamily: display, fontWeight: 700, fontSize: "clamp(20px,2.7vw,27px)", lineHeight: 1.2, textTransform: "uppercase", margin: 0 }}>
              Clubs pay to be listed — but never see the categories or their own scores.
            </p>
            <p style={{ fontSize: 15, color: c.ink2, margin: "12px 0 0", lineHeight: 1.55, maxWidth: 600 }}>
              Ratings come from checkable facts, not self-praise. A club can't dial up its own number, so the rankings you see stay honest. That one rule is the whole point.
            </p>
          </div>
          <div style={{ display: "flex", gap: 13, flexWrap: "wrap", marginTop: 26 }}>
            <button className="ob" style={btn(true)} onClick={() => go("parent")}>Start with your priorities</button>
            <button className="ob" style={btn(false)} onClick={() => go("account")}>Set up an account</button>
          </div>
        </section>
      </div>

      <Stitch />
      <footer style={{ position: "relative", padding: "20px 22px", textAlign: "center" }}>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: c.faint, letterSpacing: "0.04em" }}>ON DECK · PREVIEW BUILD · SAMPLE DATA, NOT REAL CLUB RATINGS</span>
      </footer>
    </div>
  );
}
