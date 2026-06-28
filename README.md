# The Bench — preview build

A managed directory that scores youth baseball organizations on development
quality, ranks them by each parent's own priorities, and surfaces who has
open tryout spots nearby.

This is a **frontend preview on sample data** — no backend yet. It exists so
you can put a real, clickable link in front of coaches and parents today.

## Screens
- **Home** — public explainer / role doors
- **For parents** — ranked results, live re-ranking by your weights, distance + openings filters, private notes
- **Parent account** — sign-in/up and home-location setter (the layer that makes settings persist)
- **Admin console** — intake review, fact verification, approve/reject, derived scores

The top "Preview · sample data" strip is demo chrome for navigating between
roles. It comes out once real auth + routing are wired.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

## Deploy to Netlify from GitHub
1. Create a new GitHub repo and push this folder:
   ```bash
   git init && git add . && git commit -m "Preview build"
   git branch -M main
   git remote add origin https://github.com/<you>/the-bench.git
   git push -u origin main
   ```
2. In Netlify: **Add new site → Import from GitHub**, pick the repo.
3. Build settings are auto-detected from `netlify.toml`
   (build `npm run build`, publish `dist`). Deploy.
4. Every push to `main` redeploys.

## Wiring Supabase later (kept intentionally separate)
The data layer is already designed in the SQL files (schema + RLS,
questionnaire/rubric, default weights). To go live:

1. `npm install @supabase/supabase-js`
2. Add a client (`src/lib/supabase.js`) reading:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (set these in Netlify → Site settings → Environment variables)
3. Replace the mock data at each `// >>> WIRE` marker in the screen files.
   The scoring math (`fit`, `rebuild_org_scores`) and filters stay as-is.

Order to wire: auth (gate the parent board) → load/save `parent_preferences`
→ `public_listings` for the board → admin reads/approvals → payments last.
