const AUDIT_DRAFTS_KEY = 'transitguessr_sv_audit_drafts_v1';
const AUDIT_LAST_STATION_KEY = 'transitguessr_sv_audit_last_station';
const StationUtils = window.TransitGuessrStationUtils;

const AUDIT_FIELDS = [
  'svStatus',
  'svConfidence',
  'svPanoId',
  'svHeading',
  'svPitch',
  'svRadius',
  'svLat',
  'svLng',
  'svNotes'
];

const DEFAULT_STATUS = 'pending';
const DEFAULT_CONFIDENCE = 'curated';

const state = {
  stations: [],
  filteredStations: [],
  drafts: {},
  selectedId: null,
  map: null,
  anchorMarker: null,
  panoMarker: null,
  svService: null,
  panorama: null,
  panoramaMeta: null,
  mapsReady: false
};

function formatLatLng(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '-';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('active');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove('active'), 1800);
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function loadDrafts() {
  state.drafts = safeJsonParse(localStorage.getItem(AUDIT_DRAFTS_KEY) || '{}', {});
}

function saveDrafts() {
  localStorage.setItem(AUDIT_DRAFTS_KEY, JSON.stringify(state.drafts));
}

function getStationById(id) {
  return state.stations.find((station) => station.id === id) || null;
}

function getDraft(id) {
  return state.drafts[id] || {};
}

function getEffectiveStation(station) {
  return { ...station, ...getDraft(station.id) };
}

function getStatus(station) {
  return getEffectiveStation(station).svStatus || DEFAULT_STATUS;
}

function getConfidence(station) {
  return getEffectiveStation(station).svConfidence || DEFAULT_CONFIDENCE;
}

function getDraftPatches(includeCuratedOnly = false) {
  return state.stations
    .map((station) => {
      const patch = state.drafts[station.id];
      if (!patch) return null;
      const exported = buildPatchForExport(station, patch);
      if (includeCuratedOnly && exported.svStatus !== 'curated') return null;
      return exported;
    })
    .filter(Boolean);
}

function updateProgressSummary() {
  const counts = { curated: 0, pending: 0, 'needs-review': 0, skip: 0 };
  const perSystem = new Map();

  state.stations.forEach((station) => {
    const status = getStatus(station);
    counts[status] = (counts[status] || 0) + 1;

    const key = `${station.city} · ${station.system}`;
    const entry = perSystem.get(key) || { total: 0, curated: 0 };
    entry.total += 1;
    if (status === 'curated') entry.curated += 1;
    perSystem.set(key, entry);
  });

  document.getElementById('progress-curated').textContent = String(counts.curated);
  document.getElementById('progress-pending').textContent = String(counts.pending);
  document.getElementById('progress-review').textContent = String(counts['needs-review']);
  document.getElementById('progress-skip').textContent = String(counts.skip);

  const total = state.stations.length || 1;
  const curatedPct = Math.round((counts.curated / total) * 100);
  document.getElementById('progress-bar-fill').style.width = `${curatedPct}%`;
  document.getElementById('progress-caption').textContent = `${curatedPct}% curated (${counts.curated}/${state.stations.length})`;

  const topRows = [...perSystem.entries()]
    .sort((a, b) => (b[1].curated / b[1].total) - (a[1].curated / a[1].total))
    .slice(0, 5);

  document.getElementById('subprogress-list').innerHTML = topRows.map(([label, entry]) => `
    <div class="audit-subprogress-row">
      <div class="audit-subprogress-label">${escapeHtml(label)}</div>
      <div class="audit-subprogress-value">${entry.curated}/${entry.total}</div>
    </div>
  `).join('');
}

function renderStationList() {
  const listEl = document.getElementById('station-list');
  const searchTerm = document.getElementById('station-search').value.trim().toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;

  state.filteredStations = state.stations.filter((station) => {
    const haystack = `${station.name} ${station.city} ${station.system}`.toLowerCase();
    if (searchTerm && !haystack.includes(searchTerm)) return false;
    if (statusFilter !== 'all' && getStatus(station) !== statusFilter) return false;
    return true;
  });

  document.getElementById('station-count').textContent = `${state.filteredStations.length} stations shown`;
  updateProgressSummary();

  if (state.filteredStations.length === 0) {
    listEl.innerHTML = '<div class="station-meta">No stations match this filter.</div>';
    return;
  }

  listEl.innerHTML = state.filteredStations.map((station) => `
    <button type="button" class="station-item ${station.id === state.selectedId ? 'active' : ''}" data-station-id="${station.id}">
      <div class="station-item-top">
        <div class="station-name">${escapeHtml(station.name)}</div>
        <div class="status-pill ${getStatus(station)}">${getStatus(station)}</div>
      </div>
      <div class="station-meta">${escapeHtml(station.city)} · ${escapeHtml(station.system)} · ${escapeHtml(getConfidence(station))}</div>
    </button>
  `).join('');

  listEl.querySelectorAll('[data-station-id]').forEach((button) => {
    button.addEventListener('click', () => selectStation(button.dataset.stationId));
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readNumberField(id) {
  const raw = document.getElementById(id).value.trim();
  if (!raw) return undefined;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

function writeField(id, value) {
  const el = document.getElementById(id);
  el.value = value == null ? '' : String(value);
}

function applyStationToForm(station) {
  const effective = getEffectiveStation(station);
  writeField('field-svStatus', effective.svStatus || DEFAULT_STATUS);
  writeField('field-svConfidence', effective.svConfidence || DEFAULT_CONFIDENCE);
  writeField('field-svPanoId', effective.svPanoId || '');
  writeField('field-svHeading', effective.svHeading ?? effective.heading ?? '');
  writeField('field-svPitch', effective.svPitch ?? 0);
  writeField('field-svRadius', effective.svRadius ?? '');
  writeField('field-svLat', effective.svLat ?? station.lat);
  writeField('field-svLng', effective.svLng ?? station.lng);
  writeField('field-svNotes', effective.svNotes || '');
  updateExportPreview();
}

function getFormPatch() {
  const patch = {
    svStatus: document.getElementById('field-svStatus').value || DEFAULT_STATUS,
    svConfidence: document.getElementById('field-svConfidence').value || DEFAULT_CONFIDENCE,
    svPanoId: document.getElementById('field-svPanoId').value.trim() || undefined,
    svHeading: readNumberField('field-svHeading'),
    svPitch: readNumberField('field-svPitch'),
    svRadius: readNumberField('field-svRadius'),
    svLat: readNumberField('field-svLat'),
    svLng: readNumberField('field-svLng'),
    svNotes: document.getElementById('field-svNotes').value.trim() || undefined
  };

  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined && value !== ''));
}

function buildPatchForExport(station, patch) {
  const output = { id: station.id, name: station.name };
  AUDIT_FIELDS.forEach((field) => {
    if (patch[field] !== undefined) output[field] = patch[field];
  });
  return output;
}

function updateExportPreview() {
  const station = getSelectedStation();
  if (!station) return;
  const preview = buildPatchForExport(station, getFormPatch());
  document.getElementById('export-preview').textContent = JSON.stringify(preview, null, 2);
}

function saveCurrentDraft() {
  const station = getSelectedStation();
  if (!station) return;
  state.drafts[station.id] = getFormPatch();
  saveDrafts();
  renderStationList();
  updateHeader(station);
  updateExportPreview();
  showToast('Draft saved');
}

function resetCurrentDraft() {
  const station = getSelectedStation();
  if (!station) return;
  delete state.drafts[station.id];
  saveDrafts();
  applyStationToForm(station);
  renderStationList();
  updateHeader(station);
  setAnchorMarker(station.lat, station.lng, true);
  updateExportPreview();
  showToast('Draft reset');
}

function updateHeader(station) {
  const effective = getEffectiveStation(station);
  document.getElementById('station-name').textContent = station.name;
  document.getElementById('station-city-system').textContent = `${station.city} · ${station.system}`;
  document.getElementById('station-status-line').textContent =
    `Status: ${effective.svStatus || DEFAULT_STATUS} · Confidence: ${effective.svConfidence || DEFAULT_CONFIDENCE}`;
}

function getSelectedStation() {
  return getStationById(state.selectedId);
}

function setAnchorMarker(lat, lng, recenter = false) {
  if (!state.map) return;
  const latLng = [lat, lng];
  if (!state.anchorMarker) {
    state.anchorMarker = L.circleMarker(latLng, {
      radius: 8,
      color: '#f8fafc',
      weight: 2,
      fillColor: '#38bdf8',
      fillOpacity: 1
    }).addTo(state.map);
  } else {
    state.anchorMarker.setLatLng(latLng);
  }
  if (recenter) state.map.setView(latLng, 18);
}

function setPanoMarker(lat, lng) {
  if (!state.map || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const latLng = [lat, lng];
  if (!state.panoMarker) {
    state.panoMarker = L.circleMarker(latLng, {
      radius: 7,
      color: '#f8fafc',
      weight: 2,
      fillColor: '#34d399',
      fillOpacity: 1
    }).addTo(state.map);
  } else {
    state.panoMarker.setLatLng(latLng);
  }
}

function initializeMap() {
  state.map = L.map('audit-map', {
    zoomControl: true,
    attributionControl: true
  }).setView([43.65, -79.38], 15);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(state.map);

  state.map.on('click', (event) => {
    writeField('field-svLat', event.latlng.lat.toFixed(6));
    writeField('field-svLng', event.latlng.lng.toFixed(6));
    setAnchorMarker(event.latlng.lat, event.latlng.lng, false);
    updateExportPreview();
  });
}

function loadOptionalGoogleMaps() {
  const apiKey = window.TRANSITGUESSR_CONFIG?.googleMapsApiKey || '';
  if (!apiKey) return Promise.resolve(false);
  if (window.google?.maps?.StreetViewService) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function initializePanorama() {
  state.svService = new google.maps.StreetViewService();
  state.panorama = new google.maps.StreetViewPanorama(document.getElementById('audit-pano'), {
    addressControl: false,
    showRoadLabels: true,
    fullscreenControl: false,
    motionTrackingControl: false,
    enableCloseButton: false
  });

  state.panorama.addListener('pano_changed', refreshPanoReadout);
  state.panorama.addListener('position_changed', refreshPanoReadout);
  state.panorama.addListener('pov_changed', refreshPanoReadout);
}

function refreshPanoReadout() {
  const station = getSelectedStation();
  if (!station || !state.panorama) return;
  const position = state.panorama.getPosition();
  const pov = state.panorama.getPov();
  const panoId = state.panorama.getPano();
  const anchorLat = readNumberField('field-svLat');
  const anchorLng = readNumberField('field-svLng');

  document.getElementById('readout-pano-id').textContent = panoId || '-';
  document.getElementById('readout-position').textContent = position
    ? formatLatLng(position.lat(), position.lng())
    : '-';
  document.getElementById('readout-pov').textContent = pov
    ? `${pov.heading.toFixed(1)}° / ${pov.pitch.toFixed(1)}°`
    : '-';

  if (position && Number.isFinite(anchorLat) && Number.isFinite(anchorLng)) {
    const distance = haversineKm(anchorLat, anchorLng, position.lat(), position.lng()) * 1000;
    document.getElementById('readout-distance').textContent = `${Math.round(distance)} m`;
    setPanoMarker(position.lat(), position.lng());
  } else {
    document.getElementById('readout-distance').textContent = '-';
  }

  document.getElementById('readout-description').textContent =
    state.panoramaMeta?.location?.description || '-';
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function setLoading(message) {
  const loading = document.getElementById('audit-loading');
  loading.textContent = message;
  loading.style.display = 'flex';
}

function hideLoading() {
  document.getElementById('audit-loading').style.display = 'none';
}

function loadPanoForSelectedStation() {
  const station = getSelectedStation();
  if (!station || !state.mapsReady) return;

  const patch = getFormPatch();
  const anchor = {
    lat: patch.svLat ?? station.svLat ?? station.lat,
    lng: patch.svLng ?? station.svLng ?? station.lng
  };
  const panoId = patch.svPanoId || station.svPanoId;
  const heading = patch.svHeading ?? station.svHeading ?? station.heading ?? 0;
  const pitch = patch.svPitch ?? station.svPitch ?? 0;
  const radius = patch.svRadius ?? station.svRadius ?? 30;

  setAnchorMarker(anchor.lat, anchor.lng, true);
  setLoading('Loading Street View…');

  const handlePanoData = (data, status) => {
    if (status !== google.maps.StreetViewStatus.OK) {
      setLoading('No Street View panorama found for this station.');
      state.panoramaMeta = null;
      return;
    }

    state.panoramaMeta = data;
    state.panorama.setPano(data.location.pano);
    state.panorama.setPov({ heading, pitch });
    if (data.location?.latLng) {
      state.panorama.setPosition(data.location.latLng);
      setPanoMarker(data.location.latLng.lat(), data.location.latLng.lng());
    }
    hideLoading();
    refreshPanoReadout();
  };

  if (panoId) {
    state.svService.getPanorama({ pano: panoId }, handlePanoData);
    return;
  }

  state.svService.getPanorama({
    location: anchor,
    radius,
    sources: [google.maps.StreetViewSource.OUTDOOR]
  }, handlePanoData);
}

function captureCurrentView() {
  if (!state.panorama) return;
  const position = state.panorama.getPosition();
  const pov = state.panorama.getPov();
  const panoId = state.panorama.getPano();

  if (!position || !pov || !panoId) {
    showToast('No panorama loaded');
    return;
  }

  writeField('field-svPanoId', panoId);
  writeField('field-svLat', position.lat().toFixed(6));
  writeField('field-svLng', position.lng().toFixed(6));
  writeField('field-svHeading', pov.heading.toFixed(1));
  writeField('field-svPitch', pov.pitch.toFixed(1));

  if (!document.getElementById('field-svRadius').value) {
    writeField('field-svRadius', 20);
  }
  if (document.getElementById('field-svStatus').value === DEFAULT_STATUS) {
    writeField('field-svStatus', 'curated');
  }
  setAnchorMarker(position.lat(), position.lng(), false);
  updateExportPreview();
  showToast('Captured current pano');
}

function selectStation(id) {
  if (!id) return;
  const station = getStationById(id);
  if (!station) return;
  state.selectedId = id;
  localStorage.setItem(AUDIT_LAST_STATION_KEY, id);
  renderStationList();
  updateHeader(station);
  applyStationToForm(station);
  const effective = getEffectiveStation(station);
  setAnchorMarker(effective.svLat ?? station.lat, effective.svLng ?? station.lng, true);
  if (state.mapsReady) loadPanoForSelectedStation();
}

function copyText(text, successMessage) {
  navigator.clipboard.writeText(text).then(() => showToast(successMessage));
}

function copyCurrentStationPatch() {
  const station = getSelectedStation();
  if (!station) return;
  copyText(JSON.stringify(buildPatchForExport(station, getFormPatch()), null, 2), 'Station patch copied');
}

function copyAllPatches() {
  copyText(JSON.stringify(getDraftPatches(false), null, 2), 'All patches copied');
}

function copyCuratedPatches() {
  copyText(JSON.stringify(getDraftPatches(true), null, 2), 'Curated patches copied');
}

function downloadDraftPatches() {
  const blob = new Blob([`${JSON.stringify(getDraftPatches(false), null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'transitguessr-audit-patches.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast('patches.json downloaded');
}

function goToNextPendingStation() {
  const pendingStations = state.filteredStations.filter((station) => getStatus(station) === 'pending');
  if (pendingStations.length === 0) {
    showToast('No pending stations in current filter');
    return;
  }

  const currentIndex = pendingStations.findIndex((station) => station.id === state.selectedId);
  const nextStation = pendingStations[(currentIndex + 1 + pendingStations.length) % pendingStations.length];
  if (nextStation) selectStation(nextStation.id);
}

function bindEvents() {
  document.getElementById('station-search').addEventListener('input', renderStationList);
  document.getElementById('status-filter').addEventListener('change', renderStationList);
  document.getElementById('save-draft-btn').addEventListener('click', saveCurrentDraft);
  document.getElementById('reset-draft-btn').addEventListener('click', resetCurrentDraft);
  document.getElementById('load-pano-btn').addEventListener('click', loadPanoForSelectedStation);
  document.getElementById('capture-pov-btn').addEventListener('click', captureCurrentView);
  document.getElementById('copy-station-btn').addEventListener('click', copyCurrentStationPatch);
  document.getElementById('copy-all-btn').addEventListener('click', copyAllPatches);
  document.getElementById('copy-curated-btn').addEventListener('click', copyCuratedPatches);
  document.getElementById('download-patches-btn').addEventListener('click', downloadDraftPatches);
  document.getElementById('next-pending-btn').addEventListener('click', goToNextPendingStation);
  document.getElementById('use-map-anchor-btn').addEventListener('click', () => {
    if (!state.anchorMarker) return;
    const latLng = state.anchorMarker.getLatLng();
    writeField('field-svLat', latLng.lat.toFixed(6));
    writeField('field-svLng', latLng.lng.toFixed(6));
    updateExportPreview();
  });

  ['field-svStatus', 'field-svConfidence', 'field-svPanoId', 'field-svHeading', 'field-svPitch', 'field-svRadius', 'field-svLat', 'field-svLng', 'field-svNotes']
    .forEach((id) => document.getElementById(id).addEventListener('input', updateExportPreview));
}

function initializeStations() {
  state.stations = StationUtils.normalizeStations(window.STATIONS || []);
}

async function initializeAudit() {
  initializeStations();
  loadDrafts();
  initializeMap();
  bindEvents();
  renderStationList();

  state.mapsReady = await loadOptionalGoogleMaps();
  if (!state.mapsReady) {
    setLoading('Google Maps API failed to load. Check config.local.js.');
    return;
  }

  initializePanorama();

  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('station');
  const lastId = localStorage.getItem(AUDIT_LAST_STATION_KEY);
  const initialId = requestedId || lastId || state.stations[0]?.id;
  if (initialId) selectStation(initialId);
}

document.addEventListener('DOMContentLoaded', initializeAudit);
