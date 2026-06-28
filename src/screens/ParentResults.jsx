import React, { useState, useEffect, useMemo } from "react";

/* =====================================================================
   PARENT RANKED RESULTS  (prototype)
   ---------------------------------------------------------------------
   Mock data shaped like what the parent endpoint returns. Ranking is
   computed client-side from category scores x the parent's weights so the
   sliders feel instant. Real Supabase calls below; // >>> WIRE at handlers.

   load listings (parent RLS: current season, approved orgs only):
     supabase.from('public_listings').select('*');           // the view we built
     supabase.from('org_openings').select('*').eq('season_id',SEASON);
     supabase.from('organizations').select('id,lat,lng,...'); // facts incl. coords/cost

   effective weights (custom over default):
     supabase.rpc('parent_effective_weights');               // [{category_key, weight}]

   save my priorities / home:
     supabase.from('parent_preferences').upsert({ weights, home_lat, home_lng });

   save a private note (season-scoped, RLS-locked to me):
     supabase.from('parent_evaluations').upsert({ org_id, season_id:SEASON, notes });
   ===================================================================== */

const c = {
  ink: "#1A201A", paper: "#F4F6F0", card: "#FFFFFF", line: "#E5E8DF",
  turf: "#2F6B3D", turfDeep: "#234E2D", turfSoft: "#EAF1E7",
  clay: "#B4552D", out: "#C0392B",
  ink2: "#3C4338", mute: "#6C7366", faint: "#99A091",
};
const FONTS =
  "@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');";
const display = "'Bricolage Grotesque', system-ui, sans-serif";
const body = "'Public Sans', system-ui, sans-serif";
const mono = "'IBM Plex Mono', ui-monospace, monospace";

const CATS = {
  player_development: { label: "Player Development", w: 11 },
  coaching_quality: { label: "Coaching Quality", w: 10 },
  practice_quality: { label: "Practice Quality", w: 10 },
  player_safety: { label: "Player Safety & Arm Care", w: 10 },
  long_term_growth: { label: "Long-Term Growth", w: 9 },
  communication: { label: "Communication", w: 8 },
  coach_positivity: { label: "Coach Positivity", w: 8 },
  winning_perspective: { label: "Winning in Perspective", w: 7 },
  equal_development: { label: "Equal Development", w: 7 },
  character_focus: { label: "Character & Values", w: 7 },
  parent_culture: { label: "Parent / Sideline Culture", w: 7 },
  multi_sport: { label: "Multi-Sport Support", w: 6 },
};
const ORDER = Object.keys(CATS);
const balanced = Object.fromEntries(ORDER.map((k) => [k, CATS[k].w]));

const PRESETS = {
  Balanced: balanced,
  "Development-first": { player_development: 12, long_term_growth: 11, coaching_quality: 10, practice_quality: 10, equal_development: 9, multi_sport: 8, character_focus: 8, coach_positivity: 8, winning_perspective: 8, communication: 7, player_safety: 9, parent_culture: 6 },
  Competitive: { coaching_quality: 12, practice_quality: 12, player_development: 11, player_safety: 9, long_term_growth: 8, communication: 7, winning_perspective: 4, equal_development: 4, multi_sport: 3, coach_positivity: 6, character_focus: 5, parent_culture: 5 },
  "Safety-first": { player_safety: 12, coaching_quality: 11, communication: 9, coach_positivity: 9, player_development: 9, parent_culture: 8, practice_quality: 7, character_focus: 7, long_term_growth: 7, equal_development: 7, winning_perspective: 6, multi_sport: 6 },
};

const HOME = { name: "Brookside", lat: 39.10, lng: -94.58 };
const sc = (a) => Object.fromEntries(ORDER.map((k, i) => [k, a[i]])); // helper: array -> cat map
const ORGS = [
  { id: "o1", name: "Northside Diamond Club", city: "Liberty", region: "MO", lat: 39.246, lng: -94.419, ages: ["8U", "10U", "12U", "14U"], cost: 1450, tournaments: 9,
    s: sc([5, 5, 5, 5, 4.5, 5, 4, 4.5, 4.5, 3.5, 3, 5]), open: [["10U", 2, "Sep 7"], ["12U", 1, "Sep 7"]] },
  { id: "o2", name: "Apex Elite Travel", city: "Overland Park", region: "KS", lat: 38.982, lng: -94.671, ages: ["10U", "12U", "14U", "16U", "18U"], cost: 3200, tournaments: 28,
    s: sc([4.5, 5, 1, 5, 5, 3, 3, 1, 1.5, 1, 3, 1]), open: [["14U", 3, "Aug 30"]] },
  { id: "o3", name: "Riverbend Select", city: "Lee's Summit", region: "MO", lat: 38.910, lng: -94.382, ages: ["9U", "11U", "13U"], cost: 1100, tournaments: 14,
    s: sc([3, 3, 2.5, 2.5, 3, 3, 3, 2.5, 2.5, 3, 3, 3]), open: [] },
  { id: "o4", name: "Eastlake Sluggers", city: "Independence", region: "MO", lat: 39.091, lng: -94.415, ages: ["7U", "8U", "10U", "12U"], cost: 950, tournaments: 11,
    s: sc([4.5, 4.5, 4, 5, 4, 4.5, 5, 4.5, 4.5, 4.5, 4.5, 5]), open: [["8U", 4, "Sep 1"], ["10U", 2, "Sep 1"]] },
  { id: "o5", name: "Prairie Sluggers", city: "Olathe", region: "KS", lat: 38.881, lng: -94.819, ages: ["7U", "8U", "9U", "10U"], cost: 600, tournaments: 5,
    s: sc([3, 2.5, 2.5, 3.5, 3, 3.5, 5, 4.5, 5, 4, 5, 5]), open: [["9U", 5, "rolling"]] },
  { id: "o6", name: "Crosstown Baseball Academy", city: "Kansas City", region: "MO", lat: 39.099, lng: -94.578, ages: ["9U", "11U", "13U", "15U"], cost: 2400, tournaments: 18,
    s: sc([5, 5, 5, 5, 4.5, 4, 3.5, 2.5, 3, 3, 3, 2]), open: [["11U", 1, "Aug 28"], ["13U", 2, "Aug 28"]] },
  { id: "o7", name: "Hometown LL Select", city: "Gladstone", region: "MO", lat: 39.204, lng: -94.554, ages: ["8U", "10U", "12U"], cost: 700, tournaments: 6,
    s: sc([3, 3, 3, 3.5, 3.5, 4, 5, 5, 4, 5, 5, 5]), open: [["12U", 3, "Sep 5"]] },
];
const AGE_OPTS = ["all", ...Array.from(new Set(ORGS.flatMap((o) => o.ages))).sort((a, b) => parseInt(a) - parseInt(b))];

function haversine(a, b) {
  const R = 3958.8, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}
function fit(s, w) {
  let n = 0, d = 0;
  ORDER.forEach((k) => { n += s[k] * w[k]; d += w[k]; });
  return d ? Math.round((n / d) * 20) : 0;
}
function flags(o) {
  const f = [];
  ORDER.forEach((k) => { if (o.s[k] <= 2) f.push(CATS[k].label); });
  if (o.tournaments > 20) f.push(`${o.tournaments} tournaments`);
  return f;
}

export default function ParentResults() {
  const [weights, setWeights] = useState(balanced);
  const [preset, setPreset] = useState("Balanced");
  const [age, setAge] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [maxDist, setMaxDist] = useState(60);
  const [sort, setSort] = useState("fit");
  const [expanded, setExpanded] = useState("o1");
  const [stars, setStars] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [panel, setPanel] = useState(false);
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const r = () => setW(window.innerWidth); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);
  const mobile = w < 920;

  function applyPreset(name) { setPreset(name); setWeights(PRESETS[name]); }
  function setWeight(k, v) { setWeights((p) => ({ ...p, [k]: v })); setPreset("Custom"); }
  function toggleStar(id) { setStars((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  const ranked = useMemo(() => {
    return ORGS
      .map((o) => ({ ...o, dist: haversine(HOME, o), fitScore: fit(o.s, weights), openCount: o.open.reduce((a, x) => a + x[1], 0) }))
      .filter((o) => age === "all" || o.ages.includes(age))
      .filter((o) => !openOnly || (age === "all" ? o.open.length > 0 : o.open.some((x) => x[0] === age)))
      .filter((o) => o.dist <= maxDist)
      .sort((a, b) => sort === "distance" ? a.dist - b.dist : sort === "cost" ? a.cost - b.cost : b.fitScore - a.fitScore);
    // >>> WIRE: replace ORGS with rows from public_listings + org_openings; fit() math unchanged
  }, [weights, age, openOnly, maxDist, sort]);

  const eyebrow = { fontFamily: display, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: c.clay };

  const Priorities = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <p style={eyebrow}>Quick start</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {Object.keys(PRESETS).map((n) => (
            <button key={n} onClick={() => applyPreset(n)}
              style={{ border: `1px solid ${preset === n ? c.turf : c.line}`, background: preset === n ? c.turf : "#fff", color: preset === n ? "#fff" : c.ink2, fontFamily: body, fontWeight: 600, fontSize: 12.5, padding: "6px 11px", borderRadius: 20, cursor: "pointer" }}>{n}</button>
          ))}
          {preset === "Custom" && <span style={{ ...eyebrow, color: c.turf, alignSelf: "center" }}>Custom</span>}
        </div>
      </div>
      <div>
        <p style={eyebrow}>What matters to you</p>
        <p style={{ fontSize: 12.5, color: c.mute, margin: "4px 0 10px" }}>Slide to weight each. The board re-ranks as you go.</p>
        {ORDER.map((k) => (
          <div key={k} style={{ marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 2 }}>
              <span style={{ color: c.ink2 }}>{CATS[k].label}</span>
              <span style={{ fontFamily: mono, color: weights[k] === 0 ? c.faint : c.turf }}>{weights[k]}</span>
            </div>
            <input type="range" min={0} max={12} step={1} value={weights[k]} onChange={(e) => setWeight(k, +e.target.value)}
              aria-label={CATS[k].label} style={{ width: "100%", accentColor: c.turf }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: body, background: c.paper, color: c.ink, minHeight: "100%" }}>
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; }
        button:focus-visible, input:focus-visible, select:focus-visible, [tabindex]:focus-visible { outline: 2px solid ${c.turf}; outline-offset: 2px; }
        .ocard { transition: box-shadow .15s ease, border-color .15s ease; }
        .ocard:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); }
        select, input[type=range] { font-family: ${body}; }
        @media (prefers-reduced-motion: reduce){ .ocard{ transition:none; } }
      `}</style>

      <header style={{ background: c.ink, color: "#fff", padding: "14px 20px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: display, fontWeight: 700, fontSize: 21, letterSpacing: "-0.01em" }}>The Bench</span>
          <span style={{ ...eyebrow, color: "#8A9382" }}>Find your club</span>
        </div>
        <span style={{ fontFamily: mono, fontSize: 12, color: "#9AA391" }}>2026 Fall – 2027 Spring · home: {HOME.name}</span>
      </header>

      <div style={{ display: "flex", maxWidth: 1180, margin: "0 auto", alignItems: "flex-start" }}>
        {/* PRIORITIES */}
        {!mobile && (
          <aside style={{ width: 300, flexShrink: 0, padding: "22px 18px", position: "sticky", top: 0, alignSelf: "flex-start", maxHeight: "100vh", overflowY: "auto" }}>{Priorities}</aside>
        )}

        {/* RESULTS */}
        <main style={{ flex: 1, minWidth: 0, padding: mobile ? "16px" : "22px 26px", borderLeft: mobile ? "none" : `1px solid ${c.line}` }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <h1 style={{ fontFamily: display, fontWeight: 700, fontSize: mobile ? 26 : 32, margin: 0 }}>{ranked.length} club{ranked.length === 1 ? "" : "s"} for your family</h1>
            {mobile && <button onClick={() => setPanel(true)} style={{ border: `1px solid ${c.turf}`, background: "#fff", color: c.turf, fontWeight: 700, fontSize: 13, padding: "8px 14px", borderRadius: 20 }}>Priorities</button>}
          </div>
          <p style={{ color: c.mute, fontSize: 13.5, marginTop: 0 }}>Ranked by what you said matters, this season only. You see the scores; clubs never do.</p>

          {/* filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "14px 0 18px" }}>
            <Sel label="Age" value={age} onChange={setAge} opts={AGE_OPTS.map((a) => [a, a === "all" ? "All ages" : a])} />
            <Sel label="Sort" value={sort} onChange={setSort} opts={[["fit", "Best fit"], ["distance", "Closest"], ["cost", "Lowest cost"]]} />
            <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: c.ink2, background: "#fff", border: `1px solid ${c.line}`, borderRadius: 6, padding: "7px 11px", cursor: "pointer" }}>
              <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} style={{ accentColor: c.turf }} /> Open spots only
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: c.ink2, background: "#fff", border: `1px solid ${c.line}`, borderRadius: 6, padding: "7px 11px" }}>
              Within <b style={{ fontFamily: mono }}>{maxDist}</b> mi
              <input type="range" min={5} max={60} step={5} value={maxDist} onChange={(e) => setMaxDist(+e.target.value)} style={{ width: 90, accentColor: c.turf }} />
            </label>
          </div>

          {ranked.length === 0 && (
            <div style={{ background: "#fff", border: `1px dashed ${c.line}`, borderRadius: 8, padding: 28, textAlign: "center", color: c.mute }}>
              <p style={{ ...eyebrow, color: c.clay }}>Nothing matches yet</p>
              <p style={{ fontSize: 15, margin: "6px 0 0" }}>Widen the distance, clear the age filter, or turn off &ldquo;open spots only.&rdquo;</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ranked.map((o, i) => {
              const fl = flags(o);
              const isOpen = expanded === o.id;
              const matchOpen = age === "all" ? o.open : o.open.filter((x) => x[0] === age);
              return (
                <article key={o.id} className="ocard" style={{ background: "#fff", border: `1px solid ${c.line}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", gap: 14, padding: mobile ? 14 : "16px 18px", cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : o.id)}>
                    <div style={{ width: 34, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 600, color: c.turf, lineHeight: 1 }}>{sort === "fit" ? i + 1 : "•"}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                        <h2 style={{ fontFamily: display, fontWeight: 700, fontSize: mobile ? 18 : 20, margin: 0 }}>{o.name}</h2>
                        <button onClick={(e) => { e.stopPropagation(); toggleStar(o.id); }} aria-label="Shortlist"
                          style={{ border: "none", background: "none", fontSize: 16, color: stars.has(o.id) ? c.clay : c.faint, cursor: "pointer", lineHeight: 1 }}>{stars.has(o.id) ? "★" : "☆"}</button>
                      </div>
                      <div style={{ fontSize: 13, color: c.mute, marginTop: 2 }}>{o.city}, {o.region} · <span style={{ fontFamily: mono }}>{o.dist}</span> mi · ${o.cost.toLocaleString()}/season · {o.ages[0]}–{o.ages[o.ages.length - 1]}</div>
                      {/* mini category strip */}
                      <div style={{ display: "flex", gap: 3, marginTop: 10 }}>
                        {ORDER.map((k) => (
                          <div key={k} title={`${CATS[k].label}: ${o.s[k]}`} style={{ flex: 1, height: 7, borderRadius: 2, background: c.line, position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", inset: 0, transformOrigin: "left", transform: `scaleX(${o.s[k] / 5})`, background: o.s[k] <= 2 ? c.out : c.turf }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                        {matchOpen.length > 0
                          ? <Badge bg={c.turfSoft} fg={c.turfDeep}>{matchOpen.reduce((a, x) => a + x[1], 0)} spots · {matchOpen.map((x) => x[0]).join(", ")}</Badge>
                          : <Badge bg="#F1EFEA" fg={c.mute}>Roster full</Badge>}
                        {fl.length > 0 && <Badge bg="#FBEAE7" fg={c.out}>▲ {fl.length} flag{fl.length === 1 ? "" : "s"}</Badge>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: mono, fontSize: mobile ? 26 : 32, fontWeight: 600, lineHeight: 1, color: c.ink }}>{o.fitScore}</div>
                      <div style={{ ...eyebrow, fontSize: 9.5, color: c.faint }}>your fit</div>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${c.line}`, padding: mobile ? 14 : "16px 18px", background: "#FCFCFA", display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.2fr 1fr", gap: 20 }}>
                      <div>
                        <p style={eyebrow}>How it scores on your priorities</p>
                        <div style={{ marginTop: 8 }}>
                          {ORDER.map((k) => (
                            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                              <span style={{ width: mobile ? 120 : 150, fontSize: 12.5, color: c.ink2, flexShrink: 0 }}>{CATS[k].label}</span>
                              <div style={{ flex: 1, height: 6, background: c.line, borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: 6, width: `${(o.s[k] / 5) * 100}%`, background: o.s[k] <= 2 ? c.out : c.turf }} />
                              </div>
                              <span style={{ fontFamily: mono, fontSize: 12, color: o.s[k] <= 2 ? c.out : c.ink2, width: 26, textAlign: "right" }}>{o.s[k]}</span>
                              <span style={{ fontFamily: mono, fontSize: 10.5, color: weights[k] === 0 ? c.faint : c.clay, width: 26, textAlign: "right" }} title="your weight">×{weights[k]}</span>
                            </div>
                          ))}
                        </div>
                        {fl.length > 0 && <p style={{ fontSize: 12.5, color: c.out, marginTop: 10 }}>▲ Worth asking about: {fl.join(", ")}.</p>}
                      </div>
                      <div>
                        <p style={eyebrow}>Tryouts &amp; openings</p>
                        <div style={{ marginTop: 8, marginBottom: 16 }}>
                          {o.open.length === 0 ? <p style={{ fontSize: 13, color: c.mute, margin: 0 }}>No open spots listed this season.</p>
                            : o.open.map((x, j) => (
                              <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${c.line}` }}>
                                <span><b>{x[0]}</b> · {x[1]} spot{x[1] === 1 ? "" : "s"}</span>
                                <span style={{ fontFamily: mono, color: c.turfDeep }}>tryout {x[2]}</span>
                              </div>
                            ))}
                        </div>
                        <p style={eyebrow}>Your private notes</p>
                        <textarea value={notes[o.id] || ""} onChange={(e) => setNotes((p) => ({ ...p, [o.id]: e.target.value }))}
                          placeholder="Only you can see this — questions to ask, gut feel, who you talked to…"
                          rows={3} style={{ width: "100%", marginTop: 8, border: `1px solid ${c.line}`, borderRadius: 6, padding: 10, fontFamily: body, fontSize: 13, resize: "vertical" }} />
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </main>
      </div>

      {/* mobile priorities sheet */}
      {mobile && panel && (
        <div onClick={() => setPanel(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 40, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "86%", maxWidth: 340, background: c.paper, height: "100%", overflowY: "auto", padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: display, fontWeight: 700, fontSize: 18 }}>Your priorities</span>
              <button onClick={() => setPanel(false)} style={{ border: "none", background: "none", fontSize: 22, color: c.mute, cursor: "pointer" }}>×</button>
            </div>
            {Priorities}
          </div>
        </div>
      )}
    </div>
  );
}

function Sel({ label, value, onChange, opts }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: c.mute, background: "#fff", border: `1px solid ${c.line}`, borderRadius: 6, padding: "5px 9px" }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ border: "none", background: "none", fontSize: 13, fontWeight: 600, color: c.ink, cursor: "pointer" }}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
function Badge({ children, bg, fg }) {
  return <span style={{ fontFamily: body, fontSize: 11.5, fontWeight: 600, color: fg, background: bg, padding: "3px 9px", borderRadius: 20 }}>{children}</span>;
}
