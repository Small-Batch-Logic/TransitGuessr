import { seededShuffle } from './utils.js';
import { CITY_REGIONS } from './config.js';

const LAUNCH_DATE_UTC = Date.UTC(2026, 2, 22);

export const THEME_CYCLE = ['city', 'region', 'worldwide', 'random'];

export const THEME_NAMES = {
  city: 'City Spotlight',
  region: 'Regional Mix',
  worldwide: 'World Tour',
  random: 'Wildcard',
};

export function getDailyThemeType() {
  return THEME_CYCLE[getDayNumber() % THEME_CYCLE.length];
}

export function getDayNumber() {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(1, Math.floor((todayUTC - LAUNCH_DATE_UTC) / 86400000) + 1);
}

function dailyPlayedKey() {
  return `transitguessr_daily_played_${getDayNumber()}`;
}

export function hasDailyBeenPlayed() {
  try { return !!localStorage.getItem(dailyPlayedKey()); } catch { return false; }
}

export function getDailyPlayedScore() {
  try {
    const raw = localStorage.getItem(dailyPlayedKey());
    if (raw == null) return null;
    const score = parseInt(raw, 10);
    return Number.isNaN(score) ? null : score;
  } catch { return null; }
}

export function getDailyStreak() {
  try {
    const raw = localStorage.getItem('transitguessr_daily_streak');
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (!Number.isInteger(data?.day) || !Number.isInteger(data?.streak)) return 0;
    const today = getDayNumber();
    if (data.day === today || data.day === today - 1) return Math.max(0, data.streak);
    return 0;
  } catch { return 0; }
}

export function markDailyPlayed(score) {
  try {
    localStorage.setItem(dailyPlayedKey(), score);
    const today = getDayNumber();
    let nextStreak = 1;
    const raw = localStorage.getItem('transitguessr_daily_streak');
    if (raw) {
      const data = JSON.parse(raw);
      if (Number.isInteger(data?.day) && Number.isInteger(data?.streak)) {
        if (data.day === today) return;
        if (data.day === today - 1) nextStreak = Math.max(1, data.streak + 1);
      }
    }
    localStorage.setItem('transitguessr_daily_streak', JSON.stringify({ day: today, streak: nextStreak }));
  } catch {}
}

export function getDailyDeck(pool, day) {
  const DECK_SEED = 7331;

  // 1. Grouping and computing eligible thresholds
  const byCity = {};
  pool.forEach(s => { if (!byCity[s.city]) byCity[s.city] = []; byCity[s.city].push(s); });
  const cityCounts = Object.values(byCity).map(s => s.length).sort((a, b) => a - b);
  const q1 = cityCounts[Math.floor(cityCounts.length * 0.25)] || 0;
  const q3 = cityCounts[Math.floor(cityCounts.length * 0.75)] || 0;
  const iqr = q3 - q1;
  const outlierThreshold = q3 + 1.5 * iqr;
  const inlierCounts = cityCounts.filter(n => n <= outlierThreshold);
  const mean = inlierCounts.reduce((a, b) => a + b, 0) / (inlierCounts.length || 1);
  const cityFloor = Math.max(5, Math.round(mean));
  const eligibleCities = Object.keys(byCity).filter(c => byCity[c].length >= cityFloor).sort();

  const byRegion = {};
  pool.forEach(s => {
    const r = CITY_REGIONS[s.city] || 'Other';
    if (!byRegion[r]) byRegion[r] = [];
    byRegion[r].push(s);
  });
  const eligibleRegions = Object.keys(byRegion).filter(r => r !== 'Other' && byRegion[r].length >= 5).sort();

  const bySystem = {};
  pool.forEach(s => { if (!bySystem[s.system]) bySystem[s.system] = []; bySystem[s.system].push(s); });

  // 2. Simulate daily choices up to target day to find selection counters
  const citySelectionCounts = {};
  const systemSelectionCounts = {};

  const pickFromDeckForDay = (items, d, itemSeed = DECK_SEED) => {
    const deck = seededShuffle([...items], itemSeed);
    return deck[d % deck.length];
  };

  for (let d = 1; d <= day; d++) {
    const dThemeType = THEME_CYCLE[d % THEME_CYCLE.length];
    if (dThemeType === 'city') {
      if (eligibleCities.length > 0) {
        const dCity = pickFromDeckForDay(eligibleCities, d);
        citySelectionCounts[dCity] = (citySelectionCounts[dCity] || 0) + 1;
      }
    } else if (dThemeType === 'region') {
      if (eligibleRegions.length > 0) {
        const dRegion = pickFromDeckForDay(eligibleRegions, d);
        const dRegionPool = byRegion[dRegion] || [];
        const dRegionSystems = {};
        dRegionPool.forEach(s => { if (!dRegionSystems[s.system]) dRegionSystems[s.system] = []; dRegionSystems[s.system].push(s); });
        const dSystems = seededShuffle(Object.keys(dRegionSystems).sort(), DECK_SEED).slice(0, 5);
        dSystems.forEach(sys => {
          systemSelectionCounts[sys] = (systemSelectionCounts[sys] || 0) + 1;
        });
      }
    } else if (dThemeType === 'worldwide') {
      const dSystemDeck = seededShuffle(Object.keys(bySystem).sort(), DECK_SEED);
      if (dSystemDeck.length > 0) {
        const dOffset = (d * 5) % dSystemDeck.length;
        const dSystems = [...dSystemDeck.slice(dOffset), ...dSystemDeck].slice(0, 5);
        dSystems.forEach(sys => {
          systemSelectionCounts[sys] = (systemSelectionCounts[sys] || 0) + 1;
        });
      }
    }
  }

  // 3. Build today's deck using the sliding windows
  const themeType = THEME_CYCLE[day % THEME_CYCLE.length];
  let chosenStations = [];
  let themeLabel = '';

  if (themeType === 'city') {
    const city = pickFromDeckForDay(eligibleCities, day);
    themeLabel = city;
    if (city && byCity[city]) {
      const citySelectedCount = citySelectionCounts[city] || 1;
      const cityStations = seededShuffle([...byCity[city]], DECK_SEED);
      const cityOffset = ((citySelectedCount - 1) * 5) % cityStations.length;
      chosenStations = [...cityStations.slice(cityOffset), ...cityStations].slice(0, 5);
    }

  } else if (themeType === 'region') {
    const region = pickFromDeckForDay(eligibleRegions, day);
    themeLabel = region;
    if (region && byRegion[region]) {
      const regionPool = byRegion[region];
      const byRegionSystem = {};
      regionPool.forEach(s => { if (!byRegionSystem[s.system]) byRegionSystem[s.system] = []; byRegionSystem[s.system].push(s); });
      const systems = seededShuffle(Object.keys(byRegionSystem).sort(), DECK_SEED).slice(0, 5);

      systems.forEach(sys => {
        const sysSelectedCount = systemSelectionCounts[sys] || 1;
        const sysStations = seededShuffle([...byRegionSystem[sys]], DECK_SEED);
        const sysOffset = (sysSelectedCount - 1) % sysStations.length;
        const s = sysStations[sysOffset];
        if (s) chosenStations.push(s);
      });

      // Fill in extra if we don't have 5 systems in the region
      if (chosenStations.length < 5) {
        const extraPool = seededShuffle([...regionPool], DECK_SEED);
        const extraOffset = (day * 5) % extraPool.length;
        const extra = [...extraPool.slice(extraOffset), ...extraPool].filter(s => !chosenStations.includes(s));
        chosenStations.push(...extra.slice(0, 5 - chosenStations.length));
      }
    }

  } else if (themeType === 'worldwide') {
    themeLabel = THEME_NAMES.worldwide;
    const systemDeck = seededShuffle(Object.keys(bySystem).sort(), DECK_SEED);
    if (systemDeck.length > 0) {
      const offset = (day * 5) % systemDeck.length;
      const systems = [...systemDeck.slice(offset), ...systemDeck].slice(0, 5);

      systems.forEach(sys => {
        const sysSelectedCount = systemSelectionCounts[sys] || 1;
        const sysStations = seededShuffle([...bySystem[sys]], DECK_SEED);
        const sysOffset = (sysSelectedCount - 1) % sysStations.length;
        const s = sysStations[sysOffset];
        if (s) chosenStations.push(s);
      });
    }

  } else {
    // Wildcard (random) — exhaust all stations sequentially before repeating
    themeLabel = THEME_NAMES.random;
    const stationDeck = seededShuffle([...pool], DECK_SEED);
    if (stationDeck.length > 0) {
      const offset = (day * 5) % stationDeck.length;
      chosenStations = [...stationDeck.slice(offset), ...stationDeck].slice(0, 5);
    }
  }

  return { chosenStations, themeLabel };
}

