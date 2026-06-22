<script>
  import { currentScreen, selectedMode, selectedDifficulty } from '../stores.js';
  import { MODES } from '../config.js';
  import { getDayNumber, getDailyStreak, hasDailyBeenPlayed, getDailyPlayedScore, getDailyThemeType, THEME_NAMES } from '../daily.js';

  function getHighScoreForMode(mode) {
    try {
      const key = mode === 'daily'
        ? `transitguessr_hs_daily_${getDayNumber()}`
        : `transitguessr_hs_${mode}`;
      return parseInt(localStorage.getItem(key) || '0');
    } catch { return 0; }
  }

  // ── Reactive state ──
  let citySearch = $state('');

  let dailyStreak = $derived(getDailyStreak());

  let dailyStatusText = $derived.by(() => {
    if (hasDailyBeenPlayed()) {
      const todayScore = getDailyPlayedScore();
      return todayScore != null
        ? `Today's score: ${todayScore.toLocaleString()}/25,000`
        : `Today's run complete`;
    }
    return "Play today's challenge map!";
  });

  let worldwideStatusText = $derived.by(() => {
    const hs = getHighScoreForMode('worldwide');
    return hs > 0 ? `High Score: ${hs.toLocaleString()}` : 'Practice mode • Random stations';
  });

  let countdownText = $state('24H Event');

  // Countdown timer
  function updateCountdown() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const dict = {};
    for (let p of parts) dict[p.type] = p.value;
    const h = parseInt(dict.hour, 10) % 24;
    const m = parseInt(dict.minute, 10);
    const s = parseInt(dict.second, 10);
    const remH = 23 - h;
    const remM = 59 - m;
    const remS = 59 - s;
    if (remH === 0) {
      countdownText = `Ends in less than an hour`;
    } else {
      countdownText = `Ends in ${remH}h`;
    }
  }

  // Theme toggle
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('transitguessr_theme', next);
  }

  // City grid: all modes except worldwide and daily
  let cityModes = $derived(
    Object.entries(MODES).filter(([key]) => !['worldwide', 'daily'].includes(key))
  );

  let filteredCityModes = $derived(
    citySearch.trim() === ''
      ? cityModes
      : cityModes.filter(([, mode]) => mode.name.toLowerCase().includes(citySearch.toLowerCase().trim()))
  );

  let pendingMode = $state(null);

  function playMode(mode) {
    if (mode === 'daily') {
      selectedMode.set(mode);
      selectedDifficulty.set('normal');
      currentScreen.set('game');
    } else {
      pendingMode = mode;
    }
  }

  function launchWithDifficulty(difficulty) {
    selectedMode.set(pendingMode);
    selectedDifficulty.set(difficulty);
    pendingMode = null;
    currentScreen.set('game');
  }

  let countdownInterval;

  $effect(() => {
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
    return () => clearInterval(countdownInterval);
  });
</script>

<div id="start-screen">
  <div class="top-actions-row">
    <div class="navbar-logo">
      <svg class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2"></rect>
        <path d="M9 21h6"></path>
        <path d="M8 7h8"></path>
        <path d="M12 11h.01"></path>
        <circle cx="8" cy="16" r="1"></circle>
        <circle cx="16" cy="16" r="1"></circle>
      </svg>
      <span>transitguessr</span>
    </div>
    <div class="navbar-actions">
      {#if dailyStreak > 0}
        <div class="top-streak-indicator" title="Daily challenge streak">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="14" height="14"><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>
          {dailyStreak}
        </div>
      {/if}
      <button type="button" class="audit-mode-btn" title="Curation & Audit Mode" onclick={() => currentScreen.set('audit')}>
        <svg class="audit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </button>
      <button type="button" class="theme-toggle-btn" aria-label="Toggle theme" onclick={toggleTheme}>
        <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </div>
  </div>

  <div class="start-main-grid">
    <div class="modes-column">
      <!-- Daily Challenge Card -->
      <div class="play-card daily-play-card horizontal-mode">
        <div class="mode-info">
          <div class="play-card-header">
            <span class="play-card-badge"><span class="badge-dot"></span><span>{countdownText}</span></span>
            <div class="play-card-icon" style="color: var(--daily);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
          </div>
          <h2 class="play-card-title">Daily Challenge</h2>
          <p class="play-card-desc">The same 5 stations for everyone in the world. New challenge every day. Today: {THEME_NAMES[getDailyThemeType()]}.</p>
          <div class="play-card-status">{dailyStatusText}</div>
        </div>
        <div class="mode-action">
          <button type="button" class="btn-play-mode" onclick={() => playMode('daily')}>PLAY DAILY</button>
        </div>
      </div>

      <!-- Worldwide Card -->
      <div class="play-card worldwide-play-card horizontal-mode">
        <div class="mode-info">
          <div class="play-card-header">
            <span class="play-card-badge">Practice Map</span>
            <div class="play-card-icon" style="color: var(--world);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
          </div>
          <h2 class="play-card-title">Worldwide</h2>
          <p class="play-card-desc">Practice across all major transit systems globally with random stations.</p>
          <div class="play-card-status">{worldwideStatusText}</div>
        </div>
        <div class="mode-action">
          <button type="button" class="btn-play-mode" onclick={() => playMode('worldwide')}>PLAY PRACTICE</button>
        </div>
      </div>
    </div>

    <!-- Regional Cities Card -->
    <div class="cities-card">
      <h2 class="cities-title">Explore City Maps</h2>
      <p class="cities-desc">Select a specific city to start playing its map instantly.</p>

      <div class="search-wrapper">
        <input
          type="text"
          placeholder="Search cities..."
          autocomplete="off"
          aria-label="Search cities"
          bind:value={citySearch}
        />
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      <div class="city-grid">
        {#each filteredCityModes as [key, mode]}
          <button
            type="button"
            class="mode-card"
            data-mode={key}
            style="--system-color: {mode.color}; height: 50px; padding: 8px 12px;"
            onclick={() => playMode(key)}
          >
            <div class="card-icon" style="width: 28px; height: 28px;">{@html mode.icon}</div>
            <div class="card-name" style="font-size: 0.85rem;">{mode.name}</div>
          </button>
        {/each}
        {#if filteredCityModes.length === 0}
          <div style="grid-column: 1 / -1; text-align: center; padding: 20px 10px; font-size: 0.85rem; color: var(--text-dim);">
            No cities match your search
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

{#if pendingMode}
  <div class="difficulty-backdrop" onclick={() => pendingMode = null}>
    <div class="difficulty-modal" onclick={(e) => e.stopPropagation()}>
      <div class="difficulty-modal-header">
        <div class="difficulty-modal-icon" style="color: {MODES[pendingMode]?.color}">
          {@html MODES[pendingMode]?.icon ?? ''}
        </div>
        <div>
          <p class="difficulty-modal-title">{MODES[pendingMode]?.name}</p>
          <p class="difficulty-modal-subtitle">Choose difficulty</p>
        </div>
      </div>
      <div class="difficulty-options">
        <button
          type="button"
          class="difficulty-option"
          style="--mode-color: {MODES[pendingMode]?.color}"
          onclick={() => launchWithDifficulty('normal')}
        >
          <span class="difficulty-option-name">Normal</span>
          <span class="difficulty-option-desc">Forgiving scoring curve</span>
        </button>
        <button type="button" class="difficulty-option expert" onclick={() => launchWithDifficulty('expert')}>
          <span class="difficulty-option-name">Expert</span>
          <span class="difficulty-option-desc">Precision required</span>
        </button>
      </div>
      <button type="button" class="difficulty-cancel" onclick={() => pendingMode = null}>Cancel</button>
    </div>
  </div>
{/if}
