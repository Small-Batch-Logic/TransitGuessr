import STATIONS from './stations.json';
import * as StationUtils from './station-utils.js';
import './style.css';

// ── Config ──
const SITE_URL = window.location.origin === 'null' ? 'https://transitguessr.app' : window.location.origin;
window.TRANSITGUESSR_CONFIG = window.TRANSITGUESSR_CONFIG || {};
let googleMapsLoadPromise = null;
let startGamePromise = null;

function loadOptionalScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

const configLoadPromise = loadOptionalScript('./config.local.js');

function getMapsApiKey() {
  return window.TRANSITGUESSR_CONFIG?.googleMapsApiKey || '';
}

const NORMALIZED_STATIONS = StationUtils.normalizeStations(STATIONS);

const MODES = {
  worldwide: { 
    name: 'Worldwide', 
    city: 'Global', 
    desc: 'Test your knowledge across major transit systems globally.', 
    filter: () => true,
    color: 'var(--world)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  },
  daily: { 
    name: 'Daily Challenge', 
    city: 'Global', 
    desc: 'The same 5 stations for everyone in the world. New challenge every day.', 
    filter: () => true,
    color: 'var(--daily)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
  },
  toronto: { 
    name: 'Toronto', 
    city: 'Toronto', 
    desc: 'Master the red and white: All Line 1, 2, and 4 stations in the GTHA.', 
    filter: s => ['Toronto', 'Vaughan'].includes(s.city),
    color: 'var(--ttc)',
    icon: `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="currentColor"/><path d="M6 8h12v3h-4.5v5h-3v-5H6V8z" fill="white"/></svg>`
  },
  montreal: { 
    name: 'Montréal', 
    city: 'Montréal', 
    desc: 'Navigating the STM: Every station in the Montréal Metro system.', 
    filter: s => s.city === 'Montréal',
    color: 'var(--stm)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M8 9l4 4 4-4" stroke="white" stroke-width="3" fill="none"/></svg>`
  },
  vancouver: { 
    name: 'Vancouver', 
    city: 'Vancouver', 
    desc: 'The SkyTrain network: All Expo, Millennium, and Canada Line stations.', 
    filter: s => ['Vancouver', 'Burnaby', 'Surrey'].includes(s.city),
    color: 'var(--skytrain)',
    icon: `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="currentColor"/><path d="M12 6v12M7 9h10" stroke="white" stroke-width="3"/></svg>`
  },
  nyc: { 
    name: 'New York', 
    city: 'New York', 
    desc: 'The city that never sleeps: Iconic entrances across all five boroughs.', 
    filter: s => ['New York', 'Brooklyn'].includes(s.city),
    color: 'var(--nyc)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M9 15.5c0-2 1.5-3.5 3-3.5s3 1.5 3 3.5m-3-7V12" stroke="black" stroke-width="2.5"/></svg>`
  },
  london: { 
    name: 'London', 
    city: 'London', 
    desc: 'Mind the Gap: Stations across the Underground and DLR networks.', 
    filter: s => s.city === 'London',
    color: 'var(--tube)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="3" fill="none"/><rect x="2" y="10" width="20" height="4" fill="#0019a8"/></svg>`
  },
  paris: { 
    name: 'Paris', 
    city: 'Paris', 
    desc: 'Le Métro: Art Nouveau entrances and urban landmarks of Paris.', 
    filter: s => s.city === 'Paris',
    color: 'var(--ratp)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 16V8l5 5 5-5v8" stroke="white" stroke-width="2.5" fill="none"/></svg>`
  },
  tokyo: { 
    name: 'Tokyo', 
    city: 'Tokyo', 
    desc: 'Tokyo Metro optimization: High-density rail across the megalopolis.', 
    filter: s => s.city === 'Tokyo',
    color: 'var(--tokyo)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 15V9l5 4 5-4v6" stroke="white" stroke-width="2.5" fill="none"/></svg>`
  },
  chicago: { 
    name: 'Chicago', 
    city: 'Chicago', 
    desc: 'The "L": Elevated lines and subterranean stations in the Windy City.', 
    filter: s => s.city === 'Chicago',
    color: 'var(--cta)',
    icon: `<svg viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="8" rx="4" fill="currentColor"/><text x="12" y="15" font-size="10" text-anchor="middle" fill="white" font-weight="900" font-family="Arial">L</text></svg>`
  },
  berlin: { 
    name: 'Berlin', 
    city: 'Berlin', 
    desc: 'U-Bahn History: Navigate the iconic yellow trains and brutalist architecture.', 
    filter: s => s.city === 'Berlin',
    color: 'var(--ubahn)',
    icon: `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="2" fill="currentColor"/><text x="12" y="18" font-size="16" text-anchor="middle" fill="#003591" font-weight="900" font-family="Arial">U</text></svg>`
  },
  sydney: { 
    name: 'Sydney', 
    city: 'Sydney', 
    desc: 'Sydney Trains: Recognize the heritage and modern stations of NSW.', 
    filter: s => s.city === 'Sydney',
    color: 'var(--sydney)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M8 8h8M12 8v10" stroke="white" stroke-width="3"/></svg>`
  }
};

// ── Game State ──
const game = {
  selectedMode: 'toronto',
  difficulty: 'hard',
  currentRound: 0,
  totalScore: 0,
  roundResults: [],
  roundStations: [],
  isSubmitting: false,
  svApiWaitCount: 0,
  guessLatLng: null,
  map: null,
  guessMarker: null,
  resultLayer: null,
  timerInterval: null,
  timeLeft: 60,
  ROUND_TIME: 60,
  hotStreak: 0,

  reset(mode = this.selectedMode) {
    this.selectedMode = mode;
    this.currentRound = 0;
    this.totalScore = 0;
    this.roundResults = [];
    this.roundStations = [];
    this.isSubmitting = false;
    this.timeLeft = this.ROUND_TIME;
    this.hotStreak = 0;
    clearInterval(this.timerInterval);
  }
};
window.game = game; // Expose for tests
const ROUND_TIME = 60;
let svService = null;
let svPanorama = null;

// ── Utilities ──
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('active');
  setTimeout(() => t.classList.remove('active'), 2000);
}

function reactionForGuess(distKm, pts, timedOut = false) {
  if (timedOut) return { label: 'Timer cooked you', tone: 'rough' };
  if (pts >= 4700 || distKm < 0.2) return { label: 'Station sniper', tone: 'hot' };
  if (pts >= 3600 || distKm < 2) return { label: 'Dialed in', tone: 'good' };
  if (pts >= 2200 || distKm < 12) return { label: 'Same neighborhood', tone: 'good' };
  if (pts >= 900 || distKm < 75) return { label: 'Wrong exit, right city', tone: 'rough' };
  return { label: 'You boarded the wrong continent', tone: 'rough' };
}

function formatDistance(distKm) {
  if (distKm == null) return 'Timed out';
  return distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(2)} km`;
}

function updateStreakDisplay() {
  const streakEl = document.getElementById('streak-display');
  if (game.hotStreak > 1) streakEl.textContent = `${game.hotStreak}-round streak`;
  else streakEl.textContent = 'No streak';
}

function setReactionChip({ label, tone }) {
  const chip = document.getElementById('reaction-chip');
  chip.textContent = label;
  chip.className = `reaction-chip ${tone}`;
}

function setResultOverlayState({ timedOut = false, points = 0 } = {}) {
  const overlay = document.getElementById('result-overlay');
  const kicker = document.getElementById('result-kicker');
  const scoreWrap = document.querySelector('.score-bar-wrap');

  overlay.classList.toggle('timed-out', timedOut);
  overlay.classList.toggle('perfect-hit', points >= 5000);
  kicker.textContent = timedOut ? 'Round Timed Out' : 'Round Result';
  if (scoreWrap) {
    scoreWrap.setAttribute('aria-hidden', timedOut ? 'true' : 'false');
  }
}

function showResultOverlay() {
  const overlay = document.getElementById('result-overlay');
  overlay.classList.add('active');
  overlay.classList.remove('peek');
}

function setPhotoLoadingState(message, showSpinner = false) {
  const loading = document.getElementById('photo-loading');
  loading.innerHTML = '';
  if (showSpinner) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    loading.appendChild(spinner);
  }
  loading.appendChild(document.createTextNode(message));
  loading.style.display = 'flex';
}

async function ensureGoogleMapsApi() {
  if (typeof google !== 'undefined' && google.maps && google.maps.StreetViewService) {
    return true;
  }

  await configLoadPromise;
  const apiKey = getMapsApiKey();
  if (!apiKey) return false;

  if (!googleMapsLoadPromise) {
    googleMapsLoadPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.id = 'google-maps-api';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  return googleMapsLoadPromise;
}

// ── Daily Challenge ──
// Anchored to UTC so all players worldwide share the same day number.
const LAUNCH_DATE_UTC = Date.UTC(2026, 2, 22); // March 22, 2026

function getDayNumber() {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(1, Math.floor((todayUTC - LAUNCH_DATE_UTC) / 86400000) + 1);
}

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── High Score ──
// ── Daily Played ──
const DAILY_STREAK_KEY = 'transitguessr_daily_streak';

function dailyPlayedKey() { return `transitguessr_daily_played_${getDayNumber()}`; }
function hasDailyBeenPlayed() { try { return !!localStorage.getItem(dailyPlayedKey()); } catch { return false; } }

function getDailyPlayedScore() {
  try {
    const raw = localStorage.getItem(dailyPlayedKey());
    if (raw == null) return null;
    const score = parseInt(raw, 10);
    return Number.isNaN(score) ? null : score;
  } catch {
    return null;
  }
}

function getDailyStreak() {
  try {
    const raw = localStorage.getItem(DAILY_STREAK_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (!Number.isInteger(data?.day) || !Number.isInteger(data?.streak)) return 0;
    const today = getDayNumber();
    if (data.day === today || data.day === today - 1) return Math.max(0, data.streak);
    return 0;
  } catch {
    return 0;
  }
}

function updateDailyStreak() {
  const today = getDayNumber();
  let nextStreak = 1;

  try {
    const raw = localStorage.getItem(DAILY_STREAK_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Number.isInteger(data?.day) && Number.isInteger(data?.streak)) {
        if (data.day === today) return data.streak;
        if (data.day === today - 1) nextStreak = Math.max(1, data.streak + 1);
      }
    }
    localStorage.setItem(DAILY_STREAK_KEY, JSON.stringify({ day: today, streak: nextStreak }));
  } catch {}

  return nextStreak;
}

function markDailyPlayed(score) {
  try {
    localStorage.setItem(dailyPlayedKey(), score);
    updateDailyStreak();
  } catch {}
}

function getDailyModeDescription(baseDesc) {
  const streak = getDailyStreak();
  const streakText = streak > 0 ? ` • Streak: ${streak} day${streak === 1 ? '' : 's'} 🔥` : '';
  if (hasDailyBeenPlayed()) {
    const todayScore = getDailyPlayedScore();
    if (todayScore != null) {
      return `Today's run: ${todayScore.toLocaleString()} / 25,000${streakText}`;
    }
    return `Today's challenge already completed${streakText}`;
  }
  return `${baseDesc}${streakText}`;
}

function getHighScoreKey() {
  return game.selectedMode === 'daily'
    ? `transitguessr_hs_daily_${getDayNumber()}`
    : `transitguessr_hs_${game.selectedMode}`;
}

// Global score count up animation
function getHighScore() {
  try { return parseInt(localStorage.getItem(getHighScoreKey()) || '0'); } catch { return 0; }
}

function saveHighScore(score) {
  try { localStorage.setItem(getHighScoreKey(), score); } catch {}
}

function getHighScoreForMode(mode) {
  try {
    const key = mode === 'daily'
      ? `transitguessr_hs_daily_${getDayNumber()}`
      : `transitguessr_hs_${mode}`;
    return parseInt(localStorage.getItem(key) || '0');
  } catch { return 0; }
}

function updateStartScreenStats() {
  // Daily Challenge card stats
  const dailyStatusEl = document.getElementById('daily-status-text');
  if (dailyStatusEl) {
    const streak = getDailyStreak();
    const streakText = streak > 0 ? ` • Streak: ${streak} day${streak === 1 ? '' : 's'} 🔥` : '';
    if (hasDailyBeenPlayed()) {
      const todayScore = getDailyPlayedScore();
      dailyStatusEl.textContent = todayScore != null
        ? `Today's score: ${todayScore.toLocaleString()}/25,000${streakText}`
        : `Today's run complete${streakText}`;
    } else {
      dailyStatusEl.textContent = streak > 0 ? `Daily Challenge ready!${streakText}` : 'Play today\'s challenge map!';
    }
  }

  // Worldwide card stats
  const worldwideStatusEl = document.getElementById('worldwide-status-text');
  if (worldwideStatusEl) {
    const hs = getHighScoreForMode('worldwide');
    worldwideStatusEl.textContent = hs > 0 ? `High Score: ${hs.toLocaleString()}` : 'Practice mode • Random stations';
  }
}

function refreshHighScoreDisplay() {
  updateStartScreenStats();
}

// ── Score Count-Up ──
function animateCount(el, target, duration) {
  const start = Date.now();
  const tick = () => {
    const progress = Math.min((Date.now() - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Share ──
function shareResult() {
  const modeLabel = game.selectedMode === 'toronto' ? 'Toronto TTC'
    : game.selectedMode === 'daily' ? `Daily Challenge #${getDayNumber()}`
    : MODES[game.selectedMode]?.name || 'Worldwide';
  const streak = game.selectedMode === 'daily' ? getDailyStreak() : 0;
  
  const lines = game.roundResults.map((r, i) => {
    if (r.timedOut) return `${i + 1}: ⏰ Timed out`;
    const dist = r.dist < 1 ? Math.round(r.dist * 1000) + 'm' : r.dist.toFixed(1) + 'km';
    return `${i + 1}: 📍 ${dist} (${r.pts} pts)`;
  });

  const streakLine = streak > 0 ? `Streak: ${streak} day${streak === 1 ? '' : 's'} 🔥\n` : '';
  const text = `TransitGuessr [${modeLabel}]\n\n${lines.join('\n')}\n\n${streakLine}Total: ${game.totalScore.toLocaleString()} / 25,000\n${SITE_URL}`;

  if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    navigator.share({ text }).catch(() => copyFallback(text));
  } else {
    copyFallback(text);
  }
}

function copyFallback(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Result copied to clipboard!');
  });
}

// ── Seen Stations (localStorage) ──
function getSeenIds() {
  try { return JSON.parse(localStorage.getItem('transitguessr_seen_ids') || '[]'); } catch { return []; }
}
function markSeen(ids) {
  try {
    const seen = getSeenIds();
    const unique = [...new Set([...seen, ...ids])];
    // Cap at 200 items to prevent localStorage bloat
    const capped = unique.slice(-200);
    localStorage.setItem('transitguessr_seen_ids', JSON.stringify(capped));
  } catch {}
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingBetween(lat1, lng1, lat2, lng2) {
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const lambda1 = lng1 * Math.PI / 180;
  const lambda2 = lng2 * Math.PI / 180;
  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2)
    - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function getStreetViewSearchPlan(station) {
  const hasCuratedAnchor = StationUtils.hasCuratedStreetViewAnchor(station);
  const radius = station.svRadius ?? (hasCuratedAnchor ? 32 : 20);
  const maxPanoDistance = station.svMaxDistance ?? (hasCuratedAnchor ? 48 : 28);
  return {
    anchor: StationUtils.getStreetViewAnchor(station),
    searchRadii: [
      radius,
      radius + (hasCuratedAnchor ? 16 : 10),
      radius + (hasCuratedAnchor ? 32 : 20)
    ],
    maxPanoDistance
  };
}

function isStreetViewCandidateUsable(station, data) {
  const anchor = StationUtils.getStreetViewAnchor(station);
  const panoLatLng = data?.location?.latLng;
  if (!panoLatLng) return false;
  const panoDistanceMeters = haversineKm(anchor.lat, anchor.lng, panoLatLng.lat(), panoLatLng.lng()) * 1000;
  return panoDistanceMeters <= getStreetViewSearchPlan(station).maxPanoDistance;
}

function getStreetViewHeading(station, panoLatLng) {
  const anchor = StationUtils.getStreetViewAnchor(station);
  const panoDistanceMeters = haversineKm(anchor.lat, anchor.lng, panoLatLng.lat(), panoLatLng.lng()) * 1000;
  if ((station.svHeading != null || station.heading != null) && panoDistanceMeters <= 20) {
    return StationUtils.getStreetViewPov(station).heading;
  }
  return bearingBetween(panoLatLng.lat(), panoLatLng.lng(), anchor.lat, anchor.lng);
}

function isStreetViewMatchTransitLike(station, data) {
  const description = String(data?.location?.description || '').toLowerCase();
  const stationTokens = String(station.name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !['station', 'street'].includes(token));
  if (stationTokens.length === 0) return true;
  return stationTokens.some((token) => description.includes(token));
}

function isStreetViewCandidateHighConfidence(station, data) {
  return isStreetViewCandidateUsable(station, data);
}

function calcScore(distKm) {
  // Cities/Systems use 5km scale; Worldwide/Daily use 2000km
  const scale = ['worldwide', 'daily'].includes(game.selectedMode) ? 2000 : 5;
  return Math.round(5000 * Math.exp(-distKm / scale));
}

const STATION_NAME_REVEAL_SCORE = 4500;

function shouldRevealStationName(pts) {
  return pts >= STATION_NAME_REVEAL_SCORE;
}

function setMode(mode) {
  if (!MODES[mode]) mode = 'worldwide';
  game.selectedMode = mode;
  localStorage.setItem('transitguessr_last_mode', mode);

  // Update Badge in Game Header
  const config = MODES[mode];
  const badgeEl = document.getElementById('game-mode-badge');
  if (badgeEl) {
    badgeEl.textContent = mode === 'daily' ? `Daily #${getDayNumber()}` : config.name;
  }
}

// ── Timer ──
function startTimer() {
  clearInterval(game.timerInterval);
  game.timeLeft = game.ROUND_TIME;
  const bar = document.getElementById('timer-bar');
  bar.style.transition = 'none';
  bar.style.width = '100%';
  bar.classList.remove('danger');
  bar.getBoundingClientRect(); // Flush CSS
  bar.style.transition = 'width 1s linear, background 0.3s';

  game.timerInterval = setInterval(() => {
    game.timeLeft--;
    bar.style.width = `${(game.timeLeft / game.ROUND_TIME) * 100}%`;
    if (game.timeLeft <= 10) bar.classList.add('danger');
    if (game.timeLeft <= 0) {
      clearInterval(game.timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(game.timerInterval);
}

function autoSubmit() {
  if (game.isSubmitting) return;
  
  if (game.guessLatLng) {
    submitGuess();
  } else {
    game.isSubmitting = true;
    const station = game.roundStations[game.currentRound];
    game.totalScore += 0;
    game.roundResults.push({ station, dist: null, pts: 0, timedOut: true });
    game.hotStreak = 0;
    
    document.getElementById('result-station-name').textContent = `Station hidden (${STATION_NAME_REVEAL_SCORE.toLocaleString()}+ to reveal)`;
    document.getElementById('result-system').textContent = `${station.city} · ${station.system}`;
    document.getElementById('result-distance').textContent = 'Time ran out — no guess placed';
    document.getElementById('result-pts').textContent = '0';
    document.getElementById('score-bar-fill').style.width = '0%';
    setReactionChip(reactionForGuess(null, 0, true));
    setResultOverlayState({ timedOut: true, points: 0 });
    updateStreakDisplay();
    document.getElementById('result-round').textContent = `Round ${game.currentRound + 1} of 5`;
    document.getElementById('next-btn').textContent = game.currentRound === 4 ? 'See Results' : 'Next Round';

    showResultOverlay();
  }
}

function gradeLabel(score) {
  const pct = score / 25000;
  if (game.selectedMode === 'toronto') {
    if (pct >= 0.95) return "Transit legend — you basically live on the subway";
    if (pct >= 0.85) return "Excellent — you know this system well";
    if (pct >= 0.70) return "Solid — a few stations fooled you";
    if (pct >= 0.50) return "Not bad — keep riding the TTC";
    if (pct >= 0.30) return "Room to explore — get on the subway more";
    return "Maybe try the bus?";
  } else {
    if (pct >= 0.92) return "Global transit expert — impressive";
    if (pct >= 0.80) return "Well-traveled — you know your systems";
    if (pct >= 0.65) return "Solid — a few cities stumped you";
    if (pct >= 0.45) return "Getting there — explore more transit systems";
    if (pct >= 0.25) return "The world is big — keep exploring";
    return "Have you left your city recently?";
  }
}

// ── Street View Panorama ──
function loadStreetView() {
  const station = game.roundStations[game.currentRound];
  const { anchor, searchRadii } = getStreetViewSearchPlan(station);
  const pov = StationUtils.getStreetViewPov(station);
  
  setPhotoLoadingState('Loading Street View...', true);
  document.getElementById('round-num').textContent = game.currentRound + 1;
  document.getElementById('total-score-display').textContent = `${game.totalScore.toLocaleString()} pts`;

  // Wait for Maps JS API to finish loading
  if (typeof google === 'undefined' || !google.maps || !google.maps.StreetViewService) {
    if (++game.svApiWaitCount > 100) {
      game.svApiWaitCount = 0;
      handleNoStreetView(station);
      return;
    }
    setTimeout(() => loadStreetView(), 100);
    return;
  }
  game.svApiWaitCount = 0;

  if (!svService) svService = new google.maps.StreetViewService();
  const ensurePanorama = () => {
    const panoEl = document.getElementById('sv-pano');
    const canMove = game.difficulty === 'easy';

    if (!svPanorama) {
      svPanorama = new google.maps.StreetViewPanorama(panoEl, {
        addressControl: false,
        showRoadLabels: false,
        zoomControl: canMove,
        fullscreenControl: false,
        motionTrackingControl: false,
        panControl: false,
        linksControl: canMove,
        clickToGo: canMove,
        enableCloseButton: false,
      });
    } else {
      svPanorama.setOptions({
        linksControl: canMove,
        clickToGo: canMove,
        zoomControl: canMove,
      });
    }
  };

  const applyPanoramaData = (data) => {
    ensurePanorama();
    svPanorama.setPano(data.location.pano);
    svPanorama.setPov({
      heading: station.svPanoId ? pov.heading : getStreetViewHeading(station, data.location.latLng),
      pitch: pov.pitch
    });
    document.getElementById('photo-loading').style.display = 'none';
  };

  const tryPanorama = (index) => {
    if (index >= searchRadii.length) {
      handleNoStreetView(station);
      return;
    }

    svService.getPanorama(
      {
        location: anchor,
        radius: searchRadii[index],
        sources: [google.maps.StreetViewSource.OUTDOOR]
      },
      (data, status) => {
        if (status !== google.maps.StreetViewStatus.OK || !isStreetViewCandidateHighConfidence(station, data)) {
          tryPanorama(index + 1);
          return;
        }
        applyPanoramaData(data);
      }
    );
  };

  if (station.svPanoId) {
    svService.getPanorama({ pano: station.svPanoId }, (data, status) => {
      if (status === google.maps.StreetViewStatus.OK) {
        applyPanoramaData(data);
        return;
      }
      tryPanorama(0);
    });
    return;
  }

  tryPanorama(0);
}

function handleNoStreetView(station) {
  stopTimer();
  setPhotoLoadingState('No Street View here — skipping in 2s...');
  setTimeout(() => {
    const modeConfig = MODES[game.selectedMode];
    const pool = StationUtils.selectStationPool(modeConfig ? NORMALIZED_STATIONS.filter(modeConfig.filter) : NORMALIZED_STATIONS, 1);
    const usedIds = game.roundStations.map(s => s.id);
    const fallbacks = shuffle(pool.filter(s => !usedIds.includes(s.id)));
    if (fallbacks.length > 0) game.roundStations[game.currentRound] = fallbacks[0];
    loadStreetView();
  }, 2000);
}

// ── Game Flow ──
async function startGame() {
  if (startGamePromise) return startGamePromise;

  startGamePromise = (async () => {
  game.reset();
  
  if (game.selectedMode === 'daily') {
    game.roundStations = seededShuffle(StationUtils.selectStationPool(NORMALIZED_STATIONS), getDayNumber()).slice(0, 5);
  } else {
    const modeConfig = MODES[game.selectedMode];
    const pool = StationUtils.selectStationPool(modeConfig ? NORMALIZED_STATIONS.filter(modeConfig.filter) : NORMALIZED_STATIONS);
    
    // Seen stations logic
    const seen = getSeenIds();
    const unseen = pool.filter(s => !seen.includes(s.id));
    const finalPool = unseen.length >= 5 ? unseen : pool;
    
    game.roundStations = shuffle(finalPool).slice(0, 5);
    markSeen(game.roundStations.map(s => s.id));
  }

  const badgeEl = document.getElementById('game-mode-badge');
  if (game.selectedMode === 'daily') badgeEl.textContent = `Daily #${getDayNumber()}`;
  else badgeEl.textContent = MODES[game.selectedMode].name;
  badgeEl.style.color = game.difficulty === 'easy' ? '#6ee7b7' : '#64748b';

  goToGame();
  const mapsReady = await ensureGoogleMapsApi();
  if (!mapsReady) {
    setPhotoLoadingState('Google Maps API key not configured. Create config.local.js from config.example.js.');
    return;
  }
  loadStreetView();
  })();

  try {
    return await startGamePromise;
  } finally {
    startGamePromise = null;
  }
}
window.startGame = startGame;


function setupRound() {
  game.isSubmitting = false;
  game.guessLatLng = null;
  if (game.guessMarker) {
    game.map.removeLayer(game.guessMarker);
    game.guessMarker = null;
  }
  if (game.resultLayer) {
    game.resultLayer.clearLayers();
  }

  const guessBtn = document.getElementById('guess-btn');
  if (guessBtn) {
    guessBtn.disabled = true;
  }
  const mapHint = document.getElementById('map-hint');
  if (mapHint) {
    mapHint.textContent = 'Click the map to place your pin';
  }

  // Reset map view based on mode
  if (game.map) {
    if (game.selectedMode === 'toronto') {
      game.map.setView([43.72, -79.40], 11);
    } else {
      game.map.setView([30, 10], 2);
    }
    setTimeout(() => game.map.invalidateSize(), 50);
  }
}

function goToGame() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('end-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  document.getElementById('result-overlay').classList.remove('active');

  if (!game.map) initMap();

  setupRound();
  startTimer();
}

function initMap() {
  game.map = L.map('map', {
    center: [43.72, -79.40],
    zoom: 11,
    zoomControl: true,
    tap: false,
  });

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const url = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  game.tileLayer = L.tileLayer(url, {
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors &copy; <a href="https://carto.com">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(game.map);

  game.resultLayer = L.layerGroup().addTo(game.map);
  game.map.on('click', onMapClick);
}

function onMapClick(e) {
  game.guessLatLng = e.latlng;

  if (game.guessMarker) game.map.removeLayer(game.guessMarker);

  game.guessMarker = L.circleMarker(e.latlng, {
    radius: 10,
    fillColor: '#3b82f6',
    color: '#fff',
    weight: 2.5,
    fillOpacity: 1,
    zIndexOffset: 1000,
  }).addTo(game.map);

  document.getElementById('guess-btn').disabled = false;
  document.getElementById('map-hint').textContent = 'Click to reposition · Confirm when ready';
}

function submitGuess() {
  if (game.isSubmitting || !game.guessLatLng) return;
  game.isSubmitting = true;
  stopTimer();

  const station = game.roundStations[game.currentRound];
  const dist = haversineKm(game.guessLatLng.lat, game.guessLatLng.lng, station.lat, station.lng);
  const pts = calcScore(dist);
  const revealStationName = shouldRevealStationName(pts);
  game.totalScore += pts;
  game.roundResults.push({ station, dist, pts, timedOut: false });
  game.hotStreak = pts >= 3600 ? game.hotStreak + 1 : 0;

  // Increment lifetime stats
  const totalKey = 'transitguessr_total_guessed';
  localStorage.setItem(totalKey, (parseInt(localStorage.getItem(totalKey) || 0) + 1));

  // Draw result on map
  const actualLatLng = L.latLng(station.lat, station.lng);

  L.polyline([game.guessLatLng, actualLatLng], {
    color: '#94a3b8',
    weight: 2,
    dashArray: '6 5',
  }).addTo(game.resultLayer);

  const actualMarker = L.circleMarker(actualLatLng, {
    radius: 12,
    fillColor: '#10b981',
    color: '#fff',
    weight: 2.5,
    fillOpacity: 1,
  }).addTo(game.resultLayer);
  if (revealStationName) {
    actualMarker.bindTooltip(station.name, { permanent: true, direction: 'top', offset: [0, -12] });
  }

  game.map.fitBounds([game.guessLatLng, actualLatLng], { padding: [70, 70], maxZoom: 14, minZoom: 2 });

  // Result card
  const distText = dist < 1
    ? `${Math.round(dist * 1000)} m away`
    : `${dist.toFixed(2)} km away`;

  document.getElementById('result-station-name').textContent = revealStationName
    ? station.name
    : `Station hidden (${STATION_NAME_REVEAL_SCORE.toLocaleString()}+ to reveal)`;
  document.getElementById('result-system').textContent = `${station.city} · ${station.system}`;
  document.getElementById('result-distance').textContent = distText;
  document.getElementById('result-pts').textContent = pts.toLocaleString();
  document.getElementById('score-bar-fill').style.width = `${(pts / 5000) * 100}%`;
  setReactionChip(reactionForGuess(dist, pts));
  setResultOverlayState({ timedOut: false, points: pts });
  updateStreakDisplay();
  document.getElementById('result-round').textContent = `Round ${game.currentRound + 1} of 5`;
  document.getElementById('next-btn').textContent =
    game.currentRound === 4 ? 'See Results' : 'Next Round';

  showResultOverlay();

  // Focus action button for keyboard flow
  setTimeout(() => document.getElementById('next-btn').focus(), 300);
}
window.submitGuess = submitGuess;

function togglePeek() {
  document.getElementById('result-overlay').classList.toggle('peek');
}

function nextRound() {
  game.currentRound++;
  if (game.currentRound < 5) {
    document.getElementById('result-overlay').classList.remove('active');
    setupRound();
    loadStreetView();
    startTimer();
  } else {
    showEndScreen();
  }
}
window.nextRound = nextRound;

function goToMenu() {
  document.getElementById('end-screen').classList.remove('active');
  document.getElementById('start-screen').style.display = 'flex';
  const citySearch = document.getElementById('city-search');
  if (citySearch) {
    citySearch.value = '';
    citySearch.dispatchEvent(new Event('input'));
  }
  updateStartScreenStats();
}

function initializeControls() {
  // Bind click for Daily Challenge play button
  const playDailyBtn = document.getElementById('btn-play-daily');
  if (playDailyBtn) {
    playDailyBtn.addEventListener('click', () => {
      setMode('daily');
      startGame();
    });
  }

  // Bind click for Worldwide play button
  const playWorldwideBtn = document.getElementById('btn-play-worldwide');
  if (playWorldwideBtn) {
    playWorldwideBtn.addEventListener('click', () => {
      setMode('worldwide');
      startGame();
    });
  }

  // Bind clicks for the regional city grid (starts game instantly)
  const cityGrid = document.getElementById('city-grid');
  if (cityGrid) {
    cityGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.mode-card');
      if (card && card.dataset.mode) {
        setMode(card.dataset.mode);
        startGame();
      }
    });
  }

  // Bind city search input
  const citySearch = document.getElementById('city-search');
  if (citySearch) {
    citySearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const cards = cityGrid ? cityGrid.querySelectorAll('.mode-card') : [];
      let visibleCount = 0;

      cards.forEach((card) => {
        const nameEl = card.querySelector('.card-name');
        const name = nameEl ? nameEl.textContent.toLowerCase() : '';
        if (name.includes(query)) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // Handle "No cities found" feedback
      let noResultsEl = document.getElementById('no-cities-feedback');
      if (visibleCount === 0) {
        if (!noResultsEl && cityGrid) {
          noResultsEl = document.createElement('div');
          noResultsEl.id = 'no-cities-feedback';
          noResultsEl.style.gridColumn = '1 / -1';
          noResultsEl.style.textAlign = 'center';
          noResultsEl.style.padding = '20px 10px';
          noResultsEl.style.fontSize = '0.85rem';
          noResultsEl.style.color = 'var(--text-dim)';
          noResultsEl.textContent = 'No cities match your search';
          cityGrid.appendChild(noResultsEl);
        }
      } else {
        if (noResultsEl) {
          noResultsEl.remove();
        }
      }
    });
  }

  document.getElementById('guess-btn').addEventListener('click', submitGuess);
  document.getElementById('peek-btn').addEventListener('click', togglePeek);
  document.getElementById('next-btn').addEventListener('click', nextRound);
  document.getElementById('share-btn').addEventListener('click', shareResult);
  document.getElementById('menu-btn').addEventListener('click', goToMenu);
  document.getElementById('replay-btn').addEventListener('click', startGame);
}

function showEndScreen() {
  document.getElementById('game-screen').classList.remove('active');
  document.getElementById('result-overlay').classList.remove('active');
  document.getElementById('end-screen').classList.add('active');

  // Mark daily as played
  if (game.selectedMode === 'daily') markDailyPlayed(game.totalScore);

  // High score logic
  const prev = getHighScore();
  const isNew = game.totalScore > prev;
  if (isNew) saveHighScore(game.totalScore);

  document.getElementById('new-record-badge').classList.toggle('show', isNew);
  document.getElementById('high-score-label').textContent = isNew
    ? `Previous best: ${prev.toLocaleString()}`
    : `Best: ${Math.max(prev, game.totalScore).toLocaleString()} / 25,000`;

  // Animate final score count-up
  const scoreEl = document.getElementById('final-score');
  scoreEl.textContent = '0';
  setTimeout(() => animateCount(scoreEl, game.totalScore, 900), 150);

  document.getElementById('final-grade').textContent = gradeLabel(game.totalScore);
  document.getElementById('share-btn').textContent = 'Share Result';

  // Stats
  const totalGuessed = localStorage.getItem('transitguessr_total_guessed') || 0;
  document.getElementById('lifetime-stats').innerHTML = `Total stations identified: <strong>${totalGuessed}</strong>`;

  const completedRounds = game.roundResults.filter((r) => !r.timedOut && r.dist != null);
  const closest = completedRounds.reduce((best, round) => !best || round.dist < best.dist ? round : best, null);
  const biggest = completedRounds.reduce((worst, round) => !worst || round.dist > worst.dist ? round : worst, null);
  const averageDist = completedRounds.length
    ? completedRounds.reduce((sum, round) => sum + round.dist, 0) / completedRounds.length
    : null;

  document.getElementById('closest-hit').textContent = closest ? formatDistance(closest.dist) : 'No pin';
  document.getElementById('closest-hit-meta').textContent = closest
    ? `${shouldRevealStationName(closest.pts) ? closest.station.name : `Station hidden (${STATION_NAME_REVEAL_SCORE.toLocaleString()}+ to reveal)`} • ${closest.pts.toLocaleString()} pts`
    : 'No completed guesses';
  document.getElementById('average-miss').textContent = averageDist == null ? 'No pin' : formatDistance(averageDist);
  document.getElementById('average-miss-meta').textContent = completedRounds.length
    ? `${completedRounds.length} scored rounds`
    : 'All rounds timed out';
  document.getElementById('biggest-miss').textContent = biggest ? formatDistance(biggest.dist) : 'No pin';
  document.getElementById('biggest-miss-meta').textContent = biggest
    ? `${shouldRevealStationName(biggest.pts) ? biggest.station.name : `Station hidden (${STATION_NAME_REVEAL_SCORE.toLocaleString()}+ to reveal)`} • ${biggest.pts.toLocaleString()} pts`
    : 'No completed guesses';

  // Results list
  const listEl = document.getElementById('rounds-list');
  listEl.innerHTML = game.roundResults.map(r => `
    <div class="round-row">
      <div class="round-row-left">
        <div class="round-row-name">${shouldRevealStationName(r.pts) ? escHtml(r.station.name) : `Station hidden (${STATION_NAME_REVEAL_SCORE.toLocaleString()}+ to reveal)`}</div>
        <div class="round-row-system">${escHtml(r.station.city)} · ${escHtml(r.station.system)}</div>
        <div class="round-row-dist">${
          r.timedOut ? 'Time ran out'
          : r.dist < 1 ? Math.round(r.dist * 1000) + ' m away'
          : r.dist.toFixed(2) + ' km away'
        }</div>
      </div>
      <div class="round-row-pts">+${r.pts.toLocaleString()}</div>
    </div>
  `).join('');
}

// Initialise start screen state on load
// Global keyboard listener
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('result-overlay');
    if (overlay.classList.contains('active')) {
      if (overlay.classList.contains('peek')) {
        togglePeek();
      }
    }
  }
  if (e.key === 'Enter' || e.key === ' ') {
    // Prevent space from scrolling the page
    if (e.key === ' ') e.preventDefault();

    const startScreen = document.getElementById('start-screen');
    const endScreen = document.getElementById('end-screen');
    const resultOverlay = document.getElementById('result-overlay');

    if (startScreen.style.display !== 'none') {
      startGame();
    } else if (endScreen.classList.contains('active')) {
      goToMenu();
    } else if (resultOverlay.classList.contains('active')) {
      nextRound();
    } else if (game.guessLatLng && !game.isSubmitting) {
      // Space/Enter confirms guess if a pin is dropped
      submitGuess();
    }
  }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
  });
}

function updateMapTheme() {
  if (!game.map || !game.tileLayer) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const url = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  game.tileLayer.setUrl(url);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('transitguessr_theme', next);
  updateMapTheme();
}

function initTheme() {
  const saved = localStorage.getItem('transitguessr_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }
}

function renderCityGrid() {
  const grid = document.getElementById('city-grid');
  if (!grid) return;

  const html = Object.entries(MODES)
    .filter(([key]) => !['worldwide', 'daily'].includes(key))
    .map(([key, mode]) => `
      <button type="button" class="mode-card" id="mode-${key}" data-mode="${key}" style="--system-color: ${mode.color}; height: 50px; padding: 8px 12px;">
        <div class="card-icon" style="width: 28px; height: 28px;">${mode.icon}</div>
        <div class="card-name" style="font-size: 0.85rem;">${mode.name}</div>
      </button>
    `).join('');

  grid.innerHTML = html;
}

// Initialization: Detect mode from URL or LocalStorage
(function init() {
  initTheme();
  renderCityGrid();
  initializeControls();
  const urlParams = new URLSearchParams(window.location.search);
  const lastMode = localStorage.getItem('transitguessr_last_mode');
  const initialMode = urlParams.get('mode') || lastMode || 'worldwide';
  setMode(MODES[initialMode] ? initialMode : 'worldwide');
  updateStreakDisplay();
  updateStartScreenStats();
  setReactionChip({ label: 'Finding the line...', tone: '' });
  if (!STATIONS.length) console.warn('TransitGuessr: stations.js did not load.');
})();
