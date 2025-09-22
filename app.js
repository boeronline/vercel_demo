const STORAGE_KEY = 'launch-code-stats';
const DEFAULT_RANGE = { min: 1, max: 100 };

let secretNumber = null;
let attempts = 0;
let currentRange = { ...DEFAULT_RANGE };
let gameActive = false;
let stats = null;

function loadStats() {
  const fallback = { gamesPlayed: 0, bestScore: null, lastScore: null };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...fallback };
    }

    const parsed = JSON.parse(stored);
    const gamesPlayed = Number.isInteger(parsed?.gamesPlayed) && parsed.gamesPlayed > 0
      ? parsed.gamesPlayed
      : 0;
    const bestScore = Number.isInteger(parsed?.bestScore) && parsed.bestScore > 0
      ? parsed.bestScore
      : null;
    const lastScore = Number.isInteger(parsed?.lastScore) && parsed.lastScore > 0
      ? parsed.lastScore
      : null;

    return { gamesPlayed, bestScore, lastScore };
  } catch (error) {
    console.warn('Unable to load mission records from localStorage:', error);
    return { ...fallback };
  }
}

function saveStats(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to save mission records to localStorage:', error);
  }
}

function formatAttempts(value) {
  if (!value || value < 1) {
    return '—';
  }
  return value === 1 ? '1 attempt' : `${value} attempts`;
}

function updateStatsUI(elements) {
  const { bestScoreValue, gamesPlayedValue, lastScoreValue, bestPillValue } = elements;

  bestScoreValue.textContent = formatAttempts(stats.bestScore);
  gamesPlayedValue.textContent = stats.gamesPlayed.toString();
  lastScoreValue.textContent = formatAttempts(stats.lastScore);
  if (bestPillValue) {
    bestPillValue.textContent = formatAttempts(stats.bestScore);
  }
}

function updateAttemptCount(attemptCountEl) {
  attemptCountEl.textContent = attempts === 0 ? '0 attempts' : formatAttempts(attempts);
}

function updateRangeDisplay(rangeDisplayEl) {
  rangeDisplayEl.textContent = `Launch window: ${currentRange.min} – ${currentRange.max}.`;
}

function setStatusMessage(statusEl, message) {
  statusEl.textContent = message;
}

function resetHistory(historyList, historyEmpty) {
  historyList.innerHTML = '';
  historyEmpty.hidden = false;
}

function appendHistoryEntry(historyList, historyEmpty, guess, outcome) {
  historyEmpty.hidden = true;

  const listItem = document.createElement('li');
  listItem.className = 'history-item';

  const attemptBadge = document.createElement('span');
  attemptBadge.className = 'history-attempt';
  attemptBadge.textContent = `#${attempts}`;

  const details = document.createElement('div');
  details.className = 'history-details';

  const guessText = document.createElement('span');
  guessText.className = 'history-guess';
  guessText.textContent = `Guessed ${guess}`;

  const result = document.createElement('span');
  result.className = `history-result history-result--${outcome}`;
  if (outcome === 'correct') {
    result.textContent = 'Direct hit';
  } else if (outcome === 'low') {
    result.textContent = 'Too low';
  } else {
    result.textContent = 'Too high';
  }

  details.append(guessText, result);
  listItem.append(attemptBadge, details);
  historyList.append(listItem);
}

function recordWin(statsElements) {
  stats.gamesPlayed += 1;
  stats.lastScore = attempts;
  if (stats.bestScore === null || attempts < stats.bestScore) {
    stats.bestScore = attempts;
  }
  saveStats(stats);
  updateStatsUI(statsElements);
}

function startNewGame(options) {
  const {
    rangeDisplayEl,
    statusEl,
    historyList,
    historyEmpty,
    guessInput,
    guessButton,
    attemptCountEl,
    newGameButton,
    initialRun = false
  } = options;

  secretNumber = Math.floor(
    Math.random() * (DEFAULT_RANGE.max - DEFAULT_RANGE.min + 1)
  ) + DEFAULT_RANGE.min;
  attempts = 0;
  currentRange = { ...DEFAULT_RANGE };
  gameActive = true;

  resetHistory(historyList, historyEmpty);
  updateRangeDisplay(rangeDisplayEl);
  updateAttemptCount(attemptCountEl);
  setStatusMessage(
    statusEl,
    'A fresh launch code is live. Enter a number between 1 and 100 to begin your search.'
  );

  guessInput.value = '';
  guessInput.disabled = false;
  guessButton.disabled = false;
  guessInput.focus();

  newGameButton.textContent = initialRun ? 'New game' : 'Restart game';
}

function completeGame({
  statusEl,
  guessInput,
  guessButton,
  newGameButton,
  statsElements
}) {
  gameActive = false;
  guessInput.disabled = true;
  guessButton.disabled = true;
  newGameButton.textContent = 'Play again';
  newGameButton.focus();
  recordWin(statsElements);
  setStatusMessage(
    statusEl,
    `Direct hit! You cracked the launch code in ${formatAttempts(attempts)}.`
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const rangeDisplayEl = document.getElementById('range-display');
  const statusEl = document.getElementById('status-message');
  const historyList = document.getElementById('guess-history');
  const historyEmpty = document.getElementById('history-empty');
  const guessForm = document.getElementById('guess-form');
  const guessInput = document.getElementById('guess-input');
  const guessButton = document.getElementById('guess-button');
  const attemptCountEl = document.getElementById('attempt-count');
  const newGameButton = document.getElementById('new-game-btn');
  const resetStatsButton = document.getElementById('reset-stats-btn');
  const bestScoreValue = document.getElementById('best-score-value');
  const gamesPlayedValue = document.getElementById('games-played-value');
  const lastScoreValue = document.getElementById('last-score-value');
  const bestPillValue = document.getElementById('best-pill-value');

  if (
    !rangeDisplayEl ||
    !statusEl ||
    !historyList ||
    !historyEmpty ||
    !guessForm ||
    !guessInput ||
    !guessButton ||
    !attemptCountEl ||
    !newGameButton ||
    !resetStatsButton ||
    !bestScoreValue ||
    !gamesPlayedValue ||
    !lastScoreValue
  ) {
    return;
  }

  const statsElements = {
    bestScoreValue,
    gamesPlayedValue,
    lastScoreValue,
    bestPillValue
  };

  stats = loadStats();
  updateStatsUI(statsElements);

  newGameButton.addEventListener('click', () => {
    startNewGame({
      rangeDisplayEl,
      statusEl,
      historyList,
      historyEmpty,
      guessInput,
      guessButton,
      attemptCountEl,
      newGameButton
    });
  });

  resetStatsButton.addEventListener('click', () => {
    stats = { gamesPlayed: 0, bestScore: null, lastScore: null };
    saveStats(stats);
    updateStatsUI(statsElements);
    setStatusMessage(statusEl, 'Mission records cleared. Try for a new personal best!');
  });

  guessForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!gameActive) {
      setStatusMessage(statusEl, 'Round complete. Tap "Play again" to request a new code.');
      return;
    }

    const rawValue = guessInput.value.trim();
    if (rawValue.length === 0) {
      setStatusMessage(statusEl, 'Enter a number between 1 and 100 to log a guess.');
      guessInput.focus();
      return;
    }

    const guess = Number(rawValue);
    if (!Number.isFinite(guess) || !Number.isInteger(guess)) {
      setStatusMessage(statusEl, 'Guesses need to be whole numbers. Try again.');
      guessInput.focus();
      return;
    }

    if (guess < DEFAULT_RANGE.min || guess > DEFAULT_RANGE.max) {
      setStatusMessage(statusEl, 'Stay within the launch window: pick a number from 1 to 100.');
      guessInput.focus();
      return;
    }

    attempts += 1;
    updateAttemptCount(attemptCountEl);

    if (guess === secretNumber) {
      appendHistoryEntry(historyList, historyEmpty, guess, 'correct');
      completeGame({ statusEl, guessInput, guessButton, newGameButton, statsElements });
      return;
    }

    if (guess < secretNumber) {
      currentRange.min = Math.max(currentRange.min, guess + 1);
      appendHistoryEntry(historyList, historyEmpty, guess, 'low');
      setStatusMessage(
        statusEl,
        `${guess} is too low. Focus between ${currentRange.min} and ${currentRange.max}.`
      );
    } else {
      currentRange.max = Math.min(currentRange.max, guess - 1);
      appendHistoryEntry(historyList, historyEmpty, guess, 'high');
      setStatusMessage(
        statusEl,
        `${guess} is too high. Focus between ${currentRange.min} and ${currentRange.max}.`
      );
    }

    updateRangeDisplay(rangeDisplayEl);
    guessInput.value = '';
    guessInput.focus();
  });

  startNewGame({
    rangeDisplayEl,
    statusEl,
    historyList,
    historyEmpty,
    guessInput,
    guessButton,
    attemptCountEl,
    newGameButton,
    initialRun: true
  });
});
