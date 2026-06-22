const STORAGE_KEY = 'transitguessr_reports';

export function reportStation(stationId, stationName, reportType) {
  try {
    const existing = getReports();
    const already = existing.some(r => r.stationId === stationId && r.reportType === reportType);
    if (already) return false;
    existing.push({ stationId, stationName, reportType, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch { return false; }
}

export function getReports() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

export function getReportCountForStation(stationId) {
  return getReports().filter(r => r.stationId === stationId).length;
}
