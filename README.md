# Kick Off — FIFA 2026

A minimal, fast fan site for the FIFA World Cup 2026. Built for returning fans who follow major tournaments but not club football day-to-day.

**Live at:** *[(URL)](https://kickoff2026.anukriti-ranjan.workers.dev)*

---

## What it does

- **Matches tab** — day-by-day match cards defaulting to today. Navigate with arrows. Each card shows team flags, vibeChecks, market odds, an editorial prediction with tournament stakes, and an expandable team pillars breakdown.
- **Blogs tab** — a 10-article tactics crash course written for casual fans returning to the game.
- **Prediction tracker** — a running `W / L` record in the header tracking how our pre-tournament calls hold up against actual results.

---

## Tech stack

Zero build. Zero framework. Deployable anywhere static files are served.

| Layer | Choice |
|---|---|
| Markup | Semantic HTML5 |
| Styling | Tailwind CSS (CDN) + `styles.css` |
| Logic | Vanilla JS ES6+ |
| Data | Static JSON via `fetch()` |
| Flags | [flagcdn.com](https://flagcdn.com) — no local assets needed |

---

## Running locally

Requires a local HTTP server — `fetch()` is blocked on `file://` URLs.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

---

## Deploying to Cloudflare Pages

1. Push this repo to GitHub (the `.gitignore` already excludes all local tooling)
2. Go to [Cloudflare Pages](https://pages.cloudflare.com) → Create a project → Connect to GitHub
3. Select the repo
4. **Build settings:** leave everything blank — no build command, no output directory (the root is the output)
5. Deploy

Cloudflare will serve `index.html` from the repo root. Done.

---

## Data files

All content lives in `data/`. These are the only files you edit during the tournament.

| File | What's in it |
|---|---|
| `matches.json` | All 72 group stage matches + knockout placeholders. Update `status`, `result`, and `winner` as matches are played. |
| `teams.json` | Tactical cards for all 48 teams. Set once, rarely touched. |
| `predictions.json` | Group stage standings predictions + knockout predictions added progressively. |
| `blogs.json` | All blog articles inline as HTML. Append new entries to add posts. |

---

## Match result format

After each match, find it in `matches.json` by `matchId` and update three fields:

```json
"status": "completed",
"result": "2-1",
"winner": "MEX"
```

Use `"DRAW"` for drawn matches. The prediction tracker and card display update automatically.
