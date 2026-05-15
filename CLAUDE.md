# BP PD Planning Cortex
## Project Guide

### What This Is
A static **GitHub Pages** hub for the Business Platform PD team: Gantt-style milestones, announcements, artifact links, and local edit mode. Bookmarkable by PD leaders, managers, and TPMs.

### GitHub Pages deployment
- **Source:** `main` branch, **site root** (this repo root contains [`index.html`](index.html)).
- **Enable Pages:** Repository **Settings → Pages → Build and deployment →** set source to **Deploy from a branch**, branch `main`, folder **/** (root).
- **Live URL:** `https://<org-or-user>.github.io/<repo>/` (GitHub shows the exact URL after the first publish).
- **Local preview:** From the repo root run `python3 -m http.server 8080` and open `http://localhost:8080/` so `fetch('data/seed.json')` and `localStorage` behave like production (`file://` may block fetch; the app falls back to a tiny embedded seed).

### File structure

| File | Purpose |
|------|---------|
| [`index.html`](index.html) | Page shell — top bar, layout, modals |
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
