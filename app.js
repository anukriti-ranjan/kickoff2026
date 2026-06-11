// ─────────────────────────────────────────────────────────────
// Kick Off — FIFA 2026  |  app.js
// ─────────────────────────────────────────────────────────────

// ── FIFA code → flagcdn.com ISO code ─────────────────────────
const FLAG_CODES = {
  MEX:'mx', RSA:'za', KOR:'kr', CZE:'cz',
  CAN:'ca', BIH:'ba', QAT:'qa', SUI:'ch',
  USA:'us', PAR:'py', AUS:'au', TUR:'tr',
  HAI:'ht', SCO:'gb-sct', BRA:'br', MAR:'ma',
  GER:'de', CUW:'cw', CIV:'ci', ECU:'ec',
  NED:'nl', JPN:'jp', SWE:'se', TUN:'tn',
  BEL:'be', EGY:'eg', IRN:'ir', NZL:'nz',
  ESP:'es', CPV:'cv', KSA:'sa', URU:'uy',
  FRA:'fr', SEN:'sn', IRQ:'iq', NOR:'no',
  ARG:'ar', ALG:'dz', AUT:'at', JOR:'jo',
  GHA:'gh', PAN:'pa', ENG:'gb-eng', CRO:'hr',
  POR:'pt', COD:'cd', UZB:'uz', COL:'co',
};

function flagUrl(code) {
  const iso = FLAG_CODES[code];
  if (!iso) return ''; // TBD_ codes return empty
  return `https://flagcdn.com/w40/${iso}.png`;
}

// ── State ─────────────────────────────────────────────────────
let allMatches   = [];
let allTeams     = {};   // keyed by teamCode
let predictions  = {};   // groupStage + knockout rounds
let matchDates   = [];   // sorted unique dates that have matches
let currentDateIndex = 0;

// ── Tab Router ────────────────────────────────────────────────
function switchTab(tab) {
  ['matches', 'blogs'].forEach(id => {
    const panel = document.getElementById(`panel-${id}`);
    const btn   = document.getElementById(`tab-${id}`);
    const active = id === tab;
    panel.classList.toggle('hidden', !active);
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  history.replaceState(null, '', `#${tab}`);
}

// ── Time formatting ───────────────────────────────────────────
function fmt12h(time24) {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,'0')} ${period}`;
}

// ── Match Card HTML ───────────────────────────────────────────
function matchCardHTML(match) {
  const teamA = allTeams[match.teamA_code];
  const teamB = allTeams[match.teamB_code];

  const isTBD = match.status === 'placeholder';
  const nameA = teamA ? teamA.teamName : match.teamA_code;
  const nameB = teamB ? teamB.teamName : match.teamB_code;
  const vibeA = teamA ? teamA.vibeCheck : '';
  const vibeB = teamB ? teamB.vibeCheck : '';

  // Centre: score if completed/live, time if upcoming, '?' if placeholder
  let centre = '';
  if (match.status === 'completed' && match.result) {
    centre = `<div class="match-score">${match.result}</div>`;
  } else if (match.status === 'live') {
    centre = `
      <div class="flex flex-col items-center gap-1">
        <span class="live-badge">Live</span>
        ${match.result ? `<div class="match-score">${match.result}</div>` : ''}
      </div>`;
  } else if (isTBD) {
    centre = `<div class="match-vs">?</div>`;
  } else {
    centre = `
      <div class="flex flex-col items-center">
        <div class="match-vs">vs</div>
        <div class="match-time">${fmt12h(match.time)}</div>
        <div class="text-[10px] text-muted">${match.timezone}</div>
      </div>`;
  }

  // Our Take block — nested object with take + stakes + predictedWinner
  const mp = match.matchPrediction;
  const takeText   = mp?.take   ?? null;
  const stakesText = mp?.stakes ?? null;
  const predicted  = mp?.predictedWinner ?? null;

  // Predicted winner label — resolve team name from allTeams
  let callingHTML = '';
  if (predicted && !isTBD) {
    const calledTeam = allTeams[predicted];
    const calledName = calledTeam ? calledTeam.teamName : predicted;
    const resultState = match.winner
      ? (match.winner === predicted ? 'call-correct' : 'call-wrong')
      : 'call-pending';
    const resultIcon = match.winner
      ? (match.winner === predicted ? '✓' : '✗')
      : '';
    const label = predicted === 'DRAW' ? 'Draw' : calledName;
    callingHTML = `<div class="our-take-calling ${resultState}">
      We're calling: <strong>${label}</strong>${resultIcon ? ` <span class="call-icon">${resultIcon}</span>` : ''}
    </div>`;
  }

  const ourTakeHTML = takeText ? `
    <div class="our-take">
      <div class="our-take-label">Our Take</div>
      <div class="our-take-text">${takeText}</div>
      ${stakesText ? `<div class="our-take-stakes">${stakesText}</div>` : ''}
      ${callingHTML}
    </div>` : '';

  // Odds block — hide if all dashes
  const hasOdds = match.marketOdds &&
    match.marketOdds.polymarket_winA !== '--';
  const oddsHTML = hasOdds ? `
    <div class="market-odds">
      <div class="odds-row">
        <span class="odds-label">Polymarket</span>
        <span class="odds-value">${nameA.split(' ')[0]} ${match.marketOdds.polymarket_winA}</span>
        <span class="odds-value mx-1">·</span>
        <span class="odds-value">Draw ${match.marketOdds.polymarket_draw}</span>
        <span class="odds-value mx-1">·</span>
        <span class="odds-value">${nameB.split(' ')[0]} ${match.marketOdds.polymarket_winB}</span>
      </div>
      ${match.marketOdds.kalshi_note !== '--' ? `
      <div class="odds-row">
        <span class="odds-label">Kalshi</span>
        <span class="odds-value">${match.marketOdds.kalshi_note}</span>
      </div>` : ''}
    </div>` : '';

  // Flag img — fallback to initials if no ISO code
  const flagA = flagUrl(match.teamA_code);
  const flagB = flagUrl(match.teamB_code);
  const imgA = flagA
    ? `<img class="team-flag" src="${flagA}" alt="${nameA}" loading="lazy" />`
    : `<div class="team-flag flex items-center justify-center bg-surface text-xs font-bold text-muted">${match.teamA_code.slice(0,2)}</div>`;
  const imgB = flagB
    ? `<img class="team-flag" src="${flagB}" alt="${nameB}" loading="lazy" />`
    : `<div class="team-flag flex items-center justify-center bg-surface text-xs font-bold text-muted">${match.teamB_code.slice(0,2)}</div>`;

  // Pillars accordion button — hidden for TBD teams
  const pillarsBtn = (teamA && teamB && !isTBD) ? `
    <button
      class="pillars-toggle"
      onclick="togglePillars(this, '${match.teamA_code}', '${match.teamB_code}')"
    >
      <span>Team Pillars</span>
      <span class="chevron">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
          <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
        </svg>
      </span>
    </button>
    <div class="pillars-body"></div>` : '';

  return `
    <div class="match-card status-${match.status}">
      <div class="match-meta">${match.stage} · ${match.venue}</div>
      <div class="team-row">
        <div class="team-side">
          ${imgA}
          <div>
            <div class="team-name">${nameA}</div>
            ${vibeA ? `<div class="team-vibe">${vibeA}</div>` : ''}
          </div>
        </div>
        ${centre}
        <div class="team-side right">
          <div>
            <div class="team-name">${nameB}</div>
            ${vibeB ? `<div class="team-vibe">${vibeB}</div>` : ''}
          </div>
          ${imgB}
        </div>
      </div>
      ${oddsHTML}
      ${ourTakeHTML}
      ${pillarsBtn}
    </div>`;
}

// ── Pillars column builder ────────────────────────────────────
function pillarsColHTML(team) {
  const participations = team.historicalParticipations === 0
    ? 'Tournament debut'
    : `${team.historicalParticipations}× World Cup`;

  return `
    <div class="pillars-col">
      <h4>${team.teamName}</h4>

      <div class="tactics-stats">
        <span>Ranked #${team.worldRanking}</span>
        <span class="tactics-sep">·</span>
        <span>${participations}</span>
      </div>

      <div class="tactics-block">
        <div class="tactics-row">
          <span class="tactics-label">Manager</span>
          <span class="tactics-value">${team.tactics.manager}</span>
        </div>
        <div class="tactics-row">
          <span class="tactics-label">Shape</span>
          <span class="tactics-value">${team.tactics.formation}</span>
        </div>
        <div class="tactics-style">${team.tactics.style}</div>
      </div>

      <div class="pillars-section-label">Strengths</div>
      <ul class="pillars-list">
        ${team.pillars.strengths.map(s => `<li>${s}</li>`).join('')}
      </ul>

      <div class="pillars-section-label weakness-label mt-2">Weaknesses</div>
      <ul class="pillars-list weakness">
        ${team.pillars.weaknesses.map(w => `<li>${w}</li>`).join('')}
      </ul>

      <div class="player-chip mt-2">
        <div class="player-role-label">The Catalyst</div>
        <div class="player-name">${team.players.theCatalyst.name}</div>
        <div class="player-role">${team.players.theCatalyst.role}</div>
      </div>
      <div class="player-chip mt-2">
        <div class="player-role-label">The Wildcard</div>
        <div class="player-name">${team.players.theWildcard.name}</div>
        <div class="player-role">${team.players.theWildcard.role}</div>
      </div>
    </div>`;
}

// ── Pillars Accordion ─────────────────────────────────────────
function togglePillars(btn, codeA, codeB) {
  btn.classList.toggle('open');
  const body = btn.nextElementSibling;

  if (body.classList.contains('open')) {
    body.classList.remove('open');
    return;
  }

  const teamA = allTeams[codeA];
  const teamB = allTeams[codeB];

  body.innerHTML = `${pillarsColHTML(teamA)}${pillarsColHTML(teamB)}`;

  body.classList.add('open');
}

// ── Render ────────────────────────────────────────────────────
function renderMatchesForDate() {
  const date    = matchDates[currentDateIndex];
  const matches = allMatches.filter(m => m.date === date);

  // Day header
  const d = new Date(date + 'T12:00:00');
  document.getElementById('day-label').textContent =
    d.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });

  // Sublabel: which groups / round
  const groups = [...new Set(matches.filter(m => m.group).map(m => `Group ${m.group}`))];
  const rounds = [...new Set(matches.filter(m => !m.group).map(m => m.stage))];
  document.getElementById('day-sublabel').textContent =
    groups.length ? groups.join(' · ') : (rounds[0] ?? '');

  // Nav buttons
  document.getElementById('btn-prev-day').disabled = currentDateIndex === 0;
  document.getElementById('btn-next-day').disabled = currentDateIndex === matchDates.length - 1;

  // Cards
  const container = document.getElementById('match-cards-container');
  if (!matches.length) {
    container.innerHTML = '<div class="empty-state"><p>No matches today.</p></div>';
    return;
  }
  container.innerHTML = matches.map(matchCardHTML).join('');
}

// ── Prediction Tracker ───────────────────────────────────────
function updateTracker() {
  const settled = allMatches.filter(m =>
    m.winner !== null &&
    m.winner !== undefined &&
    m.matchPrediction?.predictedWinner
  );

  let correct = 0, wrong = 0;

  settled.forEach(m => {
    const predicted = m.matchPrediction.predictedWinner;
    const actual    = m.winner;
    if (actual === predicted) correct++;
    else wrong++;
  });

  document.getElementById('tracker-correct').textContent = correct;
  document.getElementById('tracker-wrong').textContent   = wrong;
  const played = settled.length;
  document.getElementById('prediction-tracker').title =
    played
      ? `${correct} correct, ${wrong} wrong out of ${played} results in`
      : 'Updates as results come in';
}

// ── Blogs ─────────────────────────────────────────────────────
let allBlogs = [];

function renderBlogs() {
  const container = document.getElementById('blog-cards-container');
  if (!allBlogs.length) {
    container.innerHTML = '<div class="empty-state"><p>Articles coming soon.</p></div>';
    return;
  }
  container.innerHTML = allBlogs.map(blog => `
    <div class="blog-card" onclick="openBlog('${blog.articleId}')">
      <div class="blog-card-text">
        <div class="blog-card-title">${blog.title}</div>
        <div class="blog-card-subtitle">${blog.subtitle}</div>
        <div class="blog-card-meta">${blog.readTime}</div>
      </div>
      <div class="blog-card-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
          <path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>`).join('');
}

function openBlog(articleId) {
  const blog = allBlogs.find(b => b.articleId === articleId);
  if (!blog) return;

  document.getElementById('blog-reader-content').innerHTML = `
    <h1>${blog.title}</h1>
    <p class="blog-subtitle">${blog.subtitle}</p>
    <span class="blog-read-time">${blog.readTime}</span>
    ${blog.contentHtml}`;

  const reader = document.getElementById('blog-reader');
  reader.classList.remove('hidden');
  reader.scrollTop = 0;
}

function closeBlog() {
  document.getElementById('blog-reader').classList.add('hidden');
}

// ── Data Loading ──────────────────────────────────────────────
async function init() {
  try {
    const [matchesRes, teamsRes, predsRes, blogsRes] = await Promise.all([
      fetch('data/matches.json'),
      fetch('data/teams.json'),
      fetch('data/predictions.json'),
      fetch('data/blogs.json'),
    ]);
    allMatches  = await matchesRes.json();
    const teamsArr = await teamsRes.json();
    allTeams    = Object.fromEntries(teamsArr.map(t => [t.teamCode, t]));
    predictions = await predsRes.json();
    allBlogs    = await blogsRes.json();
    renderBlogs();
    updateTracker();

    // Unique sorted dates
    matchDates = [...new Set(allMatches.map(m => m.date))].sort();

    // Default to today (local date, not UTC — avoids off-by-one in non-UTC timezones)
    const now   = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    let idx = matchDates.findIndex(d => d >= today);
    if (idx === -1) idx = matchDates.length - 1;
    currentDateIndex = idx;

    renderMatchesForDate();
  } catch (err) {
    console.error('Failed to load data:', err);
    document.getElementById('match-cards-container').innerHTML =
      '<div class="empty-state"><p>Could not load matches. Try refreshing.</p></div>';
  }
}

// ── Nav button listeners ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash.replace('#', '');
  if (hash === 'blogs') switchTab('blogs');
  else switchTab('matches');

  document.getElementById('blog-reader-close').addEventListener('click', closeBlog);

  document.getElementById('btn-prev-day').addEventListener('click', () => {
    if (currentDateIndex > 0) { currentDateIndex--; renderMatchesForDate(); }
  });
  document.getElementById('btn-next-day').addEventListener('click', () => {
    if (currentDateIndex < matchDates.length - 1) { currentDateIndex++; renderMatchesForDate(); }
  });

  init();
});
