import React, { useState, useEffect } from "react";

/* =====================================================================
   ADMIN INTAKE & APPROVAL CONSOLE  (prototype)
   ---------------------------------------------------------------------
   Runs on in-memory mock data shaped like your tables so you can click
   the whole flow. The real Supabase calls are written below in comments;
   drop them in where each handler is marked  // >>> WIRE.

   load queue:
     supabase.from('org_submissions')
       .select('id,status,submitted_at,organizations(name,city,region,age_groups,contact_email),'
             + 'org_answers(question_id,value)')
       .eq('season_id', SEASON).order('submitted_at');

   load rubric (admin RLS allows this; org role cannot):
     supabase.from('questions').select('id,prompt,display_group,answer_type,options').eq('season_id',SEASON);
     supabase.from('rubric_rules').select('question_id,category_id,match_value,points').eq('season_id',SEASON);
     supabase.from('categories').select('id,key,label,default_weight');

   approve:
     await supabase.from('org_submissions').update({status:'approved',approved_at:new Date(),approved_by:uid}).eq('id',id);
     await supabase.rpc('rebuild_org_scores',{ p_org: orgId, p_season: SEASON });  // derives org_category_scores

   reject / send back:
     supabase.from('org_submissions').update({status:'rejected'}).eq('id',id);   // store reason in a notes col
     supabase.from('org_submissions').update({status:'draft'}).eq('id',id);       // returns to org to edit
   ===================================================================== */

const c = {
  ink: "#15171C", booth: "#191D25", boothLine: "#2A2F3A", boothText: "#C7CCD4",
  chalk: "#F3F4F1", card: "#FFFFFF", line: "#E4E6E1",
  clay: "#B4552D", clayDeep: "#8E3F1F",
  safe: "#2F7D52", out: "#C0392B",
  ink2: "#363B45", mute: "#6B717C", faint: "#9AA0AB",
};

const FONTS =
  "@import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');";
const display = "'Saira Condensed', system-ui, sans-serif";
const body = "'Public Sans', system-ui, sans-serif";
const mono = "'IBM Plex Mono', ui-monospace, monospace";

/* ---------- categories + default weights (from default_weights.sql) ---------- */
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
const CAT_ORDER = Object.keys(CATS);

/* ---------- questionnaire (compact mock of the seed; v = verifiable claim) ---------- */
const Q = [
  { id: "q1", cat: "player_development", group: "Program", v: true, prompt: "Per-player development tracking",
    o: [["written_plan", "Written plan + periodic family feedback", 3], ["informal", "Informal verbal feedback", 1.5], ["none", "No formal tracking", 0.5]] },
  { id: "q2", cat: "player_development", group: "Program", prompt: "Skill assessments per player / season",
    o: [["four_plus", "Four or more", 2], ["two_three", "Two to three", 1.5], ["one", "One", 1], ["none", "None", 0.5]] },
  { id: "q3", cat: "winning_perspective", group: "Game day", prompt: "Developmental playing-time allocation",
    o: [["equal", "Equal regardless of score", 3], ["mostly", "Mostly equal", 1.5], ["towin", "Coach discretion to win", 0.5]] },
  { id: "q4", cat: "winning_perspective", group: "Program", prompt: "Team formation within the club",
    o: [["tiers", "Development tiers with movement", 2], ["mixed", "Mix of skill and development", 1], ["stacked", "Top talent concentrated to win", 0.5]] },
  { id: "q5", cat: "equal_development", group: "Game day", v: true, prompt: "Innings gap, most- vs least-used (scorebook)",
    o: [["le1", "1 inning or less", 3], ["two_three", "2–3 innings", 1.5], ["four_plus", "4+ innings", 0.5]] },
  { id: "q6", cat: "equal_development", group: "Game day", prompt: "Position variety across the roster",
    o: [["all", "All rotate, incl. pitching", 2], ["some", "Some rotation", 1], ["fixed", "Fixed roles set early", 0.5]] },
  { id: "q7", cat: "player_safety", group: "Safety", v: true, prompt: "Pitch-count & rest-day policy",
    o: [["written", "Written, Pitch Smart, tracked", 3], ["informal", "Informal limits", 1.5], ["none", "No policy", 0.5]] },
  { id: "q8", cat: "player_safety", group: "Safety", v: true, prompt: "First-aid / concussion certification",
    o: [["all", "All coaches", 2], ["some", "Some coaches", 1], ["none", "None", 0.5]] },
  { id: "q9", cat: "coaching_quality", group: "Coaching", v: true, prompt: "Head coach vetting",
    o: [["credentialed", "Credentialed, background-checked", 5], ["exp", "Experienced volunteer, checked", 3], ["minimal", "Minimal vetting", 1]] },
  { id: "q10", cat: "practice_quality", group: "Schedule", prompt: "Practice-to-game ratio",
    o: [["two_one", "2:1 or higher", 5], ["one_one", "About 1:1", 3], ["game_heavy", "More games than practices", 1]] },
  { id: "q11", cat: "long_term_growth", group: "Program", v: true, prompt: "Alumni / progression tracking",
    o: [["tracked", "Tracked and shared", 5], ["anecdotal", "Anecdotal", 3], ["none", "Not tracked", 1]] },
  { id: "q12", cat: "communication", group: "Families", v: true, prompt: "Preseason written packet",
    o: [["detailed", "Detailed cost/schedule/expectations", 5], ["partial", "Partial / verbal", 3], ["no", "None", 1]] },
  { id: "q13", cat: "coach_positivity", group: "Coaching", v: true, prompt: "Conduct code + positive-coaching certs",
    o: [["written_cert", "Written code + certified staff", 5], ["written", "Written code only", 3], ["none", "Neither", 1]] },
  { id: "q14", cat: "parent_culture", group: "Families", prompt: "Parent code + sideline norms",
    o: [["signed", "Signed code + preseason meeting", 5], ["informal", "Informally communicated", 3], ["none", "Not addressed", 1]] },
  { id: "q15", cat: "character_focus", group: "Program", prompt: "Character / life-skills programming",
    o: [["curriculum", "Structured curriculum", 5], ["occasional", "Occasional talks", 3], ["none", "Not a focus", 1]] },
  { id: "q16", cat: "multi_sport", group: "Schedule", prompt: "Other-sport participation",
    o: [["encouraged", "Encouraged, no penalty", 5], ["allowed", "Allowed, may affect time", 3], ["discouraged", "Discouraged / year-round", 1]] },
];
const QBY = Object.fromEntries(Q.map((q) => [q.id, q]));
const VERIFIABLE = Q.filter((q) => q.v).map((q) => q.id);
const GROUPS = ["Program", "Coaching", "Game day", "Schedule", "Families", "Safety"];

/* ---------- mock submissions ---------- */
const seed = [
  { id: "s1", org: { name: "Northside Diamond Club", city: "Maple Heights", region: "OH", ages: "8U–14U", contact: "ops@northsidediamond.org" },
    status: "submitted", submitted: "2026-08-14", tournaments: 9,
    a: { q1: "written_plan", q2: "four_plus", q3: "equal", q4: "tiers", q5: "le1", q6: "all", q7: "written", q8: "all", q9: "credentialed", q10: "two_one", q11: "tracked", q12: "detailed", q13: "written_cert", q14: "informal", q15: "occasional", q16: "encouraged" } },
  { id: "s2", org: { name: "Apex Elite Travel", city: "Westfield", region: "IN", ages: "10U–18U", contact: "info@apexelite.com" },
    status: "submitted", submitted: "2026-08-16", tournaments: 28,
    a: { q1: "written_plan", q2: "two_three", q3: "towin", q4: "stacked", q5: "four_plus", q6: "some", q7: "informal", q8: "some", q9: "credentialed", q10: "game_heavy", q11: "tracked", q12: "partial", q13: "written", q14: "informal", q15: "none", q16: "discouraged" } },
  { id: "s3", org: { name: "Riverbend Select", city: "Cedar Falls", region: "IA", ages: "9U–13U", contact: "board@riverbendselect.org" },
    status: "submitted", submitted: "2026-08-18", tournaments: 14,
    a: { q1: "informal", q2: "two_three", q3: "mostly", q4: "mixed", q5: "two_three", q6: "some", q7: "informal", q8: "some", q9: "exp", q10: "one_one", q11: "anecdotal", q12: "partial", q13: "written", q14: "informal", q15: "occasional", q16: "allowed" } },
  { id: "s4", org: { name: "Eastlake Sluggers", city: "Eastlake", region: "OH", ages: "7U–12U", contact: "admin@eastlakesluggers.org" },
    status: "approved", submitted: "2026-08-02", tournaments: 11,
    a: { q1: "written_plan", q2: "four_plus", q3: "equal", q4: "tiers", q5: "le1", q6: "all", q7: "written", q8: "all", q9: "credentialed", q10: "two_one", q11: "tracked", q12: "detailed", q13: "written_cert", q14: "signed", q15: "curriculum", q16: "encouraged" } },
  { id: "s5", org: { name: "Maple Grove Travel", city: "Maple Grove", region: "MN", ages: "11U–16U", contact: "" },
    status: "draft", submitted: null, tournaments: null, a: { q1: "informal", q9: "exp" } },
];

/* ---------- scoring (mirrors rebuild_org_scores) ---------- */
function scores(a) {
  const out = {};
  CAT_ORDER.forEach((k) => (out[k] = 0));
  Q.forEach((q) => {
    const val = a[q.id];
    if (!val) return;
    const opt = q.o.find((x) => x[0] === val);
    if (opt) out[q.cat] += opt[2];
  });
  return out;
}
function weightedIndex(s) {
  let num = 0, den = 0;
  CAT_ORDER.forEach((k) => { if (s[k] > 0) { num += s[k] * CATS[k].w; den += CATS[k].w; } });
  return den ? Math.round((num / den) * 20) : 0; // 0–5 -> 0–100
}
function redFlags(s, tournaments) {
  const f = [];
  CAT_ORDER.forEach((k) => { if (s[k] > 0 && s[k] <= 2) f.push(CATS[k].label); });
  if (tournaments != null && tournaments > 20) f.push(`${tournaments} tournaments`);
  return f;
}

const STATUS_META = {
  submitted: { label: "Awaiting review", color: c.clay },
  approved: { label: "Approved", color: c.safe },
  rejected: { label: "Rejected", color: c.out },
  draft: { label: "Draft", color: c.faint },
};
const FILTERS = [["submitted", "Awaiting review"], ["approved", "Approved"], ["rejected", "Rejected"], ["draft", "Drafts"], ["all", "All"]];
const SEASON = "2026 Fall – 2027 Spring";

export default function AdminIntakeConsole() {
  const [subs, setSubs] = useState(seed);
  const [filter, setFilter] = useState("submitted");
  const [selId, setSelId] = useState("s1");
  const [verified, setVerified] = useState({}); // {subId: Set(questionId)}
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [flash, setFlash] = useState(null);
  const [stamp, setStamp] = useState(0);
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const r = () => setW(window.innerWidth);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);
  const mobile = w < 880;

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2600);
    return () => clearTimeout(t);
  }, [flash]);

  const queue = subs.filter((s) => filter === "all" || s.status === filter);
  const sel = subs.find((s) => s.id === selId) || null;
  const counts = Object.fromEntries(FILTERS.map(([k]) => [k, k === "all" ? subs.length : subs.filter((s) => s.status === k).length]));

  const vset = (id) => verified[id] || new Set();
  const setStatus = (id, status) => setSubs((p) => p.map((s) => (s.id === id ? { ...s, status } : s)));

  function approve() {
    if (!sel) return;
    // >>> WIRE: update org_submissions -> approved, then rpc rebuild_org_scores
    setStatus(sel.id, "approved");
    setStamp(Date.now());
    setFlash({ kind: "safe", msg: `${sel.org.name} approved — listing is live and scored.` });
  }
  function confirmReject() {
    if (!sel) return;
    // >>> WIRE: update org_submissions -> rejected (+ reason)
    setStatus(sel.id, "rejected");
    setRejecting(false); setReason("");
    setFlash({ kind: "out", msg: `${sel.org.name} rejected. The club has been notified.` });
  }
  function sendBack() {
    if (!sel) return;
    // >>> WIRE: update org_submissions -> draft (returns to org)
    setStatus(sel.id, "draft");
    setFlash({ kind: "neutral", msg: `${sel.org.name} sent back for edits.` });
  }
  function toggleVerify(qid) {
    setVerified((p) => {
      const next = new Set(p[selId] || []);
      next.has(qid) ? next.delete(qid) : next.add(qid);
      return { ...p, [selId]: next };
    });
  }

  /* ---------- small style helpers ---------- */
  const eyebrow = { fontFamily: display, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: c.clay };
  const pill = (bg, fg) => ({ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: display, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: fg, background: bg, padding: "3px 9px", borderRadius: 2 });

  return (
    <div style={{ fontFamily: body, background: c.chalk, color: c.ink, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 9px; height: 9px; }
        ::-webkit-scrollbar-thumb { background: ${c.line}; border-radius: 6px; }
        .qcard:hover { border-color: ${c.clay}; }
        .vrow:hover { background: #FAFAF8; }
        button { font-family: ${display}; cursor: pointer; }
        button:focus-visible, [tabindex]:focus-visible { outline: 2px solid ${c.clay}; outline-offset: 2px; }
        @keyframes stampIn { 0%{transform:scale(1.7) rotate(-14deg);opacity:0} 55%{transform:scale(.92) rotate(-9deg);opacity:1} 100%{transform:scale(1) rotate(-9deg);opacity:1} }
        .stamp { animation: stampIn .5s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce){ .stamp{ animation: none; } }
      `}</style>

      {/* topbar */}
      <header style={{ background: c.ink, color: "#fff", padding: "14px 20px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: display, fontWeight: 700, fontSize: 20, letterSpacing: "0.04em" }}>ON DECK</span>
          <span style={{ ...eyebrow, color: "#7E8794" }}>Intake &amp; approval</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontFamily: mono, fontSize: 12, color: "#9AA3AF" }}>{SEASON}</span>
          <span style={{ fontFamily: display, fontSize: 13, letterSpacing: "0.06em", color: c.clay }}>
            {counts.submitted} AWAITING
          </span>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* QUEUE RAIL */}
        {(!mobile || !sel || !selId || mobile) && (
          <aside style={{ width: mobile ? "100%" : 320, flexShrink: 0, background: c.booth, color: c.boothText, display: mobile && sel ? "none" : "flex", flexDirection: "column", borderRight: `1px solid ${c.boothLine}` }}>
            <div style={{ display: "flex", gap: 4, padding: 10, flexWrap: "wrap", borderBottom: `1px solid ${c.boothLine}` }}>
              {FILTERS.map(([k, label]) => (
                <button key={k} onClick={() => setFilter(k)}
                  style={{ border: "none", background: filter === k ? c.clay : "transparent", color: filter === k ? "#fff" : c.boothText, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", padding: "5px 9px", borderRadius: 2 }}>
                  {label} <span style={{ fontFamily: mono, opacity: 0.7 }}>{counts[k]}</span>
                </button>
              ))}
            </div>
            <div style={{ overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {queue.length === 0 && <p style={{ color: c.faint, fontSize: 13, padding: 12 }}>Nothing here. Pick another tab.</p>}
              {queue.map((s) => {
                const sm = STATUS_META[s.status];
                const on = s.id === selId;
                return (
                  <button key={s.id} className="qcard" onClick={() => { setSelId(s.id); setRejecting(false); }}
                    style={{ textAlign: "left", background: on ? "#222732" : "#1E222B", border: `1px solid ${on ? c.clay : c.boothLine}`, borderRadius: 3, padding: "11px 12px", color: c.boothText, fontFamily: body, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontFamily: display, fontWeight: 600, fontSize: 16, color: "#fff", lineHeight: 1.1 }}>{s.org.name}</span>
                    </div>
                    <div style={{ fontSize: 12, color: c.faint }}>{s.org.city}, {s.org.region} · {s.org.ages}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={pill("transparent", sm.color)}><span style={{ width: 6, height: 6, borderRadius: 9, background: sm.color, display: "inline-block" }} />{sm.label}</span>
                      <span style={{ fontFamily: mono, fontSize: 11, color: c.faint }}>{s.submitted || "—"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* DETAIL */}
        <main style={{ flex: 1, minWidth: 0, overflowY: "auto", display: sel && (!mobile || sel) ? "block" : "none" }}>
          {!sel ? (
            <div style={{ padding: 48, color: c.mute, maxWidth: 420 }}>
              <p style={eyebrow}>No card open</p>
              <p style={{ fontSize: 16, marginTop: 8 }}>Pick a submission from the queue to review its answers, verify the facts, and make the call.</p>
            </div>
          ) : (
            <Detail key={sel.id} sel={sel} mobile={mobile} onBack={() => setSelId(null)}
              vset={vset(sel.id)} toggleVerify={toggleVerify}
              rejecting={rejecting} setRejecting={setRejecting} reason={reason} setReason={setReason}
              approve={approve} confirmReject={confirmReject} sendBack={sendBack} stamp={stamp}
              eyebrow={eyebrow} pill={pill} />
          )}
        </main>
      </div>

      {flash && (
        <div role="status" style={{ position: "fixed", left: "50%", bottom: 22, transform: "translateX(-50%)", background: c.ink, color: "#fff", padding: "11px 18px", borderRadius: 3, fontSize: 14, boxShadow: "0 8px 30px rgba(0,0,0,.25)", borderLeft: `3px solid ${flash.kind === "safe" ? c.safe : flash.kind === "out" ? c.out : c.clay}` }}>
          {flash.msg}
        </div>
      )}
    </div>
  );
}

function Detail({ sel, mobile, onBack, vset, toggleVerify, rejecting, setRejecting, reason, setReason, approve, confirmReject, sendBack, stamp, eyebrow, pill }) {
  const s = scores(sel.a);
  const idx = weightedIndex(s);
  const flags = redFlags(s, sel.tournaments);
  const total = Object.values(sel.a).filter(Boolean).length;
  const vNeeded = VERIFIABLE.filter((q) => sel.a[q]);
  const vDone = vNeeded.filter((q) => vset.has(q)).length;
  const decided = sel.status === "approved" || sel.status === "rejected";
  const sm = STATUS_META[sel.status];

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: mobile ? "16px" : "26px 34px", position: "relative" }}>
      {mobile && <button onClick={onBack} style={{ border: "none", background: "none", color: c.clay, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 12 }}>‹ QUEUE</button>}

      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={eyebrow}>Intake review</p>
          <h1 style={{ fontFamily: display, fontWeight: 700, fontSize: mobile ? 30 : 40, lineHeight: 1, margin: "4px 0 6px" }}>{sel.org.name}</h1>
          <p style={{ color: c.mute, fontSize: 14, margin: 0 }}>{sel.org.city}, {sel.org.region} · {sel.org.ages} · {sel.org.contact || "no contact on file"}</p>
          <div style={{ marginTop: 10 }}><span style={pill("transparent", sm.color)}><span style={{ width: 7, height: 7, borderRadius: 9, background: sm.color, display: "inline-block" }} />{sm.label}{sel.submitted ? ` · submitted ${sel.submitted}` : ""}</span></div>
        </div>

        {/* stamp on approve */}
        {sel.status === "approved" && (
          <div className={stamp ? "stamp" : ""} style={{ border: `3px solid ${c.safe}`, color: c.safe, fontFamily: display, fontWeight: 700, padding: "6px 14px", borderRadius: 4, textAlign: "center", letterSpacing: "0.08em", transform: "rotate(-9deg)" }}>
            <div style={{ fontSize: 20, lineHeight: 1 }}>APPROVED</div>
            <div style={{ fontSize: 10, letterSpacing: "0.2em" }}>LISTING LIVE</div>
          </div>
        )}
        {sel.status === "rejected" && (
          <div style={{ border: `3px solid ${c.out}`, color: c.out, fontFamily: display, fontWeight: 700, padding: "6px 14px", borderRadius: 4, letterSpacing: "0.08em", transform: "rotate(-9deg)", fontSize: 20 }}>REJECTED</div>
        )}
      </div>

      {/* action bar */}
      {!decided && (
        <div style={{ display: "flex", gap: 10, margin: "18px 0 6px", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={approve} style={{ background: c.safe, color: "#fff", border: "none", borderRadius: 3, padding: "11px 20px", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em" }}>Approve &amp; publish</button>
          <button onClick={() => setRejecting(true)} style={{ background: "#fff", color: c.out, border: `1.5px solid ${c.out}`, borderRadius: 3, padding: "11px 18px", fontSize: 14, fontWeight: 700 }}>Reject</button>
          <button onClick={sendBack} style={{ background: "transparent", color: c.ink2, border: `1.5px solid ${c.line}`, borderRadius: 3, padding: "11px 18px", fontSize: 14, fontWeight: 600 }}>Send back for edits</button>
          {vDone < vNeeded.length && (
            <span style={{ fontSize: 13, color: c.clay, fontWeight: 600 }}>· {vNeeded.length - vDone} claim{vNeeded.length - vDone === 1 ? "" : "s"} unverified</span>
          )}
        </div>
      )}
      {rejecting && !decided && (
        <div style={{ background: "#fff", border: `1px solid ${c.line}`, borderRadius: 4, padding: 14, margin: "10px 0" }}>
          <label style={{ ...eyebrow, color: c.out }}>Reason sent to club</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="What needs to change before this can be listed?"
            style={{ width: "100%", marginTop: 8, border: `1px solid ${c.line}`, borderRadius: 3, padding: 10, fontFamily: body, fontSize: 14, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={confirmReject} style={{ background: c.out, color: "#fff", border: "none", borderRadius: 3, padding: "9px 16px", fontSize: 13, fontWeight: 700 }}>Confirm reject</button>
            <button onClick={() => setRejecting(false)} style={{ background: "transparent", border: `1px solid ${c.line}`, borderRadius: 3, padding: "9px 16px", fontSize: 13, color: c.mute }}>Keep reviewing</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 300px", gap: 22, marginTop: 22, alignItems: "start" }}>
        {/* LEFT: verification ledger */}
        <section>
          <p style={eyebrow}>Verification ledger</p>
          <p style={{ fontSize: 13, color: c.mute, margin: "4px 0 14px" }}>
            What the club entered. For claims backed by a document or certification, check the box once you&rsquo;ve seen the evidence — {vDone} of {vNeeded.length} verified.
          </p>
          {GROUPS.map((g) => {
            const rows = Q.filter((q) => q.group === g && sel.a[q.id]);
            if (!rows.length) return null;
            return (
              <div key={g} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: display, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: c.ink2, borderBottom: `1px solid ${c.line}`, paddingBottom: 5, marginBottom: 2 }}>{g}</div>
                {rows.map((q) => {
                  const opt = q.o.find((x) => x[0] === sel.a[q.id]);
                  const isV = vset.has(q.id);
                  return (
                    <div key={q.id} className="vrow" style={{ display: "flex", gap: 12, padding: "10px 4px", borderBottom: `1px solid #EEF0EC` }}>
                      <div style={{ width: 18, flexShrink: 0, paddingTop: 2 }}>
                        {q.v ? (
                          <input type="checkbox" checked={isV} onChange={() => toggleVerify(q.id)} disabled={decided}
                            aria-label={`Mark ${q.prompt} verified`}
                            style={{ width: 16, height: 16, accentColor: c.safe, cursor: decided ? "default" : "pointer" }} />
                        ) : <span style={{ color: c.faint, fontSize: 12 }}>—</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: c.ink }}>{q.prompt}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: opt && opt[2] <= 1.5 ? c.out : c.ink2 }}>{opt ? opt[1] : "—"}</div>
                      </div>
                      {/* admin-only mapping */}
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <div style={{ fontFamily: display, fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: c.clay }}>{CATS[q.cat].label}</div>
                        <div style={{ fontFamily: mono, fontSize: 13, color: c.ink2 }}>+{opt ? opt[2] : 0}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: c.mute, paddingTop: 6 }}>
            <span>{total} answers · tournaments last season: <b style={{ fontFamily: mono, color: sel.tournaments > 20 ? c.out : c.ink }}>{sel.tournaments ?? "—"}</b></span>
          </div>
        </section>

        {/* RIGHT: derived scores — admin only */}
        <aside style={{ background: c.ink, color: "#fff", borderRadius: 4, padding: 18, position: mobile ? "static" : "sticky", top: 18 }}>
          <div style={{ ...pill("rgba(180,85,45,.18)", "#E8A883"), marginBottom: 12 }}>● Your eyes only</div>
          <p style={{ fontSize: 12, color: "#9AA3AF", margin: "0 0 14px" }}>Derived from the answers. Parents see this; the club never sees categories or scores.</p>

          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: mono, fontSize: 44, fontWeight: 600, lineHeight: 1 }}>{idx}</span>
            <span style={{ fontFamily: mono, fontSize: 15, color: "#9AA3AF" }}>/100</span>
          </div>
          <div style={{ fontSize: 11, color: "#7E8794", letterSpacing: "0.04em", marginBottom: 14 }}>WEIGHTED · DEFAULT PROFILE</div>

          {CAT_ORDER.map((k) => {
            const v = s[k]; const low = v > 0 && v <= 2;
            return (
              <div key={k} style={{ marginBottom: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
                  <span style={{ color: low ? "#F0A79A" : "#CDD2DA" }}>{CATS[k].label}</span>
                  <span style={{ fontFamily: mono, color: low ? c.out : "#fff" }}>{v.toFixed(1)}</span>
                </div>
                <div style={{ height: 4, background: "#2A2F3A", borderRadius: 3 }}>
                  <div style={{ height: 4, width: `${(v / 5) * 100}%`, background: low ? c.out : c.safe, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}

          {flags.length > 0 && (
            <div style={{ marginTop: 14, borderTop: "1px solid #2A2F3A", paddingTop: 12 }}>
              <div style={{ fontFamily: display, fontSize: 11, letterSpacing: "0.1em", color: c.out, textTransform: "uppercase", marginBottom: 7 }}>Red flags</div>
              {flags.map((f, i) => (
                <div key={i} style={{ fontSize: 12.5, color: "#F0A79A", marginBottom: 4 }}>▲ {f}</div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
