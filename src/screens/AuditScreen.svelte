<script>
  import { onMount } from 'svelte';
  import { currentScreen } from '../stores.js';
  import GameHeader from '../components/GameHeader.svelte';
  import '../../audit.css';

  const BEST_SESSION_KEY = 'transitguessr_audit_best_session';

  // State
  let queries = $state([]);   // unreviewed candidates from queries.json
  let stations = $state([]);  // decided entries in stations.json
  let selectedId = $state(null);
  let sessionReviewed = $state(0);
  let toastText = $state('');
  let toastActive = $state(false);
  let toastTimer = null;

  // Header center info
  let auditProgressHtml = $state('Loading…');
  let auditStationSystem = $state('');
  let auditStationName = $state('');
  let auditProgressPct = $state(0);

  // Loading / error panel
  let loadingVisible = $state(true);
  let loadingMsg = $state('Loading…');
  let loadingSpinner = $state(true);
  let loadingError = $state(false);

  // DOM refs (imperative)
  let panoEl = $state(null);
  let mapEl = $state(null);

  let leafletMap = null;
  let anchorMarker = null;
  let svService = null;
  let panorama = null;
  let mapsReady = false;

  // ── Toast ──
  function showToast(msg) {
    toastText = msg;
    toastActive = true;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastActive = false; }, 1800);
  }

  // ── Best Session ──
  function getBestSession() {
    try { return parseInt(localStorage.getItem(BEST_SESSION_KEY) || '0', 10); } catch { return 0; }
  }

  function updateBestSession() {
    const best = getBestSession();
    if (sessionReviewed > best) {
      try { localStorage.setItem(BEST_SESSION_KEY, sessionReviewed); } catch {}
    }
  }

  // ── Station helpers ──
  function slugify(value) {
    return String(value).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function buildStationId(s) {
    return [slugify(s.system), slugify(s.city), slugify(s.name)].join('__');
  }

  function normalizeStations(raw) {
    return (raw || []).map(s => ({ ...s, id: s.id || buildStationId(s) }));
  }

  async function loadQueries() {
    const res = await fetch('./src/queries.json');
    if (!res.ok) throw new Error(`Failed to load queries.json: HTTP ${res.status}`);
    return normalizeStations(await res.json());
  }

  async function loadExistingStations() {
    const res = await fetch('./src/stations.json');
    if (!res.ok) return [];
    return normalizeStations(await res.json());
  }

  async function saveFile(endpoint, data) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data, null, 2),
    });
    if (!res.ok) throw new Error(`Save failed: HTTP ${res.status}`);
  }

  // ── Header update ──
  function updateHeader() {
    const station = getSelectedStation();
    const total = queries.length + stations.length;
    auditProgressPct = total ? (stations.length / total) * 100 : 0;
    if (station) {
      auditStationName = station.name;
      auditStationSystem = `${station.city} · ${station.system}`;
    }
  }

  let totalCurated = $derived(stations.filter(s => s.svStatus === 'curated').length);

  // ── Loading panel ──
  function setLoading(msg) {
    loadingMsg = msg;
    loadingSpinner = true;
    loadingError = false;
    loadingVisible = true;
  }

  function hideLoading() {
    loadingVisible = false;
  }

  function showErrorScreen(msg) {
    loadingMsg = msg;
    loadingSpinner = false;
    loadingError = true;
    loadingVisible = true;
  }

  // ── Map ──
  function initializeMap() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    leafletMap = L.map(mapEl, { zoomControl: true }).setView([43.65, -79.38], 15);
    L.tileLayer(tileUrl, { subdomains: 'abcd', maxZoom: 20, attribution: '&copy; OpenStreetMap contributors &copy; CARTO' }).addTo(leafletMap);
  }

  function setAnchorMarker(lat, lng) {
    if (!leafletMap) return;
    const pos = [lat, lng];
    if (!anchorMarker) {
      anchorMarker = L.circleMarker(pos, {
        radius: 8, color: '#f8fafc', weight: 2, fillColor: '#38bdf8', fillOpacity: 1
      }).addTo(leafletMap);
    } else {
      anchorMarker.setLatLng(pos);
    }
    leafletMap.setView(pos, 17);
  }

  // ── Google Maps / Street View ──
  function loadGoogleMaps() {
    const key = window.TRANSITGUESSR_CONFIG?.googleMapsApiKey || '';
    if (!key) return Promise.resolve(false);
    if (window.google?.maps?.StreetViewService) return Promise.resolve(true);
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        let attempts = 0;
        const poll = () => {
          if (window.google?.maps?.StreetViewService) {
            resolve(true);
          } else if (++attempts > 50) {
            resolve(false);
          } else {
            setTimeout(poll, 100);
          }
        };
        poll();
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  function initializePanorama() {
    svService = new google.maps.StreetViewService();
    panorama = new google.maps.StreetViewPanorama(panoEl, {
      addressControl: false, showRoadLabels: true,
      fullscreenControl: false, enableCloseButton: false
    });
  }

  function loadPano(station) {
    if (!mapsReady || !station) return;
    const lat = station.svLat ?? station.lat;
    const lng = station.svLng ?? station.lng;
    const heading = station.svHeading ?? station.heading ?? 0;
    const pitch = station.svPitch ?? 0;
    const panoId = station.svPanoId;

    setAnchorMarker(lat, lng);
    setLoading('Loading Street View…');

    const apply = (data) => {
      panorama.setPano(data.location.pano);
      panorama.setPov({ heading, pitch });
      hideLoading();
    };

    const lookupId = panoId || station._indoorPanoId;
    if (lookupId) {
      svService.getPanorama({ pano: lookupId }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK) apply(data);
        else setLoading('Saved pano not found.');
      });
      return;
    }

    // Try progressively larger radii, then fall back to all sources
    const location = { lat, lng };
    const attempts = [
      { location, radius: 50,  source: google.maps.StreetViewSource.OUTDOOR },
      { location, radius: 100, source: google.maps.StreetViewSource.OUTDOOR },
      { location, radius: 200, source: google.maps.StreetViewSource.OUTDOOR },
      { location, radius: 50,  source: google.maps.StreetViewSource.DEFAULT },
      { location, radius: 150, source: google.maps.StreetViewSource.DEFAULT },
    ];

    const queueIndoorCandidate = (outdoorPanoId) => {
      const location = { lat, lng };
      svService.getPanorama({ location, radius: 150, source: google.maps.StreetViewSource.DEFAULT }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data.location.pano !== outdoorPanoId) {
          const indoorEntry = { ...station, id: station.id + '__indoor', _indoorPanoId: data.location.pano };
          queries = [...queries, indoorEntry];
        }
      });
    };

    const tryNext = (i) => {
      if (i >= attempts.length) {
        handleNo();
        return;
      }
      svService.getPanorama(attempts[i], (data, status) => {
        if (status === google.maps.StreetViewStatus.OK) {
          apply(data);
          // If we found an outdoor pano, check if there's also an indoor one
          if (attempts[i].source === google.maps.StreetViewSource.OUTDOOR) {
            queueIndoorCandidate(data.location.pano);
          }
        } else {
          tryNext(i + 1);
        }
      });
    };
    tryNext(0);
  }

  // ── Station Navigation ──
  function getSelectedStation() {
    return queries.find(s => s.id === selectedId) || null;
  }

  function nextQueryAfter(currentId) {
    if (!queries.length) return null;
    const idx = queries.findIndex(s => s.id === currentId);
    const next = queries[idx + 1];
    return next || null;
  }

  function selectStation(station) {
    if (!station) return;
    selectedId = station.id;
    auditStationName = station.name;
    auditStationSystem = `${station.city} · ${station.system}`;
    updateHeader();
    loadPano(station);
  }

  // ── Decision handlers ──
  function capturePanoState() {
    const panoId = panorama?.getPano();
    const pos = panorama?.getPosition();
    const pov = panorama?.getPov();
    const updates = {};
    if (panoId) updates.svPanoId = panoId;
    if (pos) { updates.svLat = parseFloat(pos.lat().toFixed(6)); updates.svLng = parseFloat(pos.lng().toFixed(6)); }
    if (pov) { updates.svHeading = parseFloat(pov.heading.toFixed(1)); updates.svPitch = parseFloat(pov.pitch.toFixed(1)); }
    return updates;
  }

  function normalizeStationName(name) {
    const patterns = [
      /^STATION\s+/i,
      /\s*[-–]\s*(East|West|North|South)bound\s*(?:\w+\s+)?Platform\s*\d*$/i,
      /\s*[-–]\s*(East|West|North|South)bound/i,
      /\s*[-–]\s*(?:\w+\s+)?Platform\s*\d*$/i,
      /\s*[-–]\s*(Upper|Lower|Mezzanine)\s*(Level|Platform)?/i,
      /\s*[-–]\s*Track\s*\d+/i,
      /\s*[-–]\s*Bay\s*\w+/i,
      /\s*[-–]\s*(Inbound|Outbound)/i,
      /\s+METROMOVER\s+STATION$/i,
      /\s*\.?\s*STAT\.?\s*RAIL\s+(NORTH|SOUTH|EAST|WEST)BOUND$/i,
      /\s+STATION\s+RAIL\s+(NORTH|SOUTH|EAST|WEST)BOUND$/i,
      /\s+STATION\s+(NORTH|SOUTH|EAST|WEST)BOUND$/i,
      /\s+METRO$/i,
      /\s*\((Subway|LRT|Metro|Rail|Light Rail|Skytrain)\)$/i,
      /\s*\(Berlin\)$/i,
      /\s*\(Manchester Metrolink\)$/i,
      /\s*\(Edinburgh Trams\)$/i,
      /\s*\((EB|WB|NB|SB)\)$/i,
      /\s*\((Blue|Red|Green|Pink|Orange|Brown|Purple)[^)]*\)$/i,
      /\s+Underground Station$/i,
      /\s+SPT Subway Station$/i,
      /\s+Overground Station$/i,
      /(?<!Union)(?<!Central)(?<!Victoria)(?<!Paddington)(?<!Waterloo)\s+Station$/i,
    ];
    for (const p of patterns) name = name.replace(p, '');
    name = name.trim();
    if (name === name.toUpperCase() && /[A-Z]/.test(name)) {
      name = name.toLowerCase().replace(/(^|[\s\-/])(\S)/g, (_, sep, c) => sep + c.toUpperCase())
        .replace(/(\d)(st|nd|rd|th)\b/gi, (_, n, s) => n + s.toLowerCase());
    }
    return name;
  }

  async function decide(extraFields, toast) {
    const station = getSelectedStation();
    if (!station) return;
    const next = nextQueryAfter(station.id);

    // Move from queries → stations
    const panoState = capturePanoState();
    const decided = { ...station, ...panoState, ...extraFields, name: normalizeStationName(station.name) };
    queries = queries.filter(s => s.id !== station.id);
    stations = [...stations, decided];

    await Promise.all([
      saveFile('/api/save-queries', queries.map(({ id: _id, ...s }) => s)),
      saveFile('/api/save-stations', stations.map(({ id: _id, ...s }) => s)),
    ]);

    sessionReviewed++;
    updateBestSession();
    updateHeader();
    showToast(toast);

    if (next) selectStation(next);
    else { updateHeader(); setLoading('All done!'); loadingSpinner = false; }
  }

  async function handleIndoors() { await decide({ svStatus: 'curated', svEnvironment: 'indoor' }, '✓ Indoors'); }
  async function handleOutdoors() { await decide({ svStatus: 'curated', svEnvironment: 'outdoor' }, '✓ Outdoors'); }
  async function handleNo() { await decide({ svStatus: 'skip' }, 'Skipped'); }

  function handleSkip() {
    // Defer: move current entry to end of queue without recording any decision
    const station = getSelectedStation();
    if (!station) return;
    const next = nextQueryAfter(station.id);
    queries = [...queries.filter(s => s.id !== station.id), station];
    if (next) selectStation(next);
  }

  // ── Keyboard ──
  function onKeydown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'i' || e.key === 'I') handleIndoors();
    if (e.key === 'o' || e.key === 'O') handleOutdoors();
    if (e.key === 'n' || e.key === 'N') handleNo();
    if (e.key === 's' || e.key === 'S') handleSkip();
  }

  function handleTitleClick() {
    currentScreen.set('start');
  }

  onMount(() => {
    window.TRANSITGUESSR_CONFIG = window.TRANSITGUESSR_CONFIG || {};

    const tryInitMap = () => {
      if (typeof L !== 'undefined') {
        initializeMap();
        init();
      } else {
        setTimeout(tryInitMap, 50);
      }
    };
    tryInitMap();

    window.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener('keydown', onKeydown);
      if (leafletMap) { leafletMap.remove(); leafletMap = null; }
    };
  });

  function loadOptionalScript(src) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  async function init() {
    try {
      await loadOptionalScript('./config.local.js');
      const [queriesResult, stationsResult, mapsReadyResult] = await Promise.all([
        loadQueries(),
        loadExistingStations(),
        loadGoogleMaps(),
      ]);

      queries = queriesResult.sort(() => Math.random() - 0.5);
      stations = stationsResult;
      updateHeader();

      if (!mapsReadyResult) {
        showErrorScreen('Google Maps API failed to load. Please verify your API key in config.local.js and ensure billing/Street View API is enabled.');
        return;
      }

      mapsReady = true;
      initializePanorama();

      const first = queries[0];
      if (first) {
        selectStation(first);
      } else {
        setLoading('No stations to review.');
        loadingSpinner = false;
      }
    } catch (err) {
      console.error('audit init failed:', err);
      showErrorScreen(err.message || 'An unexpected error occurred during initialization.');
    }
  }

</script>

<div id="audit-screen">
  <div id="toast" class:active={toastActive}>{toastText}</div>

  <GameHeader mode="Station Curation" onTitleClick={handleTitleClick}>
    {#snippet center()}
      <div class="round-info">
        This session: <strong>{sessionReviewed}</strong>
        <span class="header-divider">|</span>Best: <strong>{getBestSession()}</strong>
        <span class="header-divider">|</span>Curated: <strong>{totalCurated}</strong>
        <span class="header-divider">|</span>Remaining: <strong>{queries.length}</strong>
      </div>
      {#if auditStationSystem}
        <span class="header-divider">|</span>
        <div class="round-info">{auditStationSystem}</div>
      {/if}
      {#if auditStationName}
        <span class="header-divider" style="display: none" id="audit-station-sep"></span>
        <div class="audit-station-name">{auditStationName}</div>
      {/if}
    {/snippet}
    {#snippet right()}
      <button type="button" class="btn-quit" onclick={() => currentScreen.set('start')}>
        <svg class="quit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Back</span>
      </button>
    {/snippet}
  </GameHeader>

  <div class="timer-bar-wrap">
    <div class="timer-bar-fill audit-progress-fill" style="width: {auditProgressPct}%"></div>
  </div>

  <div class="game-body">
    <div class="photo-panel">
      <div id="audit-pano" bind:this={panoEl}></div>
      {#if loadingVisible}
        <div class="photo-loading" class:error-active={loadingError}>
          {#if loadingError}
            <div class="audit-error-container">
              <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div class="error-title">Curation Tool Error</div>
              <div class="error-msg">{loadingMsg}</div>
            </div>
          {:else}
            {#if loadingSpinner}<div class="spinner"></div>{/if}
            {loadingMsg}
            {#if loadingMsg === 'Loading Street View…' || loadingMsg === 'Saved pano not found.'}
              <button type="button" class="loading-skip-btn" onclick={handleSkip}>Skip <kbd>S</kbd></button>
            {/if}
          {/if}
        </div>
      {/if}
    </div>

    <div class="map-panel">
      <div id="audit-map" bind:this={mapEl}></div>
      <div class="map-footer">
        <div class="map-hint">Does Street View clearly show the station entrance?</div>
        <button type="button" class="audit-no-btn" onclick={handleNo}>No <kbd>N</kbd></button>
        <button type="button" class="audit-env-btn" onclick={handleIndoors}>Indoors <kbd>I</kbd></button>
        <button type="button" class="audit-env-btn" onclick={handleOutdoors}>Outdoors <kbd>O</kbd></button>
      </div>
    </div>
  </div>
</div>
