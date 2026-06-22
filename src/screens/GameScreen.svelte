<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { currentScreen, selectedMode, selectedDifficulty, toastMsg } from '../stores.js';
  import { MODES, SITE_URL, STATION_NAME_REVEAL_SCORE } from '../config.js';
  import STATIONS from '../stations.json';
  import * as StationUtils from '../station-utils.js';
  import { escHtml, seededShuffle, shuffle, haversineKm, bearingBetween } from '../utils.js';
  import { getDayNumber, markDailyPlayed, getDailyThemeType, THEME_NAMES } from '../daily.js';
  import { reportStation } from '../reports.js';
  import { CITY_REGIONS } from '../config.js';
  import GameHeader from '../components/GameHeader.svelte';

  let { onGameEnd } = $props();

  // ── DOM refs (imperative map/sv) ──
  let svPanoEl = $state(null);
  let mapEl = $state(null);

  // ── Game State ──
  let mode = $state('worldwide');
  let currentRound = $state(0);
  let totalScore = $state(0);
  let roundResults = $state([]);
  let roundStations = $state([]);
  let dailyThemeLabel = $state('');
  let replacementPool = $state([]);
  let reportModalOpen = $state(false);
  let reportSubmitted = $state(false);
  let isSubmitting = $state(false);
  let guessLatLng = $state(null);
  let timeLeft = $state(60);
  let hotStreak = $state(0);
  let mapHintText = $state('Click the map to place your pin');
  let guessBtnDisabled = $state(true);

  // Result overlay state
  let resultActive = $state(false);
  let resultPeeking = $state(false);
  let resultTimedOut = $state(false);
  let resultPerfectHit = $state(false);
  let resultKicker = $state('Round Result');
  let resultStationName = $state('');
  let resultSystem = $state('');
  let resultDistance = $state('');
  let resultPts = $state('');
  let resultScoreBarWidth = $state('0%');
  let resultRound = $state('');
  let resultNextLabel = $state('Next Round');
  let reactionLabel = $state('Finding the line...');
  let reactionTone = $state('');

  // Photo loading
  let photoLoadingVisible = $state(true);
  let photoLoadingMsg = $state('Loading Street View...');
  let photoLoadingSpinner = $state(true);

  const ROUND_TIME = 60;
  const NORMALIZED_STATIONS = StationUtils.normalizeStations(STATIONS);

  let svService = null;
  let svPanorama = null;
  let leafletMap = null;
  let guessMarker = null;
  let resultLayer = null;
  let tileLayer = null;
  let timerInterval = null;
  let svApiWaitCount = 0;
  let googleMapsLoadPromise = null;
  let configLoadPromise = null;
  let startGamePromise = null;
  let preloadedPanoData = null; // { stationId, pano, latLng }

  function loadOptionalScript(src) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  function getMapsApiKey() {
    return window.TRANSITGUESSR_CONFIG?.googleMapsApiKey || '';
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

  // ── High Score ──
  function getHighScoreKey() {
    return mode === 'daily'
      ? `transitguessr_hs_daily_${getDayNumber()}`
      : `transitguessr_hs_${mode}`;
  }

  function getHighScore() {
    try { return parseInt(localStorage.getItem(getHighScoreKey()) || '0'); } catch { return 0; }
  }

  function saveHighScore(score) {
    try { localStorage.setItem(getHighScoreKey(), score); } catch {}
  }

  // ── Daily ──

  // ── Seen Stations ──
  function getSeenIds() {
    try { return JSON.parse(localStorage.getItem('transitguessr_seen_ids') || '[]'); } catch { return []; }
  }

  function markSeen(ids) {
    try {
      const seen = getSeenIds();
      const unique = [...new Set([...seen, ...ids])];
      const capped = unique.slice(-200);
      localStorage.setItem('transitguessr_seen_ids', JSON.stringify(capped));
    } catch {}
  }

  // ── Score ──
  // Expert: scale derived from actual geographic spread of the round's stations
  let expertScale = $derived.by(() => {
    if (!roundStations.length) return 2000;
    const lats = roundStations.map(s => s.lat);
    const lngs = roundStations.map(s => s.lng);
    const diagonal = haversineKm(
      Math.min(...lats), Math.min(...lngs),
      Math.max(...lats), Math.max(...lngs)
    );
    return Math.max(1, Math.min(2000, diagonal / 4));
  });

  function calcScore(distKm) {
    let scale;
    if ($selectedDifficulty === 'expert') {
      scale = expertScale;
    } else {
      scale = ['worldwide', 'daily'].includes(mode) ? 2000 : 5;
    }
    return Math.round(5000 * Math.exp(-distKm / scale));
  }

  function shouldRevealStationName(pts) {
    return pts >= STATION_NAME_REVEAL_SCORE;
  }

  // ── Street View helpers ──
  function getStreetViewSearchPlan(station) {
    const hasCuratedAnchor = StationUtils.hasCuratedStreetViewAnchor(station);
    const radius = station.svRadius ?? (hasCuratedAnchor ? 32 : 20);
    const maxPanoDistance = station.svMaxDistance ?? (hasCuratedAnchor ? 48 : 28);
    return {
      anchor: StationUtils.getStreetViewAnchor(station),
      searchRadii: [radius, radius + (hasCuratedAnchor ? 16 : 10), radius + (hasCuratedAnchor ? 32 : 20)],
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

  // ── Reactions ──
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

  function gradeLabel(score) {
    const pct = score / 25000;
    if (mode === 'toronto') {
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

  // ── Timer ──
  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = ROUND_TIME;
    const bar = document.getElementById('timer-bar');
    if (bar) {
      bar.style.transition = 'none';
      bar.style.width = '100%';
      bar.classList.remove('danger');
      bar.getBoundingClientRect();
      bar.style.transition = 'width 1s linear, background 0.3s';
    }

    timerInterval = setInterval(() => {
      timeLeft--;
      const b = document.getElementById('timer-bar');
      if (b) {
        b.style.width = `${(timeLeft / ROUND_TIME) * 100}%`;
        if (timeLeft <= 10) b.classList.add('danger');
      }
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        autoSubmit();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  // ── Map ──
  function initMap() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const url = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    leafletMap = L.map(mapEl, { center: [43.72, -79.40], zoom: 11, zoomControl: true, tap: false });
    tileLayer = L.tileLayer(url, {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors &copy; <a href="https://carto.com">CARTO</a>',
      subdomains: 'abcd', maxZoom: 19
    }).addTo(leafletMap);
    resultLayer = L.layerGroup().addTo(leafletMap);
    leafletMap.on('click', onMapClick);
  }

  function updateMapTheme() {
    if (!leafletMap || !tileLayer) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const url = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    tileLayer.setUrl(url);
  }

  function onMapClick(e) {
    guessLatLng = e.latlng;
    if (guessMarker) leafletMap.removeLayer(guessMarker);
    guessMarker = L.circleMarker(e.latlng, {
      radius: 10, fillColor: '#3b82f6', color: '#fff',
      weight: 2.5, fillOpacity: 1, zIndexOffset: 1000
    }).addTo(leafletMap);
    guessBtnDisabled = false;
    mapHintText = 'Click to reposition · Confirm when ready';
  }

  function setupRound() {
    isSubmitting = false;
    guessLatLng = null;
    guessBtnDisabled = true;
    mapHintText = 'Click the map to place your pin';

    if (guessMarker) { leafletMap.removeLayer(guessMarker); guessMarker = null; }
    if (resultLayer) resultLayer.clearLayers();

    if (leafletMap) {
      if (mode === 'toronto') {
        leafletMap.setView([43.72, -79.40], 11);
      } else {
        leafletMap.setView([30, 10], 2);
      }
      setTimeout(() => leafletMap.invalidateSize(), 50);
    }
  }

  // ── Street View ──
  function setPhotoLoadingState(message, showSpinner = false) {
    photoLoadingMsg = message;
    photoLoadingSpinner = showSpinner;
    photoLoadingVisible = true;
  }

  function loadStreetView() {
    const station = roundStations[currentRound];
    const { anchor, searchRadii } = getStreetViewSearchPlan(station);
    const pov = StationUtils.getStreetViewPov(station);

    setPhotoLoadingState('Loading Street View...', true);

    if (typeof google === 'undefined' || !google.maps || !google.maps.StreetViewService) {
      if (++svApiWaitCount > 100) {
        svApiWaitCount = 0;
        handleNoStreetView(station);
        return;
      }
      setTimeout(() => loadStreetView(), 100);
      return;
    }
    svApiWaitCount = 0;

    if (!svService) svService = new google.maps.StreetViewService();

    const ensurePanorama = () => {
      if (!svPanorama) {
        svPanorama = new google.maps.StreetViewPanorama(svPanoEl, {
          addressControl: false, showRoadLabels: false, zoomControl: false,
          fullscreenControl: false, motionTrackingControl: false,
          panControl: false, linksControl: false, clickToGo: false,
          enableCloseButton: false,
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
      photoLoadingVisible = false;
    };

    const tryPanorama = (index) => {
      if (index >= searchRadii.length) { handleNoStreetView(station); return; }
      svService.getPanorama(
        { location: anchor, radius: searchRadii[index], sources: [google.maps.StreetViewSource.OUTDOOR] },
        (data, status) => {
          if (status !== google.maps.StreetViewStatus.OK || !isStreetViewCandidateUsable(station, data)) {
            tryPanorama(index + 1);
            return;
          }
          applyPanoramaData(data);
        }
      );
    };

    // Use preloaded data if available for this station
    if (preloadedPanoData?.stationId === station.id) {
      const cached = preloadedPanoData;
      preloadedPanoData = null;
      ensurePanorama();
      svPanorama.setPano(cached.pano);
      svPanorama.setPov({
        heading: station.svPanoId ? pov.heading : getStreetViewHeading(station, cached.latLng),
        pitch: pov.pitch
      });
      photoLoadingVisible = false;
      return;
    }
    preloadedPanoData = null;

    const realPanoId = station.svPanoId && station.svPanoId !== 'legacy' ? station.svPanoId : null;
    if (realPanoId) {
      svService.getPanorama({ pano: realPanoId }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK) { applyPanoramaData(data); return; }
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
      const modeConfig = MODES[mode];
      const pool = StationUtils.selectStationPool(modeConfig ? NORMALIZED_STATIONS.filter(modeConfig.filter) : NORMALIZED_STATIONS, 1);
      const usedIds = roundStations.map(s => s.id);
      const fallbacks = shuffle(pool.filter(s => !usedIds.includes(s.id)));
      if (fallbacks.length > 0) roundStations[currentRound] = fallbacks[0];
      loadStreetView();
    }, 2000);
  }

  function preloadNextStation() {
    const nextStation = roundStations[currentRound + 1];
    if (!nextStation || !svService) return;
    preloadedPanoData = null;

    const anchor = { lat: nextStation.svLat ?? nextStation.lat, lng: nextStation.svLng ?? nextStation.lng };
    const searchRadii = [40, 80, 150];

    const store = (data) => {
      preloadedPanoData = { stationId: nextStation.id, pano: data.location.pano, latLng: data.location.latLng };
    };

    const nextPanoId = nextStation.svPanoId && nextStation.svPanoId !== 'legacy' ? nextStation.svPanoId : null;
    if (nextPanoId) {
      svService.getPanorama({ pano: nextPanoId }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK) store(data);
      });
      return;
    }

    const tryNext = (i) => {
      if (i >= searchRadii.length) return;
      svService.getPanorama(
        { location: anchor, radius: searchRadii[i], sources: [google.maps.StreetViewSource.OUTDOOR] },
        (data, status) => {
          if (status === google.maps.StreetViewStatus.OK && isStreetViewCandidateUsable(nextStation, data)) {
            store(data);
          } else {
            tryNext(i + 1);
          }
        }
      );
    };
    tryNext(0);
  }

  // ── Game Flow ──
  async function startGame() {
    if (startGamePromise) return startGamePromise;

    startGamePromise = (async () => {
      const currentMode = get(selectedMode);
      mode = currentMode;
      currentRound = 0;
      totalScore = 0;
      roundResults = [];
      roundStations = [];
      isSubmitting = false;
      hotStreak = 0;
      clearInterval(timerInterval);

      if (currentMode === 'daily') {
        const pool = StationUtils.selectStationPool(NORMALIZED_STATIONS);
        const day = getDayNumber();
        const themeType = getDailyThemeType();
        let chosenStations = [];
        let themeLabel = '';

        // Fixed seed for ordering — determines the cycle order, not the stations themselves
        const DECK_SEED = 7331;

        // Pick item at position (day mod deck size) from a fixed-order deck,
        // then seed station selection within that item by day so stations vary each cycle
        const pickFromDeck = (items, itemSeed = DECK_SEED) => {
          const deck = seededShuffle([...items], itemSeed);
          return deck[day % deck.length];
        };

        if (themeType === 'city') {
          const byCity = {};
          pool.forEach(s => { if (!byCity[s.city]) byCity[s.city] = []; byCity[s.city].push(s); });
          const cityCounts = Object.values(byCity).map(s => s.length).sort((a, b) => a - b);
          const q1 = cityCounts[Math.floor(cityCounts.length * 0.25)];
          const q3 = cityCounts[Math.floor(cityCounts.length * 0.75)];
          const iqr = q3 - q1;
          const outlierThreshold = q3 + 1.5 * iqr;
          const inlierCounts = cityCounts.filter(n => n <= outlierThreshold);
          const mean = inlierCounts.reduce((a, b) => a + b, 0) / (inlierCounts.length || 1);
          const cityFloor = Math.max(5, Math.round(mean));
          const eligibleCities = Object.keys(byCity).filter(c => byCity[c].length >= cityFloor).sort();
          const city = pickFromDeck(eligibleCities);
          chosenStations = seededShuffle([...byCity[city]], day).slice(0, 5);
          themeLabel = city;

        } else if (themeType === 'region') {
          const byRegion = {};
          pool.forEach(s => {
            const r = CITY_REGIONS[s.city] || 'Other';
            if (!byRegion[r]) byRegion[r] = [];
            byRegion[r].push(s);
          });
          const eligibleRegions = Object.keys(byRegion).filter(r => r !== 'Other' && byRegion[r].length >= 5).sort();
          const region = pickFromDeck(eligibleRegions);
          const regionPool = byRegion[region];
          const bySystem = {};
          regionPool.forEach(s => { if (!bySystem[s.system]) bySystem[s.system] = []; bySystem[s.system].push(s); });
          const systems = seededShuffle(Object.keys(bySystem).sort(), DECK_SEED).slice(0, 5);
          systems.forEach((sys, idx) => {
            const s = seededShuffle([...bySystem[sys]], day + idx)[0];
            if (s) chosenStations.push(s);
          });
          if (chosenStations.length < 5) {
            const extra = seededShuffle([...regionPool], day + 99).filter(s => !chosenStations.includes(s));
            chosenStations.push(...extra.slice(0, 5 - chosenStations.length));
          }
          themeLabel = region;

        } else if (themeType === 'worldwide') {
          const bySystem = {};
          pool.forEach(s => { if (!bySystem[s.system]) bySystem[s.system] = []; bySystem[s.system].push(s); });
          // Fixed system order, rotate through it — each cycle picks a different offset
          const systemDeck = seededShuffle(Object.keys(bySystem).sort(), DECK_SEED);
          const offset = (day * 5) % systemDeck.length;
          const systems = [...systemDeck.slice(offset), ...systemDeck].slice(0, 5);
          systems.forEach((sys, idx) => {
            const s = seededShuffle([...bySystem[sys]], day + idx)[0];
            if (s) chosenStations.push(s);
          });
          themeLabel = THEME_NAMES.worldwide;

        } else {
          // random — exhaust all stations before repeating
          const stationDeck = seededShuffle([...pool], DECK_SEED);
          const offset = (day * 5) % stationDeck.length;
          chosenStations = [...stationDeck.slice(offset), ...stationDeck].slice(0, 5);
          themeLabel = THEME_NAMES.random;
        }

        roundStations = chosenStations;
        dailyThemeLabel = themeLabel;
        replacementPool = pool;
      } else {
        const modeConfig = MODES[currentMode];
        const pool = StationUtils.selectStationPool(modeConfig ? NORMALIZED_STATIONS.filter(modeConfig.filter) : NORMALIZED_STATIONS);
        const seen = getSeenIds();
        const unseen = pool.filter(s => !seen.includes(s.id));
        const finalPool = unseen.length >= 5 ? unseen : pool;
        roundStations = shuffle(finalPool).slice(0, 5);
        markSeen(roundStations.map(s => s.id));
        replacementPool = pool;
      }

      resultActive = false;
      setupRound();
      startTimer();

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

  function submitGuess() {
    if (isSubmitting || !guessLatLng) return;
    isSubmitting = true;
    stopTimer();

    const station = roundStations[currentRound];
    const dist = haversineKm(guessLatLng.lat, guessLatLng.lng, station.lat, station.lng);
    const pts = calcScore(dist);
    const revealName = shouldRevealStationName(pts);
    totalScore += pts;
    roundResults = [...roundResults, { station, dist, pts, timedOut: false }];
    hotStreak = pts >= 3600 ? hotStreak + 1 : 0;

    const totalKey = 'transitguessr_total_guessed';
    localStorage.setItem(totalKey, (parseInt(localStorage.getItem(totalKey) || '0') + 1));

    const actualLatLng = L.latLng(station.lat, station.lng);
    L.polyline([guessLatLng, actualLatLng], { color: '#94a3b8', weight: 2, dashArray: '6 5' }).addTo(resultLayer);
    const actualMarker = L.circleMarker(actualLatLng, {
      radius: 12, fillColor: '#10b981', color: '#fff', weight: 2.5, fillOpacity: 1
    }).addTo(resultLayer);
    if (revealName) {
      actualMarker.bindTooltip(station.name, { permanent: true, direction: 'top', offset: [0, -12] });
    }
    leafletMap.fitBounds([guessLatLng, actualLatLng], { padding: [70, 70], maxZoom: 14, minZoom: 2 });

    const distText = dist < 1 ? `${Math.round(dist * 1000)} m away` : `${dist.toFixed(2)} km away`;

    resultStationName = revealName ? station.name : `Station hidden (${STATION_NAME_REVEAL_SCORE.toLocaleString()}+ to reveal)`;
    resultSystem = `${station.city} · ${station.system}`;
    resultDistance = distText;
    resultPts = pts.toLocaleString();
    resultScoreBarWidth = `${(pts / 5000) * 100}%`;
    const reaction = reactionForGuess(dist, pts);
    reactionLabel = reaction.label;
    reactionTone = reaction.tone;
    resultTimedOut = false;
    resultPerfectHit = pts >= 5000;
    resultKicker = 'Round Result';
    resultRound = `Round ${currentRound + 1} of 5`;
    resultNextLabel = currentRound === roundStations.length - 1 ? 'See Results' : 'Next Round';
    updateStreak();
    resultActive = true;
    resultPeeking = false;
    preloadNextStation();
  }

  function updateStreak() {
    // streak display handled via hotStreak reactive var
  }

  function autoSubmit() {
    if (isSubmitting) return;
    if (guessLatLng) { submitGuess(); return; }

    isSubmitting = true;
    const station = roundStations[currentRound];
    totalScore += 0;
    roundResults = [...roundResults, { station, dist: null, pts: 0, timedOut: true }];
    hotStreak = 0;

    resultStationName = `Station hidden (${STATION_NAME_REVEAL_SCORE.toLocaleString()}+ to reveal)`;
    resultSystem = `${station.city} · ${station.system}`;
    resultDistance = 'Time ran out — no guess placed';
    resultPts = '0';
    resultScoreBarWidth = '0%';
    const reaction = reactionForGuess(null, 0, true);
    reactionLabel = reaction.label;
    reactionTone = reaction.tone;
    resultTimedOut = true;
    resultPerfectHit = false;
    resultKicker = 'Round Timed Out';
    resultRound = `Round ${currentRound + 1} of 5`;
    resultNextLabel = currentRound === roundStations.length - 1 ? 'See Results' : 'Next Round';
    resultActive = true;
    resultPeeking = false;
    preloadNextStation();
  }

  function nextRound() {
    currentRound++;
    if (currentRound < roundStations.length) {
      resultActive = false;
      setupRound();
      loadStreetView();
      startTimer();
    } else {
      // End game
      if (mode === 'daily') markDailyPlayed(totalScore);
      const prev = getHighScore();
      const isNew = totalScore > prev;
      if (isNew) saveHighScore(totalScore);
      onGameEnd({
        totalScore,
        roundResults,
        mode,
        isNewRecord: isNew,
        previousBest: prev,
        dayNumber: getDayNumber(),
        dailyThemeLabel
      });
    }
  }

  function submitReport(reportType) {
    const station = roundStations[currentRound];
    if (!station) return;
    reportStation(station.id, station.name, reportType);

    // Swap in a replacement from the same pool so theme is preserved
    const usedIds = new Set(roundStations.map(s => s.id));
    const candidates = replacementPool.filter(s => !usedIds.has(s.id));
    const replacement = candidates[Math.floor(Math.random() * candidates.length)];

    reportSubmitted = true;
    setTimeout(() => {
      reportModalOpen = false;
      reportSubmitted = false;
      // Remove reported station, append replacement at end so it preloads during play
      const updated = roundStations.filter((_, i) => i !== currentRound);
      if (replacement) updated.push(replacement);
      roundStations = updated;
      // Next station (already preloaded) is now at currentRound — just reload
      stopTimer();
      setupRound();
      loadStreetView();
      startTimer();
    }, 1200);
  }

  function togglePeek() {
    resultPeeking = !resultPeeking;
  }

  function quitGame() {
    if (confirm('Are you sure you want to quit the current game? Your progress will be lost.')) {
      stopTimer();
      currentScreen.set('start');
    }
  }

  function handleTitleClick() {
    quitGame();
  }

  // ── Mode badge label ──
  let modeBadgeLabel = $derived.by(() => {
    if (mode !== 'daily') return MODES[mode]?.name || mode;
    const themeType = getDailyThemeType();
    const themeName = THEME_NAMES[themeType];
    const suffix = (themeType === 'city' || themeType === 'region') && dailyThemeLabel
      ? `${themeName}: ${dailyThemeLabel}`
      : themeName;
    return `Daily #${getDayNumber()} · ${suffix}`;
  });

  let streakDisplay = $derived(
    hotStreak > 1 ? `${hotStreak}-round streak` : 'No streak'
  );

  // ── Keyboard handler ──
  function onKeydown(e) {
    if (e.key === 'Escape') {
      if (resultActive && resultPeeking) togglePeek();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.key === ' ') e.preventDefault();
      if (resultActive) {
        nextRound();
      } else if (guessLatLng && !isSubmitting) {
        submitGuess();
      }
    }
  }

  onMount(() => {
    window.TRANSITGUESSR_CONFIG = window.TRANSITGUESSR_CONFIG || {};
    configLoadPromise = loadOptionalScript('./config.local.js');

    // Wait for Leaflet to be available
    const tryInitMap = () => {
      if (typeof L !== 'undefined') {
        initMap();
        startGame();
      } else {
        setTimeout(tryInitMap, 50);
      }
    };
    tryInitMap();

    window.addEventListener('keydown', onKeydown);

    return () => {
      window.removeEventListener('keydown', onKeydown);
      stopTimer();
      if (leafletMap) { leafletMap.remove(); leafletMap = null; }
    };
  });
</script>

<div id="game-screen" class="active">
  <GameHeader mode={modeBadgeLabel} onTitleClick={handleTitleClick}>
    {#snippet center()}
      <div class="round-info">Round <strong>{currentRound + 1}</strong> / 5</div>
      <span class="header-divider">|</span>
      <div class="streak-display">{streakDisplay}</div>
      <span class="header-divider">|</span>
      <div class="score-display">{totalScore.toLocaleString()} pts</div>
    {/snippet}
    {#snippet right()}
      <button type="button" class="btn-quit" title="Quit game and return to main menu" onclick={quitGame}>
        <svg class="quit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Quit</span>
      </button>
    {/snippet}
  </GameHeader>

  <div class="timer-bar-wrap"><div class="timer-bar-fill" id="timer-bar"></div></div>

  <div class="game-body">
    <div class="photo-panel">
      <div id="sv-pano" bind:this={svPanoEl}></div>
      {#if photoLoadingVisible}
        <div class="photo-loading">
          {#if photoLoadingSpinner}<div class="spinner"></div>{/if}
          {photoLoadingMsg}
        </div>
      {/if}

      <button
        type="button"
        class="btn-report-flag"
        title="Report an issue with this station"
        onclick={() => { reportModalOpen = true; reportSubmitted = false; }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
      </button>

      {#if reportModalOpen}
        <div class="report-modal">
          {#if reportSubmitted}
            <p class="report-thanks">Thanks, we'll review it.</p>
          {:else}
            <p class="report-label">What's wrong with this station?</p>
            <button type="button" class="report-option" onclick={() => submitReport('not_a_station')}>
              Not a transit station
            </button>
            <button type="button" class="report-option" onclick={() => submitReport('unusable')}>
              Can't tell where this is
            </button>
            <button type="button" class="report-cancel" onclick={() => reportModalOpen = false}>Cancel</button>
          {/if}
        </div>
      {/if}
    </div>
    <div class="map-panel">
      <div id="map" bind:this={mapEl}></div>
      <div class="map-footer">
        <div class="map-hint">{mapHintText}</div>
        <button
          type="button"
          class="btn-guess"
          disabled={guessBtnDisabled}
          onclick={submitGuess}
        >Confirm Guess</button>
      </div>
    </div>
  </div>
</div>

<!-- Result Overlay -->
<div
  id="result-overlay"
  class:active={resultActive}
  class:peek={resultPeeking}
  class:timed-out={resultTimedOut}
  class:perfect-hit={resultPerfectHit}
>
  <div class="result-content">
    <button type="button" class="view-photo-btn" onclick={togglePeek}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      View Photo
    </button>
    <div class="result-kicker">{resultKicker}</div>
    <div class="result-header">
      <div class="result-copy">
        <div class="result-station-name">{resultStationName}</div>
        <div class="result-system">{resultSystem}</div>
      </div>
      <div class="result-score-block">
        <div class="result-pts">{resultPts}</div>
        <div class="result-pts-label">points</div>
      </div>
    </div>
    <div class="score-bar-wrap" aria-hidden={resultTimedOut ? 'true' : 'false'}>
      <div class="score-bar-fill" style="width: {resultScoreBarWidth}"></div>
    </div>
    <div class="result-metrics">
      <div class="result-metric-card">
        <div class="result-metric-label">Miss Distance</div>
        <div class="result-distance">{resultDistance}</div>
      </div>
      <div class="result-metric-card">
        <div class="result-metric-label">Progress</div>
        <div class="result-round">{resultRound}</div>
      </div>
    </div>
    <div class="result-footer">
      <div class="reaction-chip {reactionTone}">{reactionLabel}</div>
      <button type="button" class="btn-next" onclick={nextRound}>{resultNextLabel}</button>
    </div>
  </div>
</div>
