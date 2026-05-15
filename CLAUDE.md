# BP PD Planning Cortex
## Project Guide

### What This Is
A static **GitHub Pages** hub for the Business Platform PD team: Gantt-style milestones, announcements, artifact links, and local edit mode. Bookmarkable by PD leaders, managers, and TPMs.

### GitHub Pages deployment
- **Source:** `main` branch, **site root** (this repo root). [`index.html`](index.html) redirects immediately to **[`cortex.html`](cortex.html)** (the app shell so paths match the planned file names). GitHub Pages still serves `index.html` by default at the site root.
- **Enable Pages:** Repository **Settings → Pages → Build and deployment →** set source to **Deploy from a branch**, branch `main`, folder **/** (root).
- **Live URL:** `https://<org-or-user>.github.io/<repo>/` (exact URL appears in Settings after the first publish). You may bookmark `.../cortex.html` directly.
- **Private repositories:** GitHub Pages on private repos may require a paid GitHub feature or org policy; use a public repo or confirm your org allows Pages on private repos.
- **Local preview:** From the repo root run `python3 -m http.server 8080` and open `http://localhost:8080/cortex.html` (or `/` which redirects). `fetch('data/seed.json')` and `localStorage` behave reliably over `http://`; `file://` may block fetch (the app falls back to a tiny embedded seed).

### File structure

| File | Purpose |
|------|---------|
| [`index.html`](index.html) | GitHub Pages default entry — redirects to `cortex.html` |
| [`cortex.html`](cortex.html) | Main page — top bar, layout, modals |
| [`cortex.js`](cortex.js) | State, Gantt rendering, filters, modals, CSV, persistence |
| [`cortex.css`](cortex.css) | Styles |
| [`data/seed.json`](data/seed.json) | Default admins, announcements, milestones, sidebar URLs |
| [`CLAUDE.md`](CLAUDE.md) | This file |

Legacy mockup (reference only): [`docs/mockup-v1.html`](docs/mockup-v1.html).

### Data (conceptual model)
All runtime data is **in-browser** (`localStorage` key `bpPdCortex.v1`), merged on first load from `data/seed.json`. The table names below match how you might later sync to a database.

| Entity | Purpose | Key fields |
|--------|---------|------------|
| Milestones | Gantt items | `title`, `lane`, `startDate`, `endDate`, `color`, `shape`, `displayLabel`, `isActive` |
| Announcements | Banner items | `text`, `postedBy`, `postedDate`, `expiryDate`, `isActive` |
| Admins | Shown in sidebar / admin modal | `name`, `email`, `role` |

**Edit mode:** There is no corporate SSO on static Pages. Use **Edit mode** (top bar) to show add/edit controls, CSV export, and reset. **Central Planning** lane milestones are read-only in the UI (conceptually synced from SBG).

### Admins (initial seed)
See [`data/seed.json`](data/seed.json). To change defaults for new visitors, edit that file and redeploy. Existing browsers keep their saved `localStorage` until cleared or **Reset data** (edit mode).

### Swim lanes
1. Central Planning Calendar (read-only in UI)
2. BP PD Internal Deliverables
3. BP PD Op Mechs & Meetings
4. Financial Planning

### Key artifacts (sidebar links)
URLs live in `data/seed.json` under `links`. Empty values show a toast until you set real `https://` URLs.

### Design reference
- Earlier mockup: [`docs/mockup-v1.html`](docs/mockup-v1.html)
