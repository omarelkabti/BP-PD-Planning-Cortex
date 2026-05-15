# BP PD Planning Cortex — Claude Code Guide

## What this is
Static GitHub Pages app for the Business Platform PD planning cycle. Gantt timeline + planning status tracker. No build step — edit the files, commit, push, done.

- **Repo:** https://github.com/omarelkabti/BP-PD-Planning-Cortex
- **Live site:** https://omarelkabti.github.io/BP-PD-Planning-Cortex/cortex.html
- **Local preview:** `python3 -m http.server 8181` from repo root, then open http://localhost:8181/cortex.html

---

## File map

| File | What to edit |
|---|---|
| `data/seed.json` | Milestones, announcements, admins, sidebar URLs |
| `cortex.js` | All logic — deadlines, leaders, deliverables, Gantt, status grid |
| `cortex.css` | All styles |
| `cortex.html` | Page structure / modals (rarely needed) |

---

## Database — Google Sheet backend

Status cell edits (PD Leaders + TPM tabs) are saved to **two places simultaneously**:
1. **localStorage** — instant, browser-local cache (survives refresh, not browser clear)
2. **Google Sheet** via Apps Script — shared source of truth, persists for everyone

### One-time setup (do this once to activate the backend)

**Step 1 — Create the Sheet:**
Go to Google Sheets, create a new spreadsheet named `BP PD Planning Cortex`.
Copy the Sheet ID from the URL.

**Step 2 — Add the Apps Script:**
In the Sheet: Extensions → Apps Script.
Copy-paste the contents of `cortex-backend.gs` into the editor. Save.

**Step 3 — Deploy as web app:**
Deploy → New deployment → Type: Web app
- Execute as: **Me**
- Who has access: **Anyone at Intuit** (or "Anyone" if needed for GitHub Pages)

Copy the web app URL (looks like `https://script.google.com/macros/s/.../exec`).

**Step 4 — Wire the URL:**
Paste it into `data/seed.json` → `"backendUrl"`:
```json
"backendUrl": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
```
Commit and push. The app will now read + write to the Sheet on every load and cell save.

**Step 5 — Verify:**
Open the app, turn on Edit mode, click any cell, set it to Done.
Check the Sheet — a row should appear in `PlanStatus` within a second.

### How it works at runtime
- **On page load:** App fetches all rows from the Sheet and merges them over localStorage. Sheet wins.
- **On cell save:** localStorage is written instantly (UI is immediate). A background POST fires to the Sheet — no spinner, no blocking.
- **If backend is unreachable:** Falls back silently to localStorage. No error shown.

### Redeploy after changing cortex-backend.gs
Any change to `cortex-backend.gs` requires a new Apps Script deployment:
Deploy → Manage deployments → Edit → New version → Deploy.
The URL stays the same.

---

## How to deploy (GitHub Pages)
```bash
git add -A
git commit -m "your message"
git push
```
GitHub Pages auto-deploys from `main` at `/` (root). Changes are live in ~30–60 seconds. Users need **hard refresh** (`Cmd+Shift+R`).

---

## Common edits — plain language → where to change

### "Add / change a deadline in the countdown strip"
Edit `KEY_DEADLINES` array in `cortex.js` (~line 40). Each entry:
```js
{ label: 'Display name', date: 'YYYY-MM-DD', urgencyDays: 7 }
```
`urgencyDays` = how many days out it turns orange (vs green).

### "Add / change a milestone on the Gantt"
Edit `data/seed.json` → `milestones` array. Fields:
```json
{
  "id": "ms-bpd-9",
  "title": "Your title",
  "lane": "bpd",
  "startDate": "2026-06-10",
  "endDate": "2026-06-10",
  "color": "blue",
  "shape": "dot",
  "displayLabel": "6/10",
  "isActive": true
}
```
**Lanes:** `central` (read-only in UI) · `bpd` · `opmech` · `financial`
**Shapes:** `dot` (point-in-time) · `square` (cutline) · `bar` (range)
**Colors:** `blue` `teal` `green` `orange` `purple` `red` `gray` `yellow` `pink`

### "Add / change an announcement banner"
Edit `data/seed.json` → `announcements` array:
```json
{
  "id": "ann-4",
  "text": "May 30 — Your message here.",
  "postedBy": "Planning Cortex",
  "postedDate": "2026-05-15",
  "expiryDate": "",
  "isActive": true
}
```
Set `"expiryDate": "2026-05-30"` to auto-hide after that date.

### "Set a URL for a sidebar link"
Edit `data/seed.json` → `links` object. Keys:
- `dependencyDashboard`
- `workstreamReconciliation`
- `capabilityRoadmap`
- `sbgPortfolioRoadmap`
- `fy27InputGoals`
- `bpPdDriveFolder`
- `sbgPlanningCortex`
- `petResourceTracker`
- `smartsheetBpPd`

### "Add a PD Leader to the PD Leaders grid"
Edit `STATUS_LEADERS` array in `cortex.js`. Source of truth: Kashi Kakarla's Workday direct reports (run `org_lookup.py --reports-to "Kashi Kakarla"` to refresh).
```js
{ key: 'newkey', name: 'Full Name', title: 'Job Title from Workday' }
```

### "Add a deliverable column to the PD Leaders grid"
Edit `STATUS_DELIVERABLES` array in `cortex.js`:
```js
{ key: 'new-del', label: 'Column Header', due: '2026-06-15' }
```

### "Add a TPM to the TPMs grid"
Edit `TPM_MEMBERS` array in `cortex.js`. Source of truth: Allison Bellah's Workday direct reports (run `org_lookup.py --reports-to "Allison Bellah"`).
```js
{ key: 'newkey', name: 'Full Name', title: 'Job Title from Workday' }
```

### "Add an activity column to the TPMs grid"
Edit `TPM_ACTIVITIES` array in `cortex.js`:
```js
{ key: 'new-act', label: 'Activity Label', due: '2026-06-15' }
```

### "Add / remove a planning phase from the cycle bar"
Edit `PLANNING_PHASES` array in `cortex.js`. The current phase is auto-detected by today's date falling between `start` and `end`.

### "Change the viewer name (Welcome back, X)"
Edit `data/seed.json` → `viewer.displayName`.

### "Add an admin to the sidebar"
Edit `data/seed.json` → `admins` array:
```json
{ "name": "First Last", "email": "flast@intuit.com", "role": "PD Leader" }
```

---

## Data model notes

- All user edits (milestone add/edit, status cell updates) save to **localStorage** in the browser — they don't write back to `seed.json`.
- `seed.json` is the **default** — loaded on first visit or after "Reset data".
- Planning Status cells are stored under localStorage key `bpPdCortex.planStatus.v1`, separate from milestones.
- To make a change permanent for all visitors: edit `seed.json` (or `cortex.js` for code-level config), commit, and push.

---

## Key constants in cortex.js

| Constant | Line ~| Purpose |
|---|---|---|
| `KEY_DEADLINES` | ~50 | Countdown strip items |
| `PLANNING_PHASES` | ~65 | Phase bar items |
| `STATUS_LEADERS` | ~28 | PD Leaders tab rows (Kashi's directs) |
| `STATUS_DELIVERABLES` | ~38 | PD Leaders tab columns |
| `TPM_MEMBERS` | ~47 | TPMs tab rows (Allison's directs) |
| `TPM_ACTIVITIES` | ~56 | TPMs tab columns |
| `LANE_LABELS` | ~10 | Gantt lane display names |
