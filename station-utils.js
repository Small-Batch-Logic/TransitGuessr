(function () {
  function slugifyStationPart(value) {
    return String(value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function buildStationId(station) {
    return [
      slugifyStationPart(station.system),
      slugifyStationPart(station.city),
      slugifyStationPart(station.name)
    ].join('__');
  }

  function normalizeStations(stations) {
    return (stations || []).map((station) => ({
      ...station,
      id: station.id || buildStationId(station)
    }));
  }

  function getStreetViewAnchor(station) {
    return {
      lat: station.svLat ?? station.lat,
      lng: station.svLng ?? station.lng
    };
  }

  function getStreetViewPov(station) {
    return {
      heading: station.svHeading ?? station.heading ?? 0,
      pitch: station.svPitch ?? 0
    };
  }

  function hasCuratedStreetViewAnchor(station) {
    return Number.isFinite(station.svLat) && Number.isFinite(station.svLng);
  }

  function isCuratedStreetViewStation(station) {
    if (station.svStatus === 'curated') return true;
    return Boolean(station.svPanoId);
  }

  function filterPlayableStations(pool) {
    return (pool || []).filter((station) => station.svStatus !== 'skip');
  }

  function selectStationPool(basePool, minimumCurated) {
    const playable = filterPlayableStations(basePool);
    const curated = playable.filter(isCuratedStreetViewStation);
    if (curated.length >= (minimumCurated ?? 5)) return curated;
    return playable;
  }

  window.TransitGuessrStationUtils = {
    slugifyStationPart,
    buildStationId,
    normalizeStations,
    getStreetViewAnchor,
    getStreetViewPov,
    hasCuratedStreetViewAnchor,
    isCuratedStreetViewStation,
    filterPlayableStations,
    selectStationPool
  };
})();
