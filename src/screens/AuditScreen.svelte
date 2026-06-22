<script>
  import { onMount } from 'svelte';
  import { currentScreen, toastMsg } from '../stores.js';
  import GameHeader from '../components/GameHeader.svelte';
  import Modal from '../components/Modal.svelte';
  import PhotoLoading from '../components/PhotoLoading.svelte';
  import '../../audit.css';

  const BEST_SESSION_KEY = 'transitguessr_audit_best_session';

  // State
  let queries = $state([]);   // unreviewed candidates from queries.json
  let stations = $state([]);  // decided entries in stations.json
  let selectedId = $state(null);
  let sessionReviewed = $state(0);

  // Header center info
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

  // Audit mode
  let auditMode = $state(null); // null = picker, 'screen', 'details'

  // Details mode
  let detailStations = $state([]);
  let detailIdx = $state(0);
  let detailTags = $state(new Set());
  let detailSaving = $state(false);
  let customTagInput = $state('');

  const AUDIT_TAGS = [
    { key: 'underground',     label: 'Underground' },
    { key: 'elevated',        label: 'Elevated' },
    { key: 'island-platform', label: 'Island Platform' },
    { key: 'side-platform',   label: 'Side Platform' },
    { key: 'snowy',           label: 'Snowy' },
    { key: 'heritage',        label: 'Heritage' },
    { key: 'art',             label: 'Notable Art' },
    { key: 'modern',          label: 'Modern' },
    { key: 'coastal',         label: 'Coastal' },
    { key: 'vaulted',         label: 'Vaulted Ceiling' },
    { key: 'brutalist',       label: 'Brutalist' },
    { key: 'tram',            label: 'Tram/LRT' },
  ];

  let leafletMap = null;
  let anchorMarker = null;
  let svService = null;
  let panorama = null;
  let mapsReady = false;

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
    toastMsg.set(toast);

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

  // ── Details mode ──
  function loadDetailStation(idx) {
    if (idx < 0 || idx >= detailStations.length) return;
    const station = detailStations[idx];
    detailIdx = idx;
    detailTags = new Set(station.tags || []);
    auditStationName = station.name;
    auditStationSystem = `${station.city} · ${station.system}`;
    auditProgressPct = detailStations.length ? ((idx + 1) / detailStations.length) * 100 : 0;
    loadPano(station);
  }

  function toggleTag(key) {
    const next = new Set(detailTags);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    detailTags = next;
  }

  function addCustomTag() {
    const key = customTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key) return;
    detailTags = new Set([...detailTags, key]);
    customTagInput = '';
  }

  const PRESET_KEYS = new Set(AUDIT_TAGS.map(t => t.key));

  async function saveDetailAndAdvance(dir) {
    const station = detailStations[detailIdx];
    if (!station) return;
    detailSaving = true;
    const updated = { ...station, tags: [...detailTags].sort() };
    detailStations = detailStations.map((s, i) => i === detailIdx ? updated : s);
    const allStations = stations.map(s => s.id === station.id ? { ...s, tags: [...detailTags].sort() } : s);
    stations = allStations;
    await saveFile('/api/save-stations', allStations.map(({ id: _id, ...s }) => s));
    detailSaving = false;
    toastMsg.set('Saved');
    const next = detailIdx + dir;
    if (next >= 0 && next < detailStations.length) loadDetailStation(next);
  }

  onMount(() => {
    window.TRANSITGUESSR_CONFIG = window.TRANSITGUESSR_CONFIG || {};
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

  async function startMode(mode) {
    auditMode = mode;
    setLoading('Loading…');
    try {
      await loadOptionalScript('./config.local.js');
      const [queriesResult, stationsResult, mapsReadyResult] = await Promise.all([
        mode === 'screen' ? loadQueries() : Promise.resolve([]),
        loadExistingStations(),
        loadGoogleMaps(),
      ]);

      stations = stationsResult;

      if (!mapsReadyResult) {
        showErrorScreen('Google Maps API failed to load. Check your API key in config.local.js.');
        return;
      }
      mapsReady = true;
      initializePanorama();

      if (mode === 'screen') {
        if (typeof L !== 'undefined' && mapEl) initializeMap();
        queries = queriesResult.sort(() => Math.random() - 0.5);
        updateHeader();
        const first = queries[0];
        if (first) selectStation(first);
        else { setLoading('No stations to review.'); loadingSpinner = false; }

      } else {
        detailStations = stationsResult.filter(s => s.svStatus === 'curated' && s.svPanoId && s.svPanoId !== 'legacy');
        if (detailStations.length) loadDetailStation(0);
        else { setLoading('No curated stations yet.'); loadingSpinner = false; }
      }
    } catch (err) {
      console.error('audit init failed:', err);
      showErrorScreen(err.message || 'An unexpected error occurred during initialization.');
    }
  }

</script>

<div id="audit-screen">
  {#if auditMode === null}
    <Modal title="Station Curation" subtitle="Choose a workflow" oncancel={() => currentScreen.set('start')}>
      <div class="audit-mode-options">
        <button type="button" class="audit-mode-option" onclick={() => startMode('screen')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <div>
            <div class="audit-mode-option-name">Screen</div>
            <div class="audit-mode-option-desc">Review unscreened station photos — approve or skip</div>
          </div>
        </button>
        <button type="button" class="audit-mode-option" onclick={() => startMode('details')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <div>
            <div class="audit-mode-option-name">Details</div>
            <div class="audit-mode-option-desc">Tag approved stations for themed daily challenges</div>
          </div>
        </button>
      </div>
    </Modal>
  {/if}

  <GameHeader mode="Station Curation" onTitleClick={handleTitleClick}>
    {#snippet center()}
      {#if auditMode === 'details'}
        <div class="round-info">
          Station <strong>{detailIdx + 1}</strong> of <strong>{detailStations.length}</strong>
          {#if auditStationSystem}
            <span class="header-divider">|</span>
            <span>{auditStationSystem}</span>
          {/if}
        </div>
        {#if auditStationName}
          <div class="audit-station-name">{auditStationName}</div>
        {/if}
      {:else}
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
          <div class="audit-station-name">{auditStationName}</div>
        {/if}
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
      <PhotoLoading visible={loadingVisible} msg={loadingMsg} spinner={loadingSpinner} error={loadingError}>
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
          {#if auditMode === 'screen' && (loadingMsg === 'Loading Street View…' || loadingMsg === 'Saved pano not found.')}
            <button type="button" class="loading-skip-btn" onclick={handleSkip}>Skip <kbd>S</kbd></button>
          {/if}
        {/if}
      </PhotoLoading>
    </div>

    <div class="map-panel">
      {#if auditMode === 'details'}
        <div class="details-panel">
          <div class="details-station-info">
            <div class="details-station-name">{auditStationName}</div>
            <div class="details-station-system">{auditStationSystem}</div>
          </div>
          <div class="details-tags-section">
            <div class="details-section-label">Tags</div>
            <div class="details-tag-grid">
              {#each AUDIT_TAGS as tag}
                <button
                  type="button"
                  class="tag-chip"
                  class:active={detailTags.has(tag.key)}
                  onclick={() => toggleTag(tag.key)}
                >{tag.label}</button>
              {/each}
              {#each [...detailTags].filter(k => !PRESET_KEYS.has(k)) as key}
                <button type="button" class="tag-chip tag-chip--custom active" onclick={() => toggleTag(key)}>
                  {key} ×
                </button>
              {/each}
            </div>
            <div class="custom-tag-row">
              <input
                type="text"
                class="custom-tag-input"
                placeholder="Add custom tag…"
                bind:value={customTagInput}
                onkeydown={e => e.key === 'Enter' && addCustomTag()}
              />
              <button type="button" class="custom-tag-add" onclick={addCustomTag}>Add</button>
            </div>
          </div>
          <div class="details-nav">
            <button type="button" class="details-nav-btn" onclick={() => saveDetailAndAdvance(-1)} disabled={detailIdx === 0 || detailSaving}>← Prev</button>
            <span class="details-nav-count">{detailIdx + 1} / {detailStations.length}</span>
            <button type="button" class="details-nav-btn details-nav-next" onclick={() => saveDetailAndAdvance(1)} disabled={detailIdx >= detailStations.length - 1 || detailSaving}>Next →</button>
          </div>
        </div>
      {:else}
        <div id="audit-map" bind:this={mapEl}></div>
        <div class="map-footer">
          <div class="map-hint">Does Street View clearly show the station entrance?</div>
          <button type="button" class="audit-no-btn" onclick={handleNo}>No <kbd>N</kbd></button>
          <button type="button" class="audit-env-btn" onclick={handleIndoors}>Indoors <kbd>I</kbd></button>
          <button type="button" class="audit-env-btn" onclick={handleOutdoors}>Outdoors <kbd>O</kbd></button>
        </div>
      {/if}
    </div>
  </div>
</div>
