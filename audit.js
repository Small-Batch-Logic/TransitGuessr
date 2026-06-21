// audit.js — Station Curation Queue
const DRAFTS_KEY = 'transitguessr_sv_audit_drafts_v1';

const state = {
  stations: [],
  drafts: {},
  selectedId: null,
  map: null,
  anchorMarker: null,
  svService: null,
  panorama: null,
  mapsReady: false,
};

// ── Station Utilities (inlined from src/station-utils.js) ──────────────────

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildStationId(s) {
  return [slugify(s.system), slugify(s.city), slugify(s.name)].join('__');
}

function normalizeStations(stations) {
  return (stations || []).map((s) => ({ ...s, id: s.id || buildStationId(s) }));
}

// ── Drafts ─────────────────────────────────────────────────────────────────

function loadDrafts() {
  try { state.drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}'); }
  catch { state.drafts = {}; }
}

function saveDrafts() {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(state.drafts));
}

function getStatus(station) {
  return state.drafts[station.id]?.svStatus || station.svStatus || 'pending';
}

// ── UI ─────────────────────────────────────────────────────────────────────

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('active');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('active'), 1800);
}

function updateHeader() {
  const station = getSelectedStation();
  const total = state.stations.length;
  const reviewed = state.stations.filter((s) => getStatus(s) !== 'pending').length;
  const pct = total ? (reviewed / total) * 100 : 0;

  document.getElementById('audit-progress').textContent =
    total ? `${reviewed} / ${total} reviewed` : 'Loading…';
  document.getElementById('audit-progress-bar').style.width = `${pct}%`;

  if (station) {
    document.getElementById('audit-station-name').textContent = station.name;
    document.getElementById('audit-station-system').textContent =
      `${station.city} · ${station.system}`;
  }
}

function setLoading(msg) {
  const el = document.getElementById('audit-loading');
  el.innerHTML = `<div class="spinner"></div>${msg}`;
  el.style.display = 'flex';
}

function hideLoading() {
  document.getElementById('audit-loading').style.display = 'none';
}

// ── Map ────────────────────────────────────────────────────────────────────

function initializeMap() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  state.map = L.map('audit-map', { zoomControl: true }).setView([43.65, -79.38], 15);
  L.tileLayer(tileUrl, {
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(state.map);
}

function setAnchorMarker(lat, lng) {
  if (!state.map) return;
  const pos = [lat, lng];
  if (!state.anchorMarker) {
    state.anchorMarker = L.circleMarker(pos, {
      radius: 8, color: '#f8fafc', weight: 2, fillColor: '#38bdf8', fillOpacity: 1
    }).addTo(state.map);
  } else {
    state.anchorMarker.setLatLng(pos);
  }
  state.map.setView(pos, 17);
}

// ── Google Maps / Street View ──────────────────────────────────────────────

function loadGoogleMaps() {
  const key = window.TRANSITGUESSR_CONFIG?.googleMapsApiKey || '';
  if (!key) return Promise.resolve(false);
  if (window.google?.maps?.StreetViewService) return Promise.resolve(true);
  return new Promise((resolve) => {
    window.__initAuditMap = () => {
      resolve(true);
      delete window.__initAuditMap;
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__initAuditMap&loading=async`;
    script.async = true;
    script.onerror = () => {
      resolve(false);
      delete window.__initAuditMap;
    };
    document.head.appendChild(script);
  });
}

function initializePanorama() {
  state.svService = new google.maps.StreetViewService();
  state.panorama = new google.maps.StreetViewPanorama(
    document.getElementById('audit-pano'),
    { addressControl: false, showRoadLabels: true, fullscreenControl: false, enableCloseButton: false }
  );
}

function loadPano(station) {
  if (!state.mapsReady || !station) return;

  const draft = state.drafts[station.id] || {};
  const lat = draft.svLat ?? station.svLat ?? station.lat;
  const lng = draft.svLng ?? station.svLng ?? station.lng;
  const heading = draft.svHeading ?? station.svHeading ?? station.heading ?? 0;
  const pitch = draft.svPitch ?? station.svPitch ?? 0;
  const radius = draft.svRadius ?? station.svRadius ?? 40;
  const panoId = draft.svPanoId || station.svPanoId;

  setAnchorMarker(lat, lng);
  setLoading('Loading Street View…');

  const onResult = (data, status) => {
    if (status !== google.maps.StreetViewStatus.OK) {
      setLoading('No Street View found near this station.');
      return;
    }
    state.panorama.setPano(data.location.pano);
    state.panorama.setPov({ heading, pitch });
    hideLoading();
  };

  if (panoId) {
    state.svService.getPanorama({ pano: panoId }, onResult);
  } else {
    state.svService.getPanorama({
      location: { lat, lng },
      radius,
      sources: [google.maps.StreetViewSource.OUTDOOR],
    }, onResult);
  }
}

// ── Station Navigation ─────────────────────────────────────────────────────

function getSelectedStation() {
  return state.stations.find((s) => s.id === state.selectedId) || null;
}

function nextPendingAfter(currentId) {
  const pending = state.stations.filter((s) => getStatus(s) === 'pending');
  if (!pending.length) return null;
  const idx = pending.findIndex((s) => s.id === currentId);
  return pending[(idx + 1) % pending.length];
}

function selectStation(station) {
  if (!station) return;
  state.selectedId = station.id;
  updateHeader();
  loadPano(station);
}

// ── Yes / No Handlers ──────────────────────────────────────────────────────

function capturePanoState() {
  const panoId = state.panorama?.getPano();
  const pos = state.panorama?.getPosition();
  const pov = state.panorama?.getPov();
  const captured = {};
  if (panoId) captured.svPanoId = panoId;
  if (pos) { captured.svLat = pos.lat(); captured.svLng = pos.lng(); }
  if (pov) { captured.svHeading = parseFloat(pov.heading.toFixed(1)); captured.svPitch = parseFloat(pov.pitch.toFixed(1)); }
  return captured;
}

function saveAndAdvance(extraFields) {
  const station = getSelectedStation();
  if (!station) return;

  const next = nextPendingAfter(station.id);

  state.drafts[station.id] = {
    ...(state.drafts[station.id] || {}),
    ...capturePanoState(),
    ...extraFields,
  };
  saveDrafts();
  updateHeader();

  // Only advance if there's a different pending station
  if (next && next.id !== station.id) {
    selectStation(next);
  } else {
    updateHeader(); // still refresh counter even if no more pending
  }
}

function handleYes() {
  saveAndAdvance({ svStatus: 'curated', svConfidence: 'curated' });
  showToast('✓ Curated');
}

function handleNo() {
  saveAndAdvance({ svStatus: 'skip' });
  showToast('Skipped');
}

// ── Stations Fetch ─────────────────────────────────────────────────────────

async function initializeStations() {
  try {
    const res = await fetch('./src/stations.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.stations = normalizeStations(data);
  } catch (err) {
    console.error('audit: failed to load stations.json:', err);
    state.stations = [];
  }
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  await initializeStations();
  loadDrafts();
  initializeMap();
  updateHeader();

  document.getElementById('quick-verify-btn').addEventListener('click', handleYes);
  document.getElementById('quick-skip-btn').addEventListener('click', handleNo);

  // Keyboard shortcuts: Y = yes, N = no
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'y' || e.key === 'Y') handleYes();
    if (e.key === 'n' || e.key === 'N') handleNo();
  });

  state.mapsReady = await loadGoogleMaps();
  if (!state.mapsReady) {
    setLoading('Add a Google Maps API key to config.local.js to enable Street View.');
    return;
  }

  initializePanorama();

  // Start from the first unreviewed station
  const first = nextPendingAfter(null);
  if (first) selectStation(first);
  else setLoading('All stations have been reviewed!');
}

document.addEventListener('DOMContentLoaded', init);
