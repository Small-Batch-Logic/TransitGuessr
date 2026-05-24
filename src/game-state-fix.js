// ── Game State ──
const game = {
  selectedMode: 'toronto',
  difficulty: 'hard',
  currentRound: 0,
  totalScore: 0,
  roundResults: [],
  roundStations: [],
  isSubmitting: false,
  svApiWaitCount: 0,
  guessLatLng: null,
  map: null,
  guessMarker: null,
  resultLayer: null,
  timerInterval: null,
  timeLeft: 60,
  ROUND_TIME: 60,
  hotStreak: 0,

  reset(mode = this.selectedMode) {
    this.selectedMode = mode;
    this.currentRound = 0;
    this.totalScore = 0;
    this.roundResults = [];
    this.roundStations = [];
    this.isSubmitting = false;
    this.timeLeft = this.ROUND_TIME;
    this.hotStreak = 0;
    clearInterval(this.timerInterval);
  }
};
window.game = game; // Expose for tests
