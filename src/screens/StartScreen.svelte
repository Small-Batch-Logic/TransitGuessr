<script>
  import { currentScreen, selectedMode, selectedDifficulty } from '../stores.js';
  import GameHeader from '../components/GameHeader.svelte';
  import { MODES } from '../config.js';
  import { getDayNumber, getDailyStreak, hasDailyBeenPlayed, getDailyPlayedScore, getDailyThemeType, THEME_NAMES } from '../daily.js';
  import STATIONS from '../stations.json';

  const ROUNDS_PER_GAME = 5;
  const MIN_UNIQUE_GAMES = 10; // city must support this many non-repeating games before cycling
  const MIN_CURATED = ROUNDS_PER_GAME * MIN_UNIQUE_GAMES; // 50

  const curatedCountByCity = (() => {
    const counts = {};
    for (const s of STATIONS) {
      if (s.svStatus === 'curated' && s.svPanoId !== 'legacy') {
        counts[s.city] = (counts[s.city] || 0) + 1;
      }
    }
    return counts;
  })();

  function modeHasEnoughStations(modeConfig) {
    if (!modeConfig.filter) return false;
    const city = modeConfig.city;
    if (city) return (curatedCountByCity[city] || 0) >= MIN_CURATED;
    // For multi-city modes, sum across all matching cities
    return Object.entries(curatedCountByCity)
      .filter(([c]) => modeConfig.filter({ city: c, svStatus: 'curated', svPanoId: 'x' }))
      .reduce((sum, [, n]) => sum + n, 0) >= MIN_CURATED;
  }

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

  // City grid: modes with enough curated stations to be worth playing
  let cityModes = $derived(
    Object.entries(MODES).filter(([key, mode]) =>
      !['worldwide', 'daily'].includes(key) && modeHasEnoughStations(mode)
    )
  );

  let filteredCityModes = $derived(
    citySearch.trim() === ''
      ? cityModes
      : cityModes.filter(([, mode]) => mode.name.toLowerCase().includes(citySearch.toLowerCase().trim()))
  );

  let pendingMode = $state(null);
  let showCityBrowser = $state(false);
  let previewCities = $state([]);

  $effect(() => {
    if (previewCities.length === 0 && cityModes.length > 0) {
      previewCities = [...cityModes].sort(() => Math.random() - 0.5).slice(0, 4);
    }
  });

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

{#if pendingMode}
  <div id="start-screen" class="difficulty-screen">
    <button type="button" class="difficulty-back-btn" onclick={() => pendingMode = null}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      Back
    </button>
    <div class="difficulty-hero">
      <div class="difficulty-city-icon" style="color: {MODES[pendingMode]?.color}">
        {@html MODES[pendingMode]?.icon ?? ''}
      </div>
      <h1 class="difficulty-city-name">{MODES[pendingMode]?.name}</h1>
      <p class="difficulty-prompt">Pick your difficulty</p>
    </div>
    <div class="difficulty-choices">
      <button type="button" class="difficulty-choice" onclick={() => launchWithDifficulty('normal')}>
        <span class="difficulty-choice-name">Normal</span>
        <span class="difficulty-choice-desc">A few km off still scores well</span>
      </button>
      <button type="button" class="difficulty-choice difficulty-choice--expert" onclick={() => launchWithDifficulty('expert')}>
        <span class="difficulty-choice-name">Expert</span>
        <span class="difficulty-choice-desc">Points drop fast with distance</span>
      </button>
    </div>
  </div>
{:else if showCityBrowser}
  <div id="start-screen" class="city-browser-screen">
    <button type="button" class="difficulty-back-btn" onclick={() => showCityBrowser = false}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      Back
    </button>
    <div class="city-browser-hero">
      <h1 class="city-browser-title">Choose a City</h1>
      <p class="city-browser-desc">Select a transit system to play</p>
    </div>
    <div class="city-browser-search">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="text"
        placeholder="Search cities..."
        autocomplete="off"
        aria-label="Search cities"
        bind:value={citySearch}
      />
    </div>
    <div class="city-browser-grid">
      {#each filteredCityModes as [key, mode]}
        <button type="button" class="city-browser-item" style="--system-color: {mode.color}" onclick={() => playMode(key)}>
          <div class="city-browser-icon" style="color: {mode.color}">{@html mode.icon}</div>
          <span class="city-browser-name">{mode.name}</span>
        </button>
      {/each}
      {#if filteredCityModes.length === 0}
        <p class="city-browser-empty">No cities match your search</p>
      {/if}
    </div>
  </div>
{:else}

<div id="start-screen">
  <GameHeader>
    {#snippet right()}
      <button type="button" class="btn-header-text" onclick={() => currentScreen.set('audit')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        Audit
      </button>
      {#if dailyStreak > 0}
        <div class="top-streak-indicator" title="Daily challenge streak">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="14" height="14"><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>
          {dailyStreak}
        </div>
      {/if}
      <button type="button" class="theme-toggle-btn" aria-label="Toggle theme" onclick={toggleTheme}>
        <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    {/snippet}
  </GameHeader>

  <div class="start-content">
  <div class="start-main-grid">
    <div class="modes-column">
      <!-- Daily Challenge Card -->
      <div class="play-card daily-play-card horizontal-mode play-card--coming-soon">
        <div class="mode-info">
          <div class="play-card-header">
            <span class="play-card-badge">Coming Soon</span>
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

    <!-- City Maps Card -->
    <button type="button" class="cities-card cities-card--compact" onclick={() => showCityBrowser = true}>
      <div class="cities-card-preview">
        {#each previewCities as [, mode], i}
          <div class="cities-card-chip" style="color: {mode.color}; --i: {i}">{@html mode.icon}</div>
        {/each}
      </div>
      <div class="cities-card-footer">
        <div class="cities-card-body">
          <h2 class="cities-title">Explore City Maps</h2>
          <p class="cities-desc">{cityModes.length} transit {cityModes.length === 1 ? 'system' : 'systems'} available</p>
        </div>
        <svg class="cities-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    </button>
  </div>
  </div>
</div>

{/if}
