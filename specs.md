# FIFA 2026 Fan Site — Product Specification
> Last updated: 2026-06-11

---

## 1. Product Vision

A minimal, fast website for **returning fans** who follow major tournaments but not club football day-to-day. The single job: answer "what's on today, and what should I know going in?" — with our editorial take baked in.

**Core principle:** Zero cognitive overload. Two tabs, one swipe, done.

---

## 2. Technology Stack

Zero-build, no-framework. Deployable to Cloudflare Pages or GitHub Pages with no CI/CD setup.

| Layer | Choice |
|---|---|
| Markup | Semantic HTML5 |
| Styling | Tailwind CSS (CDN) + custom `styles.css` for overrides |
| Logic | Vanilla JavaScript ES6+ (`app.js`) |
| Data | Static `.json` files, loaded via `fetch()` |
| Flags | `flagcdn.com` — no local assets needed (e.g. `https://flagcdn.com/w40/mx.png`) |
| Fonts | Inter (UI) + Playfair Display (editorial voice) via Google Fonts CDN |
| External lib | None. Panzoom only if a bracket view is added later. |

---

## 3. File Architecture

```
├── index.html              # SPA shell — all markup lives here
├── styles.css              # Tailwind overrides + custom component styles
├── app.js                  # State, routing, data fetching, DOM rendering
├── data/
│   ├── matches.json        # ALL matches: group stage + knockouts (single source of truth)
│   ├── teams.json          # 48 team tactical cards (complete)
│   ├── predictions.json    # Group standings predictions + knockout predictions
│   └── blogs.json          # Blog posts with inline contentHtml (no separate files needed)
├── README.md
└── .gitignore
```

No `assets/` folder — flags load from flagcdn.com. Blog content is inline in `blogs.json`, not in separate HTML files.

---

## 4. Navigation — Two Tabs Only

```
[ Matches ]  [ Blogs ]
```

Tab state managed via URL hash (`#matches`, `#blogs`). No page reloads.
Active tab shows a violet-tinted background with violet border — unambiguous visual state.

**Do not add more tabs.** Resist scope creep here.

---

## 5. Matches Tab — Core UX

### 5a. Smart Default Date

On load, JavaScript reads the **local** date (not UTC — avoids off-by-one for users in UTC-5/UTC-7 timezones) and filters `matches.json` for today's date.

- If matches exist today → render them.
- If it's a rest day → automatically jump to the **next** date that has matches.
- Never show a blank screen.

### 5b. Day Navigation

A sticky header at the top of the Matches tab:

```
  ←   June 11, 2026   →
        Group A
```

- Arrows skip over empty days automatically.
- Sublabel shows which groups are playing that day, or the round name for knockouts.
- On mobile: CSS `scroll-snap-type: x mandatory` on the card wrapper. No slider library.

### 5c. Match Card Anatomy

Each card renders in this order, top to bottom:

```
┌─────────────────────────────────────────────────┐
│  GROUP A  ·  Estadio Azteca, Mexico City         │  ← stage/meta row
│                                                  │
│  🇲🇽 Mexico          vs         South Africa 🇿🇦  │  ← flags + team names
│  "A demanding home crowd..."  "A tight-knit..."  │  ← vibeCheck (one-liner each)
│                       1:00 PM  UTC-6             │  ← time (or score if completed)
│                                                  │
│  Polymarket:  MEX 72%  ·  Draw 18%  ·  RSA 10%  │  ← market odds (static string)
│  Kalshi: Mexico favored at 68¢                   │    hidden entirely if all "--"
│                                                  │
│  ◈ Our Take  ────────────────────────────────    │  ← editorial block (see §7)
│  [italic take — tactical hook]                   │
│  [stakes — tournament implication]               │
│  We're calling: Mexico                           │  ← predicted winner
│                                                  │
│  ▾ Team Pillars                                  │  ← accordion, collapsed default
└─────────────────────────────────────────────────┘
```

**Team Pillars accordion** (expands on click, two-column desktop / single-column mobile):

```
  Mexico                        South Africa
  Ranked #15 · 17× World Cup    Ranked #60 · 3× World Cup

  Manager  Javier Aguirre       Manager  Hugo Broos
  Shape    4-3-3 / 4-2-3-1      Shape    4-2-3-1
  [style description italic]    [style description italic]

  STRENGTHS                     STRENGTHS
  · ...                         · ...

  WEAKNESSES                    WEAKNESSES
  · ...                         · ...

  THE CATALYST / THE WILDCARD   THE CATALYST / THE WILDCARD
```

- All data from `teams.json` keyed by `teamA_code` / `teamB_code`.
- If a team code starts with `TBD_`, hide the accordion button entirely.
- Mobile breakpoint `@media (max-width: 768px)` stacks columns to single vertical layout.

### 5d. Result State

The `status` field drives card display:
- `"upcoming"` → show time, market odds, Our Take
- `"live"` → pulsing violet border + live badge + score if available
- `"completed"` → show final score in centre, grey card opacity, Our Take remains
- `"placeholder"` → TBD knockout slot, no accordion

---

## 6. matches.json — Unified Schema

Single schema covers **all stages**: group matches, R32, R16, QF, SF, Final.

```json
{
  "matchId": "M1",
  "stage": "Group A",
  "group": "A",
  "date": "2026-06-11",
  "time": "13:00",
  "timezone": "UTC-6",
  "venue": "Estadio Azteca, Mexico City",
  "teamA_code": "MEX",
  "teamB_code": "RSA",
  "marketOdds": {
    "polymarket_winA": "72%",
    "polymarket_winB": "10%",
    "polymarket_draw": "18%",
    "kalshi_note": "Mexico favored at 68¢"
  },
  "matchPrediction": {
    "take": "1-2 sentence tactical hook for this specific matchup.",
    "stakes": "1 sentence on what this result means for the tournament.",
    "predictedWinner": "MEX"
  },
  "status": "upcoming",
  "result": null,
  "winner": null
}
```

**Key fields:**

| Field | Purpose |
|---|---|
| `matchPrediction.take` | Tactical editorial hook — rendered in Playfair italic |
| `matchPrediction.stakes` | Tournament implication — rendered smaller below the take |
| `matchPrediction.predictedWinner` | Team code or `"DRAW"` — feeds the prediction tracker |
| `winner` | Set manually after the match (`"MEX"`, `"RSA"`, or `"DRAW"`) — drives tracker scoring |
| `result` | Score string for display e.g. `"2-1"` |
| `status` | `"upcoming"` / `"live"` / `"completed"` / `"placeholder"` |

**Mid-tournament knockout update:** replace `"TBD_W73"` with actual team codes, update `marketOdds`, run the prediction script. Layout code never changes.

---

## 7. Editorial "Our Take" — Visual Design

Three-part block, all within the violet left-border container:

1. **`take`** — Playfair Display italic, violet-light (`#c4b5fd`). The tactical hook.
2. **`stakes`** — smaller, muted violet (`#9880d4`). The tournament implication.
3. **`We're calling: [Team]`** — small label. Muted violet when pending, green ✓ when correct, red ✗ when wrong.

Factual data (formation, venue, market odds) uses `Inter`. The editorial voice uses `Playfair Display`. The contrast is immediate and intentional.

---

## 8. Prediction Tracker

A persistent chip in the site header:

```
Our Calls  ·  5W  3L
```

- Reads `matchPrediction.predictedWinner` vs `winner` for every match where `winner !== null`.
- Shows `0W 0L` until the first result is recorded — always visible, never hidden.
- Turns green for correct calls, red for wrong ones on individual cards.
- Tooltip shows full record text on hover.

---

## 9. Blogs Tab

All blog content stored inline in `data/blogs.json` as `contentHtml`. No separate file fetches.

### blogs.json schema

```json
{
  "articleId": "blog-1",
  "type": "tactics",
  "title": "The Death of Rigid Positions: Welcome to \"Liquid Football\"",
  "subtitle": "One line summary for the card.",
  "readTime": "3 min read",
  "contentHtml": "<p>Full article HTML...</p>"
}
```

**HTML conventions for contentHtml:**
- `<h3>` — section headers
- `<p>` — body paragraphs
- `<ol><li><strong>Title</strong> Body</li></ol>` — numbered steps
- `<ul><li><strong>Lead:</strong> Body</li></ul>` — spot-it bullets
- `<div class="callout"><p>💡 <strong>Label:</strong> Text</p></div>` — definition boxes
- `<em>` — foreign terms or emphasis

Blog reader opens as a full-screen overlay. Back button returns to the blog list.

---

## 10. teams.json Schema (complete — do not modify)

```json
{
  "teamCode": "MEX",
  "teamName": "Mexico",
  "group": "A",
  "worldRanking": 15,
  "historicalParticipations": 17,
  "vibeCheck": "...",
  "tactics": {
    "manager": "Javier Aguirre",
    "formation": "Adaptive 4-3-3 / 4-2-3-1",
    "style": "..."
  },
  "pillars": {
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."]
  },
  "players": {
    "theCatalyst": { "name": "...", "role": "..." },
    "theWildcard":  { "name": "...", "role": "..." }
  },
  "ourInsight": {
    "predictionText": "...",
    "status": "pending",
    "badgeColor": "violet"
  }
}
```

---

## 11. predictions.json Schema

```json
{
  "groupStage": {
    "A": {
      "standings": ["MEX", "KOR", "CZE", "RSA"],
      "rationale": "Mexico exploits home Aztec energy..."
    }
  },
  "thirdPlaceLeaderboard": [...],
  "knockoutRoundOf32": { ... },
  "knockoutRoundOf16": {},
  "knockoutRoundOf8":  {},
  "knockoutRoundOf4":  {},
  "final":             {}
}
```

---

## 12. Core JavaScript Requirements

- **No hardcoded text in HTML.** All names, data, titles rendered via JS template literals.
- **URL hash router:** `#matches` and `#blogs` only.
- **Local date default:** use `new Date()` with local date components — not `toISOString()` which returns UTC.
- **flagcdn.com pattern:** FIFA 3-letter → ISO 2-letter lookup in `app.js`.
- **No jQuery, no React, no bundler.**

---

## 13. Scope Constraints

- No live scores API — results updated manually in `matches.json`
- No user accounts, comments, or backend
- No bracket visualizer — can be added later with panzoom
- No push notifications
- No social sharing mechanics
- Market odds are **static strings**, not live-fetched
