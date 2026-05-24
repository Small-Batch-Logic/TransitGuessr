export function slugifyStationPart(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildStationId(station) {
  return [
    slugifyStationPart(station.system),
    slugifyStationPart(station.city),
    slugifyStationPart(station.name)
  ].join('__');
}

export function normalizeStations(stations) {
  return (stations || []).map((station) => ({
    ...station,
    id: station.id || buildStationId(station)
  }));
}

export function getStreetViewAnchor(station) {
  return {
    lat: station.svLat ?? station.lat,
    lng: station.svLng ?? station.lng
  };
}

export function getStreetViewPov(station) {
  return {
    heading: station.svHeading ?? station.heading ?? 0,
    pitch: station.svPitch ?? 0
  };
}

export function hasCuratedStreetViewAnchor(station) {
  return Number.isFinite(station.svLat) && Number.isFinite(station.svLng);
}

export function isCuratedStreetViewStation(station) {
  if (station.svStatus === 'curated') return true;
  return Boolean(station.svPanoId);
}

export function filterPlayableStations(pool) {
  return (pool || []).filter((station) => station.svStatus !== 'skip');
}

export function selectStationPool(basePool, minimumCurated) {
  const playable = filterPlayableStations(basePool);
  const curated = playable.filter(isCuratedStreetViewStation);
  if (curated.length >= (minimumCurated ?? 5)) return curated;
  return playable;
}
