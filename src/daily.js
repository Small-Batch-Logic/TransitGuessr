const LAUNCH_DATE_UTC = Date.UTC(2026, 2, 22);

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
