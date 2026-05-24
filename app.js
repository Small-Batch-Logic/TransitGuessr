// ── Config ──
const SITE_URL = window.location.origin === 'null' ? 'https://transitguessr.app' : window.location.origin;
window.TRANSITGUESSR_CONFIG = window.TRANSITGUESSR_CONFIG || {};
const STATIONS = window.STATIONS || [];
const StationUtils = window.TransitGuessrStationUtils;
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
    filter: () => true 
  },
  daily: { 
    name: 'Daily Challenge', 
    city: 'Global', 
    desc: 'The same 5 stations for everyone in the world. New challenge every day.', 
    filter: () => true 
  },
  toronto: { 
    name: 'Toronto', 
    city: 'Toronto', 
    desc: 'Master the red and white: All Line 1, 2, and 4 stations in the GTHA.', 
    filter: s => ['Toronto', 'Vaughan'].includes(s.city)
  },
  montreal: { 
    name: 'Montréal', 
    city: 'Montréal', 
    desc: 'Navigating the STM: Every station in the Montréal Metro system.', 
    filter: s => s.city === 'Montréal' 
  },
  vancouver: { 
    name: 'Vancouver', 
    city: 'Vancouver', 
    desc: 'The SkyTrain network: All Expo, Millennium, and Canada Line stations.', 
    filter: s => ['Vancouver', 'Burnaby', 'Surrey'].includes(s.city)
  },
  nyc: { 
    name: 'New York', 
    city: 'New York', 
    desc: 'The city that never sleeps: Iconic entrances across all five boroughs.', 
    filter: s => ['New York', 'Brooklyn'].includes(s.city)
  },
  london: { 
    name: 'London', 
    city: 'London', 
    desc: 'Mind the Gap: Stations across the Underground and DLR networks.', 
    filter: s => s.city === 'London' 
  },
  paris: { 
    name: 'Paris', 
    city: 'Paris', 
    desc: 'Le Métro: Art Nouveau entrances and urban landmarks of Paris.', 
    filter: s => s.city === 'Paris' 
  },
  tokyo: { 
    name: 'Tokyo', 
    city: 'Tokyo', 
    desc: 'Tokyo Metro optimization: High-density rail across the megalopolis.', 
    filter: s => s.city === 'Tokyo' 
  },
  chicago: { 
    name: 'Chicago', 
    city: 'Chicago', 
    desc: 'The "L": Elevated lines and subterranean stations in the Windy City.', 
    filter: s => s.city === 'Chicago' 
  },
  berlin: { 
    name: 'Berlin', 
    city: 'Berlin', 
    desc: 'U-Bahn History: Navigate the iconic yellow trains and brutalist architecture.', 
    filter: s => s.city === 'Berlin' 
  },
  sydney: { 
    name: 'Sydney', 
    city: 'Sydney', 
    desc: 'Sydney Trains: Recognize the heritage and modern stations of NSW.', 
    filter: s => s.city === 'Sydney' 
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
  else if (game.hotStreak === 1) streakEl.textContent = 'On a streak';
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

function refreshHighScoreDisplay() {
  document.getElementById('start-hs').textContent = `High Score: ${getHighScore().toLocaleString()}`;
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
  if (!isStreetViewCandidateUsable(station, data)) return false;
  if (StationUtils.hasCuratedStreetViewAnchor(station)) return true;
  return isStreetViewMatchTransitLike(station, data);
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

  // Update Grid UI
  document.querySelectorAll('.mode-card').forEach(el => el.classList.remove('selected'));
  const activeCard = document.getElementById(`mode-${mode}`);
  if (activeCard) activeCard.classList.add('selected');

  // Update Dynamic Info Box
  const config = MODES[mode];
  document.getElementById('start-title').textContent = config.name;
  document.getElementById('start-desc').textContent = mode === 'daily'
    ? getDailyModeDescription(config.desc)
    : config.desc;
  refreshHighScoreDisplay();

  // Update Badge in Game Header
  document.getElementById('game-mode-badge').textContent = config.name;
}

function setDifficulty(diff) {
  game.difficulty = diff;
  const container = document.getElementById('diff-container');
  if (container) container.setAttribute('data-active', diff);
  
  document.querySelectorAll('.diff-tab').forEach(el => el.classList.remove('active'));
  const tab = document.getElementById(`diff-${diff}`);
  if (tab) tab.classList.add('active');
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
    await startGamePromise;
  } finally {
    startGamePromise = null;
  }
}

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

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
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

function goToMenu() {
  document.getElementById('end-screen').classList.remove('active');
  document.getElementById('start-screen').style.display = 'flex';
  setMode(game.selectedMode); // refresh meta text (picks up daily already-played state)
}

function initializeControls() {
  document.querySelectorAll('.mode-card[data-mode]').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  document.querySelectorAll('.diff-tab[data-difficulty]').forEach((button) => {
    button.addEventListener('click', () => setDifficulty(button.dataset.difficulty));
  });

  document.getElementById('start-btn').addEventListener('click', startGame);
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

// Initialization: Detect mode from URL or LocalStorage
(function init() {
  initializeControls();
  const urlParams = new URLSearchParams(window.location.search);
  const lastMode = localStorage.getItem('transitguessr_last_mode');
  const initialMode = urlParams.get('mode') || lastMode || 'worldwide';
  setMode(MODES[initialMode] ? initialMode : 'worldwide');
  setDifficulty('hard');
  updateStreakDisplay();
  setReactionChip({ label: 'Finding the line...', tone: '' });
  if (!STATIONS.length) console.warn('TransitGuessr: stations.js did not load.');
})();
