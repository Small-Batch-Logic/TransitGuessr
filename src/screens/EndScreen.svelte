<script>
  import { currentScreen, selectedMode, toastMsg } from '../stores.js';
  import GameHeader from '../components/GameHeader.svelte';
  import { MODES, SITE_URL, STATION_NAME_REVEAL_SCORE } from '../config.js';
  import { escHtml } from '../utils.js';
  import { getDailyStreak } from '../daily.js';

  let { gameResult } = $props();

  // gameResult: { totalScore, roundResults, mode, isNewRecord, previousBest, dayNumber, dailyThemeLabel }

  function shouldRevealStationName(pts) {
    return pts >= STATION_NAME_REVEAL_SCORE;
  }

  function formatDistance(distKm) {
    if (distKm == null) return 'Timed out';
    return distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(2)} km`;
  }

  function gradeLabel(score, mode) {
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

  let totalScore = $derived(gameResult?.totalScore ?? 0);
  let roundResults = $derived(gameResult?.roundResults ?? []);
  let mode = $derived(gameResult?.mode ?? 'worldwide');
  let isNewRecord = $derived(gameResult?.isNewRecord ?? false);
  let previousBest = $derived(gameResult?.previousBest ?? 0);
  let dayNumber = $derived(gameResult?.dayNumber ?? 1);

  let highScoreLabel = $derived(
    isNewRecord
      ? previousBest === 0 ? 'First game!' : `Previous best: ${previousBest.toLocaleString()}`
      : `Best: ${Math.max(previousBest, totalScore).toLocaleString()} / 25,000`
  );

  function scoreColor(pts) {
    if (pts >= 4500) return 'score-excellent';
    if (pts >= 3000) return 'score-good';
    if (pts >= 1000) return 'score-ok';
    return 'score-miss';
  }

  let finalGrade = $derived(gradeLabel(totalScore, mode));

  let completedRounds = $derived(roundResults.filter(r => !r.timedOut && r.dist != null));

  let closest = $derived(
    completedRounds.reduce((best, round) => !best || round.dist < best.dist ? round : best, null)
  );
  let biggest = $derived(
    completedRounds.reduce((worst, round) => !worst || round.dist > worst.dist ? round : worst, null)
  );
  let averageDist = $derived(
    completedRounds.length
      ? completedRounds.reduce((sum, r) => sum + r.dist, 0) / completedRounds.length
      : null
  );

  let totalGuessed = $derived(
    parseInt(localStorage.getItem('transitguessr_total_guessed') || '0')
  );

  // Animated score
  let displayedScore = $state(0);

  $effect(() => {
    const target = totalScore;
    const duration = 900;
    const start = Date.now();
    displayedScore = 0;
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      displayedScore = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 150);
  });

  function showToast(msg) {
    toastMsg.set(msg);
  }

  function shareResult() {
    const themeLabel = gameResult?.dailyThemeLabel ? ` · ${gameResult.dailyThemeLabel}` : '';
    const modeLabel = mode === 'toronto' ? 'Toronto TTC'
      : mode === 'daily' ? `Daily Challenge #${dayNumber}${themeLabel}`
      : MODES[mode]?.name || 'Worldwide';
    const streak = mode === 'daily' ? getDailyStreak() : 0;

    const lines = roundResults.map((r, i) => {
      if (r.timedOut) return `${i + 1}: ⏰ Timed out`;
      const dist = r.dist < 1 ? Math.round(r.dist * 1000) + 'm' : r.dist.toFixed(1) + 'km';
      return `${i + 1}: 📍 ${dist} (${r.pts} pts)`;
    });

    const streakLine = streak > 0 ? `Streak: ${streak} day${streak === 1 ? '' : 's'} 🔥\n` : '';
    const text = `TransitGuessr [${modeLabel}]\n\n${lines.join('\n')}\n\n${streakLine}Total: ${totalScore.toLocaleString()} / 25,000\n${SITE_URL}`;

    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      navigator.share({ text }).catch(() => copyFallback(text));
    } else {
      copyFallback(text);
    }
  }

  function copyFallback(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Result copied to clipboard!'));
  }

  function goToMenu() {
    currentScreen.set('start');
  }

  function playAgain() {
    selectedMode.set(mode);
    currentScreen.set('game');
  }
</script>

<div id="end-screen" class="active">
  <GameHeader onTitleClick={goToMenu}>
    {#snippet right()}
      <button type="button" class="btn-quit" onclick={goToMenu}>
        <svg class="quit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Home</span>
      </button>
    {/snippet}
  </GameHeader>
  <div class="end-body">
  <div class="end-hero">
    <span class="new-record" class:show={isNewRecord}>New Record</span>
    <div class="final-score">{displayedScore.toLocaleString()}</div>
    <div class="final-label">out of 25,000</div>
    <div class="high-score-label">{highScoreLabel}</div>
    <div class="final-grade">{finalGrade}</div>
  </div>

  <div class="end-grid">
    <div class="end-overview">
      <div class="session-summary">
        <div class="summary-card">
          <div class="summary-label">Closest hit</div>
          <div class="summary-value">{closest ? formatDistance(closest.dist) : '—'}</div>
          <div class="summary-subtle">
            {#if closest}
              {shouldRevealStationName(closest.pts) ? closest.station.name : 'Station hidden'} · {closest.pts.toLocaleString()} pts
            {:else}
              No completed guesses
            {/if}
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Average miss</div>
          <div class="summary-value">{averageDist == null ? '—' : formatDistance(averageDist)}</div>
          <div class="summary-subtle">
            {completedRounds.length ? `${completedRounds.length} scored round${completedRounds.length === 1 ? '' : 's'}` : 'All rounds timed out'}
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Biggest miss</div>
          <div class="summary-value">{biggest ? formatDistance(biggest.dist) : '—'}</div>
          <div class="summary-subtle">
            {#if biggest}
              {shouldRevealStationName(biggest.pts) ? biggest.station.name : 'Station hidden'} · {biggest.pts.toLocaleString()} pts
            {:else}
              No completed guesses
            {/if}
          </div>
        </div>
      </div>
      <div class="lifetime-stats">Stations identified: <strong>{totalGuessed}</strong></div>
    </div>

    <div class="end-rounds-panel">
      <div class="end-panel-title">Round breakdown</div>
      <div class="rounds-list">
        {#each roundResults as r, i}
          <div class="round-row">
            <div class="round-num">R{i + 1}</div>
            <div class="round-row-left">
              <div class="round-row-name">
                {shouldRevealStationName(r.pts) ? r.station.name : 'Station hidden'}
              </div>
              <div class="round-row-system">{r.station.city} · {r.station.system}</div>
              <div class="round-row-dist">
                {#if r.timedOut}
                  Time ran out
                {:else if r.dist < 1}
                  {Math.round(r.dist * 1000)} m away
                {:else}
                  {r.dist.toFixed(2)} km away
                {/if}
              </div>
            </div>
            <div class="round-row-pts {scoreColor(r.pts)}">+{r.pts.toLocaleString()}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="end-actions">
    <button type="button" class="btn-share" onclick={shareResult}>Share Result</button>
    <button type="button" class="btn-share" onclick={goToMenu}>Change Mode</button>
    <button type="button" class="btn-primary" onclick={playAgain}>Play Again</button>
  </div>
  </div>
</div>
