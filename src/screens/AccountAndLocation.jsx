import React, { useState, useMemo } from "react";

/* =====================================================================
   PARENT ACCOUNT — auth + home location  (prototype)
   ---------------------------------------------------------------------
   This is the layer that makes the parent's settings persist. Weights,
   notes, and home location are RLS-locked to auth.uid(), so they only
   save once someone is signed in. Real Supabase calls in comments; the
   demo flips state locally so you can click the whole flow.

   AUTH (Supabase):
     supabase.auth.signUp({ email, password })
     supabase.auth.signInWithPassword({ email, password })
     supabase.auth.signInWithOtp({ email })            // magic link, no password
     supabase.auth.signInWithOAuth({ provider:'google' })
     supabase.auth.getSession() / onAuthStateChange()  // gate the app on this

   ON SIGN-IN, load saved settings (or seed defaults for a new account):
     supabase.from('parent_preferences').select('weights,home_lat,home_lng,home_address')
       .eq('user_id', uid).maybeSingle();

   SAVE HOME (and weights) — upsert, RLS confirms ownership:
     supabase.from('parent_preferences')
       .upsert({ user_id: uid, home_address, home_lat, home_lng });

   GEOCODING the home — three offline-friendly options, pick one:
     1. ZIP centroid table (what the demo uses): coarse but exact enough for
        a mileage radius, no API, no precise-address exposure. Ship a static
        ZIP->lat/lng table or a tiny lookup table in Postgres.
     2. navigator.geolocation: one tap, precise, no API. Needs permission.
     3. Geocoding API (Google/Mapbox/Nominatim) for full street addresses.
   Either way you END UP with lat/lng in parent_preferences; haversine in
   the results view does the rest. (No driving-distance API needed.)
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
const bodyF = "'Public Sans', system-ui, sans-serif";
const mono = "'IBM Plex Mono', ui-monospace, monospace";

// demo ZIP centroids (KC metro). Real app: full table or geocode call.
const ZIPS = {
  "64111": { lat: 39.057, lng: -94.591, place: "Kansas City, MO" },
  "64068": { lat: 39.246, lng: -94.419, place: "Liberty, MO" },
  "64064": { lat: 38.930, lng: -94.390, place: "Lee's Summit, MO" },
  "64118": { lat: 39.210, lng: -94.560, place: "Gladstone, MO" },
  "66062": { lat: 38.881, lng: -94.819, place: "Olathe, KS" },
  "66212": { lat: 38.970, lng: -94.671, place: "Overland Park, KS" },
};
// a few club coords, only to preview "N clubs within R mi"
const CLUBS = [
  { lat: 39.246, lng: -94.419 }, { lat: 38.982, lng: -94.671 }, { lat: 38.910, lng: -94.382 },
  { lat: 39.091, lng: -94.415 }, { lat: 38.881, lng: -94.819 }, { lat: 39.099, lng: -94.578 }, { lat: 39.204, lng: -94.554 },
];
function haversine(a, b) {
  const R = 3958.8, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

export default function AccountAndLocation() {
  const [session, setSession] = useState(null);       // null = signed out
  const [mode, setMode] = useState("signin");          // signin | signup
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  // home location state (would load from parent_preferences on sign-in)
  const [home, setHome] = useState(null);              // {lat,lng,place}
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(30);
  const [locMsg, setLocMsg] = useState("");
  const [saved, setSaved] = useState(false);

  function submitAuth() {
    setErr("");
    if (!email.includes("@")) return setErr("Enter a valid email address.");
    if (pw.length < 8) return setErr("Use at least 8 characters for your password.");
    // >>> WIRE: supabase.auth.signInWithPassword / signUp; on success setSession(data.session)
    setSession({ email });
    // >>> WIRE: load parent_preferences here; if a home_lat exists, setHome(...)
  }
  function magicLink() {
    if (!email.includes("@")) return setErr("Enter your email and we'll send a sign-in link.");
    // >>> WIRE: supabase.auth.signInWithOtp({ email })
    setErr(""); setLocMsg(""); setSession({ email, magic: true });
  }
  function signOut() {
    // >>> WIRE: supabase.auth.signOut()
    setSession(null); setHome(null); setZip(""); setSaved(false);
  }

  function resolveZip() {
    setSaved(false);
    const hit = ZIPS[zip.trim()];
    if (!hit) { setLocMsg(`No match for "${zip}". Try 64111, 64068, 64064, 66062, 66212, or 64118.`); return; }
    setLocMsg(""); setHome({ lat: hit.lat, lng: hit.lng, place: `${hit.place} · ${zip.trim()}` });
  }
  function useMyLocation() {
    setSaved(false);
    if (typeof navigator === "undefined" || !navigator.geolocation) { setLocMsg("This browser can't share location — enter your ZIP instead."); return; }
    // >>> WIRE: same call in production; store coords to parent_preferences
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocMsg(""); setHome({ lat: p.coords.latitude, lng: p.coords.longitude, place: "Your current location" }); },
      () => setLocMsg("Couldn't get your location — enter your ZIP instead.")
    );
  }
  function saveHome() {
    // >>> WIRE: supabase.from('parent_preferences').upsert({ user_id, home_lat, home_lng, home_address })
    setSaved(true);
  }

  const within = useMemo(() => home ? CLUBS.filter((cl) => haversine(home, cl) <= radius).length : 0, [home, radius]);
  const eyebrow = { fontFamily: display, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: c.clay };
  const field = { width: "100%", border: `1px solid ${c.line}`, borderRadius: 8, padding: "11px 12px", fontFamily: bodyF, fontSize: 15, marginTop: 6 };
  const primaryBtn = { background: c.turf, color: "#fff", border: "none", borderRadius: 8, padding: "12px 18px", fontFamily: bodyF, fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%" };

  return (
    <div style={{ fontFamily: bodyF, background: c.paper, color: c.ink, minHeight: "100%" }}>
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; }
        button:focus-visible, input:focus-visible { outline: 2px solid ${c.turf}; outline-offset: 2px; }
        input::placeholder { color: ${c.faint}; }
      `}</style>

      <header style={{ background: c.ink, color: "#fff", padding: "14px 20px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: display, fontWeight: 700, fontSize: 21 }}>The Bench</span>
          <span style={{ ...eyebrow, color: "#8A9382" }}>{session ? "Your account" : "Sign in"}</span>
        </div>
        {session && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: mono, fontSize: 12, color: "#9AA391" }}>{session.email}</span>
            <button onClick={signOut} style={{ border: "1px solid #3A4138", background: "none", color: "#C7CCC2", fontFamily: bodyF, fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 6, cursor: "pointer" }}>Sign out</button>
          </div>
        )}
      </header>

      {!session ? (
        /* ---------------- AUTH ---------------- */
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "40px 20px" }}>
          {session?.magic}
          <p style={eyebrow}>{mode === "signin" ? "Welcome back" : "Create your account"}</p>
          <h1 style={{ fontFamily: display, fontWeight: 700, fontSize: 30, margin: "6px 0 4px", lineHeight: 1.05 }}>
            {mode === "signin" ? "Sign in to The Bench" : "Start comparing clubs"}
          </h1>
          <p style={{ color: c.mute, fontSize: 14, marginTop: 0 }}>
            An account saves your priorities, your home location, and your private notes — and keeps your research yours.
          </p>

          <div style={{ background: "#fff", border: `1px solid ${c.line}`, borderRadius: 12, padding: 20, marginTop: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: c.ink2 }}>Email
              <input style={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </label>
            <label style={{ fontSize: 13, fontWeight: 600, color: c.ink2, display: "block", marginTop: 14 }}>Password
              <input style={field} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} />
            </label>
            {err && <p style={{ color: c.out, fontSize: 13, margin: "10px 0 0" }}>{err}</p>}
            <button onClick={submitAuth} style={{ ...primaryBtn, marginTop: 16 }}>{mode === "signin" ? "Sign in" : "Create account"}</button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: c.line }} /><span style={{ fontSize: 12, color: c.faint }}>or</span><div style={{ flex: 1, height: 1, background: c.line }} />
            </div>
            <button onClick={magicLink} style={{ width: "100%", background: "#fff", border: `1px solid ${c.line}`, borderRadius: 8, padding: "11px", fontFamily: bodyF, fontWeight: 600, fontSize: 14, color: c.ink2, cursor: "pointer" }}>
              Email me a sign-in link
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: 14, color: c.mute, marginTop: 18 }}>
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); }} style={{ border: "none", background: "none", color: c.turf, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: bodyF }}>
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p style={{ textAlign: "center", fontSize: 12, color: c.faint, marginTop: 8 }}>
            Membership is part of sign-up — the subscription gate goes here (Stripe).
          </p>
        </div>
      ) : (
        /* ---------------- SIGNED IN: HOME LOCATION ---------------- */
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px" }}>
          {session.magic && (
            <div style={{ background: c.turfSoft, border: `1px solid ${c.turf}`, color: c.turfDeep, borderRadius: 8, padding: "10px 14px", fontSize: 13.5, marginBottom: 18 }}>
              In the real app we&rsquo;d email a sign-in link to {session.email}. For the demo you&rsquo;re in.
            </div>
          )}
          <p style={eyebrow}>Your home location</p>
          <h1 style={{ fontFamily: display, fontWeight: 700, fontSize: 28, margin: "6px 0 4px" }}>Set where you&rsquo;re searching from</h1>
          <p style={{ color: c.mute, fontSize: 14, marginTop: 0 }}>
            We measure straight-line distance from here to each club, so the &ldquo;within ___ miles&rdquo; filter knows what&rsquo;s close. A ZIP is enough — we never need your street address.
          </p>

          <div style={{ background: "#fff", border: `1px solid ${c.line}`, borderRadius: 12, padding: 20, marginTop: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: c.ink2 }}>Home ZIP code</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="e.g. 64111" inputMode="numeric"
                style={{ ...field, marginTop: 0, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && resolveZip()} />
              <button onClick={resolveZip} style={{ background: c.ink, color: "#fff", border: "none", borderRadius: 8, padding: "0 18px", fontFamily: bodyF, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Set</button>
            </div>
            <button onClick={useMyLocation} style={{ marginTop: 10, background: "none", border: "none", color: c.turf, fontFamily: bodyF, fontWeight: 600, fontSize: 13.5, cursor: "pointer", padding: 0 }}>
              ◎ Use my current location instead
            </button>
            {locMsg && <p style={{ color: c.out, fontSize: 13, margin: "10px 0 0" }}>{locMsg}</p>}

            {home && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${c.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: display, fontWeight: 600, fontSize: 17 }}>{home.place}</span>
                  <span style={{ fontFamily: mono, fontSize: 11.5, color: c.faint }}>{home.lat.toFixed(3)}, {home.lng.toFixed(3)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                  <span style={{ fontSize: 13, color: c.ink2 }}>Search radius</span>
                  <input type="range" min={5} max={60} step={5} value={radius} onChange={(e) => setRadius(+e.target.value)} style={{ flex: 1, accentColor: c.turf }} />
                  <span style={{ fontFamily: mono, fontSize: 13, color: c.turf, width: 48, textAlign: "right" }}>{radius} mi</span>
                </div>
                <p style={{ fontSize: 13.5, color: c.mute, margin: "10px 0 0" }}>
                  <b style={{ fontFamily: mono, color: c.turfDeep }}>{within}</b> of {CLUBS.length} listed clubs fall within {radius} miles.
                </p>
                <button onClick={saveHome} style={{ ...primaryBtn, marginTop: 16, width: "auto", padding: "10px 20px" }}>
                  {saved ? "Saved ✓" : "Save home location"}
                </button>
                {saved && <p style={{ fontSize: 12.5, color: c.turfDeep, marginTop: 8 }}>Stored to your account — every search starts here now.</p>}
              </div>
            )}
          </div>

          <p style={{ fontSize: 13, color: c.mute, marginTop: 16 }}>
            From here you&rsquo;d head to your ranked board — now signed in, so your priorities, home, and notes all persist.
          </p>
        </div>
      )}
    </div>
  );
}
