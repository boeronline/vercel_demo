
const STORAGE_KEY = 'synapse-studio-progress-v1';
const LEGACY_STORAGE_KEYS = ['brain-training-stats', 'launch-code-stats'];
const MAX_SESSIONS_STORED = 60;
const DATE_OPTIONS = { month: 'short', day: 'numeric' };
const TIME_OPTIONS = { hour: 'numeric', minute: '2-digit' };

const exercises = [
  createDualNBackExercise(),
  createStroopFocusExercise(),
  createTaskSwitchCircuit()
];

const exerciseLookup = new Map(exercises.map((exercise) => [exercise.id, exercise]));

const ui = {
  statusPillValue: null,
  exerciseTitle: null,
  exerciseTagline: null,
  exerciseHighlights: null,
  exerciseBody: null,
  exerciseTabs: null,
  bestScoreValue: null,
  lastScoreValue: null,
  sessionsCountValue: null,
  progressChart: null,
  recentList: null,
  recentEmpty: null,
  streakValue: null,
  todayValue: null,
  statsIntro: null,
  resetExerciseBtn: null,
  resetAllBtn: null
};

let progress = null;
let activeExercise = null;
let activeInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  captureUIReferences();
  progress = loadProgress();
  ensureExerciseState(progress);
  const migrated = migrateLegacyIfNeeded(progress);
  if (migrated) {
    persistProgress();
  }
  buildExerciseTabs();
  attachResetHandlers();
  const initialId = determineInitialExerciseId();
  selectExercise(initialId);
  updateDailySummary();
});

function captureUIReferences() {
  ui.statusPillValue = document.getElementById('status-pill-value');
  ui.exerciseTitle = document.getElementById('exercise-title');
  ui.exerciseTagline = document.getElementById('exercise-tagline');
  ui.exerciseHighlights = document.getElementById('exercise-highlights');
  ui.exerciseBody = document.getElementById('exercise-body');
  ui.exerciseTabs = document.getElementById('exercise-tabs');
  ui.bestScoreValue = document.getElementById('best-score-value');
  ui.lastScoreValue = document.getElementById('last-score-value');
  ui.sessionsCountValue = document.getElementById('sessions-count-value');
  ui.progressChart = document.getElementById('progress-chart');
  ui.recentList = document.getElementById('recent-results-list');
  ui.recentEmpty = document.getElementById('recent-empty');
  ui.streakValue = document.getElementById('streak-value');
  ui.todayValue = document.getElementById('today-value');
  ui.statsIntro = document.getElementById('stats-intro');
  ui.resetExerciseBtn = document.getElementById('reset-exercise-btn');
  ui.resetAllBtn = document.getElementById('reset-all-btn');
}

function determineInitialExerciseId() {
  if (progress?.lastExerciseId && exerciseLookup.has(progress.lastExerciseId)) {
    return progress.lastExerciseId;
  }
  return exercises[0]?.id;
}

function buildExerciseTabs() {
  if (!ui.exerciseTabs) {
    return;
  }

  ui.exerciseTabs.innerHTML = '';
  exercises.forEach((exercise, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'exercise-tab';
    tab.dataset.exerciseId = exercise.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', 'exercise-body');
    tab.textContent = `${exercise.icon} ${exercise.shortName || exercise.name}`;
    tab.addEventListener('click', () => {
      selectExercise(exercise.id);
      tab.focus();
    });
    tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
    ui.exerciseTabs.append(tab);
  });
}

function selectExercise(exerciseId) {
  const exercise = exerciseLookup.get(exerciseId);
  if (!exercise) {
    return;
  }

  if (activeInstance?.destroy) {
    activeInstance.destroy();
  }

  activeExercise = exercise;
  progress.lastExerciseId = exerciseId;
  persistProgress();

  updateExerciseMeta(exercise);
  updateTabSelection(exerciseId);

  if (ui.exerciseBody) {
    ui.exerciseBody.innerHTML = '';
    activeInstance = exercise.mount({
      container: ui.exerciseBody,
      recordSession: (session) => recordSession(exerciseId, session),
      getState: () => getExerciseState(exerciseId),
      getDifficulty: () =>
        getExerciseDifficulty(exerciseId, exercise.initialDifficulty),
      updateDifficulty: (value) => updateExerciseDifficulty(exerciseId, value)
    });
  }

  refreshStatsFor(exerciseId);
  updateStatusPill(exerciseId);
}

function updateExerciseMeta(exercise) {
  if (ui.exerciseTitle) {
    ui.exerciseTitle.textContent = `${exercise.icon} ${exercise.name}`;
  }

  if (ui.exerciseTagline) {
    ui.exerciseTagline.textContent = exercise.tagline;
  }

  if (ui.exerciseHighlights) {
    ui.exerciseHighlights.innerHTML = '';
    exercise.highlights.forEach((highlight) => {
      const item = document.createElement('li');
      item.textContent = highlight;
      ui.exerciseHighlights.append(item);
    });
  }

  if (ui.statsIntro) {
    ui.statsIntro.textContent = exercise.measurement.intro;
  }
}

function updateTabSelection(activeId) {
  if (!ui.exerciseTabs) {
    return;
  }
  const tabs = Array.from(ui.exerciseTabs.querySelectorAll('.exercise-tab'));
  tabs.forEach((tab) => {
    const isActive = tab.dataset.exerciseId === activeId;
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
    tab.classList.toggle('exercise-tab--active', isActive);
  });
}

function recordSession(exerciseId, session) {
  if (!session || typeof session.score !== 'number' || Number.isNaN(session.score)) {
    return;
  }

  const exerciseState = progress.exercises[exerciseId] || { sessions: [] };
  const entry = {
    timestamp: new Date().toISOString(),
    score: session.score,
    label: session.label,
    summary: session.summary || session.label,
    extra: session.extra || null
  };

  exerciseState.sessions = (exerciseState.sessions || []).concat(entry).slice(-MAX_SESSIONS_STORED);
  progress.exercises[exerciseId] = exerciseState;
  markCalendarCompletion(exerciseId, entry.timestamp);
  persistProgress();
  refreshStatsFor(exerciseId);
  updateStatusPill(exerciseId);
  updateDailySummary();
}

function refreshStatsFor(exerciseId) {
  const exercise = exerciseLookup.get(exerciseId);
  if (!exercise) {
    return;
  }

  const stats = getExerciseStats(exerciseId, exercise.measurement.better);
  if (ui.bestScoreValue) {
    ui.bestScoreValue.textContent = stats.best ? stats.best.label : '—';
  }
  if (ui.lastScoreValue) {
    ui.lastScoreValue.textContent = stats.latest ? stats.latest.label : '—';
  }
  if (ui.sessionsCountValue) {
    ui.sessionsCountValue.textContent = stats.total.toString();
  }

  renderChart(stats.sessions, exercise);
  renderRecentSessions(stats.sessions);
}

function updateStatusPill(exerciseId) {
  if (!ui.statusPillValue) {
    return;
  }
  const exercise = exerciseLookup.get(exerciseId);
  if (!exercise) {
    ui.statusPillValue.textContent = '—';
    return;
  }
  const stats = getExerciseStats(exerciseId, exercise.measurement.better);
  ui.statusPillValue.textContent = stats.best ? stats.best.label : '—';
}

function renderChart(sessions, exercise) {
  if (!ui.progressChart) {
    return;
  }

  ui.progressChart.innerHTML = '';
  const numericSessions = sessions.filter((session) => typeof session.score === 'number');
  if (numericSessions.length < 2) {
    const placeholder = document.createElement('p');
    placeholder.className = 'chart__empty';
    placeholder.textContent = 'Complete a few sessions to unlock your trend line.';
    ui.progressChart.append(placeholder);
    return;
  }

  const series = numericSessions.slice(-10);
  const scores = series.map((entry) => entry.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore || 1;
  const width = 320;
  const height = 120;
  const padding = 12;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${exercise.measurement.chartLabel} for the last ${series.length} sessions.`);

  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('x', '0');
  background.setAttribute('y', '0');
  background.setAttribute('width', String(width));
  background.setAttribute('height', String(height));
  background.setAttribute('fill', '#ffffff');
  background.setAttribute('opacity', '0.6');
  svg.append(background);

  const better = exercise.measurement.better;
  const points = series.map((entry, index) => {
    const x = padding + (index / (series.length - 1 || 1)) * (width - padding * 2);
    let normalized = 0.5;
    if (better === 'lower') {
      normalized = (maxScore - entry.score) / range;
    } else {
      normalized = (entry.score - minScore) / range;
    }
    const y = padding + (1 - normalized) * (height - padding * 2);
    return `${x},${y}`;
  });

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', '#2cb1bc');
  polyline.setAttribute('stroke-width', '3');
  polyline.setAttribute('stroke-linecap', 'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  polyline.setAttribute('points', points.join(' '));
  svg.append(polyline);

  series.forEach((entry, index) => {
    const [x, y] = points[index].split(',').map(Number);
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(y));
    circle.setAttribute('r', '4.5');
    circle.setAttribute('fill', '#ef8354');
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '1.5');
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${formatDateLabel(entry.timestamp)}: ${entry.label}`;
    circle.append(title);
    svg.append(circle);
  });

  ui.progressChart.append(svg);
}

function renderRecentSessions(sessions) {
  if (!ui.recentList || !ui.recentEmpty) {
    return;
  }
  ui.recentList.innerHTML = '';
  const recent = sessions.slice(-5).reverse();
  if (recent.length === 0) {
    ui.recentEmpty.hidden = false;
    return;
  }

  ui.recentEmpty.hidden = true;
  recent.forEach((session) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    const timestamp = document.createElement('span');
    timestamp.className = 'history-attempt';
    timestamp.textContent = formatTimestamp(session.timestamp);

    const details = document.createElement('div');
    details.className = 'history-details';

    const summary = document.createElement('span');
    summary.className = 'history-guess';
    summary.textContent = session.summary || session.label;

    const label = document.createElement('span');
    label.className = 'history-result';
    label.textContent = session.label;

    details.append(summary, label);
    item.append(timestamp, details);
    ui.recentList.append(item);
  });
}

function updateDailySummary() {
  if (!ui.streakValue || !ui.todayValue) {
    return;
  }

  const streak = computeStreak(progress.calendar);
  ui.streakValue.textContent = `${streak} ${pluralize(streak, 'day')}`;

  const todayKey = getDateKey(new Date());
  const todaySessions = progress.calendar?.[todayKey]?.totalSessions || 0;
  ui.todayValue.textContent = `${todaySessions} ${pluralize(todaySessions, 'session')} logged`;
}

function attachResetHandlers() {
  if (ui.resetExerciseBtn) {
    ui.resetExerciseBtn.addEventListener('click', () => {
      if (!activeExercise) {
        return;
      }
      const confirmed = window.confirm(
        `Clear all saved sessions for ${activeExercise.name}? This cannot be undone.`
      );
      if (!confirmed) {
        return;
      }
      progress.exercises[activeExercise.id] = { sessions: [] };
      removeExerciseFromCalendar(activeExercise.id);
      persistProgress();
      refreshStatsFor(activeExercise.id);
      updateStatusPill(activeExercise.id);
      updateDailySummary();
    });
  }

  if (ui.resetAllBtn) {
    ui.resetAllBtn.addEventListener('click', () => {
      const confirmed = window.confirm('Reset all saved training data?');
      if (!confirmed) {
        return;
      }
      progress = createEmptyProgress();
      ensureExerciseState(progress);
      if (activeExercise) {
        progress.lastExerciseId = activeExercise.id;
      }
      persistProgress();
      if (activeExercise) {
        refreshStatsFor(activeExercise.id);
        updateStatusPill(activeExercise.id);
      }
      updateDailySummary();
    });
  }
}

function loadProgress() {
  const fallback = createEmptyProgress();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return fallback;
    }
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    console.warn('Unable to read progress from localStorage:', error);
  }
  return fallback;
}

function createEmptyProgress() {
  return {
    version: 1,
    exercises: {},
    calendar: {},
    lastExerciseId: null
  };
}

function ensureExerciseState(data) {
  data.exercises = data.exercises || {};
  data.calendar = data.calendar || {};
  exercises.forEach((exercise) => {
    const existing = data.exercises[exercise.id] || { sessions: [] };
    existing.sessions = Array.isArray(existing.sessions) ? existing.sessions : [];
    if (
      typeof existing.difficulty === 'undefined' &&
      typeof exercise.initialDifficulty !== 'undefined'
    ) {
      existing.difficulty = exercise.initialDifficulty;
    }
    data.exercises[exercise.id] = existing;
  });
}

function getExerciseState(exerciseId) {
  if (!progress || !progress.exercises) {
    return { sessions: [] };
  }
  const state = progress.exercises[exerciseId];
  if (!state) {
    const fresh = { sessions: [] };
    progress.exercises[exerciseId] = fresh;
    return fresh;
  }
  state.sessions = Array.isArray(state.sessions) ? state.sessions : [];
  return state;
}

function getExerciseDifficulty(exerciseId, fallback) {
  const state = getExerciseState(exerciseId);
  if (typeof state.difficulty === 'undefined' || state.difficulty === null) {
    state.difficulty = fallback;
  }
  return state.difficulty;
}

function updateExerciseDifficulty(exerciseId, update) {
  const state = getExerciseState(exerciseId);
  const current = state.difficulty;
  const nextValue = typeof update === 'function' ? update(current) : update;
  if (typeof nextValue !== 'undefined' && nextValue !== current) {
    state.difficulty = nextValue;
    persistProgress();
  }
  return state.difficulty;
}

function migrateLegacyIfNeeded(data) {
  const existing = data.exercises?.['number-line'];
  if (existing && existing.sessions && existing.sessions.length > 0) {
    return false;
  }

  const legacy = readLegacyStats();
  if (!legacy) {
    return false;
  }

  const sessions = [];
  const now = new Date();
  if (legacy.bestScore) {
    sessions.push({
      timestamp: new Date(now.getTime() - 86400000).toISOString(),
      score: legacy.bestScore,
      label: formatTries(legacy.bestScore),
      summary: `Imported best run: ${formatTries(legacy.bestScore)}`
    });
  }
  if (legacy.lastScore) {
    sessions.push({
      timestamp: now.toISOString(),
      score: legacy.lastScore,
      label: formatTries(legacy.lastScore),
      summary: `Imported recent run: ${formatTries(legacy.lastScore)}`
    });
  }
  data.exercises['number-line'] = { sessions };
  return true;
}

function readLegacyStats() {
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        continue;
      }
      const parsed = JSON.parse(stored);
      if (parsed && (parsed.bestScore || parsed.lastScore)) {
        localStorage.removeItem(key);
        return parsed;
      }
    } catch (error) {
      console.warn('Unable to migrate legacy stats for key', key, error);
    }
  }
  return null;
}

function getExerciseStats(exerciseId, better) {
  const sessions = progress.exercises?.[exerciseId]?.sessions || [];
  const total = sessions.length;
  let best = null;
  for (const session of sessions) {
    if (typeof session.score !== 'number') {
      continue;
    }
    if (!best) {
      best = session;
      continue;
    }
    if (better === 'lower' && session.score < best.score) {
      best = session;
    }
    if (better === 'higher' && session.score > best.score) {
      best = session;
    }
  }
  const latest = total > 0 ? sessions[total - 1] : null;
  return { sessions, total, best, latest };
}

function persistProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn('Unable to persist training progress:', error);
  }
}

function markCalendarCompletion(exerciseId, isoTimestamp) {
  const dateKey = isoTimestamp.split('T')[0];
  const calendar = progress.calendar || {};
  const current = calendar[dateKey] || { totalSessions: 0, exercises: {} };
  current.totalSessions += 1;
  current.exercises[exerciseId] = (current.exercises[exerciseId] || 0) + 1;
  calendar[dateKey] = current;
  progress.calendar = calendar;
}

function removeExerciseFromCalendar(exerciseId) {
  const calendar = progress.calendar;
  if (!calendar) {
    return;
  }
  Object.keys(calendar).forEach((dateKey) => {
    const day = calendar[dateKey];
    if (!day || !day.exercises || !day.exercises[exerciseId]) {
      return;
    }
    const count = day.exercises[exerciseId];
    delete day.exercises[exerciseId];
    day.totalSessions = Math.max(0, (day.totalSessions || 0) - count);
    if (day.totalSessions === 0) {
      delete calendar[dateKey];
    }
  });
}

function computeStreak(calendar) {
  if (!calendar) {
    return 0;
  }
  let streak = 0;
  const today = new Date();
  while (true) {
    const key = getDateKey(today, streak);
    const day = calendar[key];
    if (!day || !day.totalSessions) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function getDateKey(baseDate, offsetDays = 0) {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);
  if (offsetDays) {
    date.setDate(date.getDate() - offsetDays);
  }
  return date.toISOString().split('T')[0];
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString(undefined, DATE_OPTIONS)} · ${date.toLocaleTimeString(
    undefined,
    TIME_OPTIONS
  )}`;
}

function formatDateLabel(timestamp) {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString(undefined, DATE_OPTIONS)} ${date.toLocaleTimeString(
    undefined,
    TIME_OPTIONS
  )}`;
}

function pluralize(value, singular) {
  return value === 1 ? singular : `${singular}s`;
}

function formatTries(value) {
  if (!value || value < 1) {
    return '—';
  }
  return value === 1 ? '1 try' : `${value} tries`;
}

function formatSeconds(value) {
  const rounded = Math.max(0, Math.round(value * 10) / 10);
  return `${rounded.toFixed(1)} sec`;
}

function createDualNBackExercise() {
  const GRID_SIZE = 3;
  const TOTAL_TRIALS = 18;
  const TRIAL_DURATION = 2600;
  const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];
  const INITIAL_DIFFICULTY = 1;
  const MAX_DIFFICULTY = 4;

  return {
    id: 'dual-n-back',
    name: 'Dual N-Back Focus',
    shortName: 'Dual n-back',
    icon: '🧩',
    tagline: 'Track locations and letters simultaneously to strengthen working memory.',
    highlights: [
      'Mark when the square or letter matches the one from N steps earlier.',
      'Accurate rounds nudge the level up to keep challenging your span.',
      'Pairs are logged so you can review decisions after each session.'
    ],
    measurement: {
      better: 'higher',
      chartLabel: 'Accuracy (%)',
      intro:
        'Maintain high accuracy while juggling spatial and audio streams. Higher values signal stronger dual-task control.'
    },
    initialDifficulty: INITIAL_DIFFICULTY,
    mount({ container, recordSession, getDifficulty, updateDifficulty }) {
      if (!container) {
        return {};
      }

      container.innerHTML = `
        <div class="nback-module">
          <div class="module-bar">
            <button class="button primary" id="nback-start" type="button">Start training</button>
            <span class="difficulty-pill" id="nback-difficulty">Level 1-back</span>
          </div>
          <div class="nback-grid" id="nback-grid" role="grid" aria-label="Spatial grid">
            ${Array.from({ length: GRID_SIZE * GRID_SIZE })
              .map((_, index) => `<span class="nback-cell" role="presentation" data-index="${index}"></span>`)
              .join('')}
          </div>
          <p class="nback-letter" id="nback-letter" aria-live="polite">Letter: —</p>
          <div class="nback-controls" role="group" aria-label="Dual n-back responses">
            <button class="button subtle" id="nback-position" type="button" aria-pressed="false" disabled>Position match</button>
            <button class="button subtle" id="nback-sound" type="button" aria-pressed="false" disabled>Letter match</button>
          </div>
          <p class="game-status" id="nback-status">Press start to monitor both streams.</p>
          <div class="history">
            <div class="history-header">
              <h3>Trial breakdown</h3>
              <span class="attempt-count" id="nback-progress">0 / ${TOTAL_TRIALS}</span>
            </div>
            <p class="history-empty" id="nback-empty">Your responses will appear after each trial.</p>
            <ol class="history-list" id="nback-history" aria-live="polite"></ol>
          </div>
        </div>
      `;

      const elements = {
        start: container.querySelector('#nback-start'),
        difficulty: container.querySelector('#nback-difficulty'),
        status: container.querySelector('#nback-status'),
        grid: container.querySelector('#nback-grid'),
        letter: container.querySelector('#nback-letter'),
        positionBtn: container.querySelector('#nback-position'),
        soundBtn: container.querySelector('#nback-sound'),
        progress: container.querySelector('#nback-progress'),
        historyEmpty: container.querySelector('#nback-empty'),
        historyList: container.querySelector('#nback-history')
      };

      const cells = Array.from(elements.grid?.querySelectorAll('.nback-cell') || []);

      let level = INITIAL_DIFFICULTY;
      if (typeof getDifficulty === 'function') {
        const stored = Number(getDifficulty());
        if (Number.isFinite(stored) && stored >= 1) {
          level = stored;
        }
      }

      let roundActive = false;
      let awaitingInput = false;
      let trialIndex = -1;
      let sequence = [];
      let response = { position: false, sound: false };
      let trialTimer = null;
      let correctDecisions = 0;
      let totalDecisions = 0;

      function setStatus(message) {
        if (elements.status) {
          elements.status.textContent = message;
        }
      }

      function setDifficultyDisplay(currentLevel) {
        if (elements.difficulty) {
          elements.difficulty.textContent = `Level ${currentLevel}-back`;
        }
      }

      function updateProgress() {
        if (elements.progress) {
          const current = Math.max(0, Math.min(TOTAL_TRIALS, trialIndex + 1));
          elements.progress.textContent = `${current} / ${TOTAL_TRIALS}`;
        }
      }

      function clearHistory() {
        if (elements.historyList) {
          elements.historyList.innerHTML = '';
        }
        if (elements.historyEmpty) {
          elements.historyEmpty.hidden = false;
        }
      }

      function clearHighlight() {
        cells.forEach((cell) => cell.classList.remove('nback-cell--active'));
      }

      function highlightCell(index) {
        clearHighlight();
        const cell = cells[index];
        if (cell) {
          cell.classList.add('nback-cell--active');
        }
      }

      function setLetterDisplay(letter) {
        if (elements.letter) {
          elements.letter.textContent = `Letter: ${letter}`;
        }
      }

      function resetButtons() {
        response = { position: false, sound: false };
        setMatchButtonState(elements.positionBtn, false);
        setMatchButtonState(elements.soundBtn, false);
      }

      function setButtonsEnabled(enabled) {
        if (elements.positionBtn) {
          elements.positionBtn.disabled = !enabled;
        }
        if (elements.soundBtn) {
          elements.soundBtn.disabled = !enabled;
        }
      }

      function setMatchButtonState(button, active) {
        if (!button) {
          return;
        }
        button.classList.toggle('is-active', Boolean(active));
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      }

      function appendHistory(trialNumber, trial, expected, decision, correctness) {
        if (!elements.historyList || !elements.historyEmpty) {
          return;
        }
        elements.historyEmpty.hidden = true;
        const item = document.createElement('li');
        item.className = 'history-item';

        const attempt = document.createElement('span');
        attempt.className = 'history-attempt';
        attempt.textContent = `Trial ${trialNumber}`;

        const details = document.createElement('div');
        details.className = 'history-details';

        const summary = document.createElement('span');
        summary.className = 'history-guess';
        summary.textContent = `Cell ${trial.position + 1} · ${trial.letter}`;

        const result = document.createElement('span');
        result.className = 'history-result';
        result.textContent = `Position ${expected.positionMatch ? 'match' : 'new'} (${decision.position ? 'mark' : 'pass'}), letter ${expected.soundMatch ? 'match' : 'new'} (${decision.sound ? 'mark' : 'pass'})`;
        if (correctness.position && correctness.sound) {
          result.classList.add('history-result--correct');
        } else {
          result.classList.add('history-result--low');
        }

        details.append(summary, result);
        item.append(attempt, details);
        elements.historyList.append(item);
      }

      function generateTrial() {
        const position = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
        const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        return { position, letter };
      }

      function evaluateCurrentTrial() {
        const trial = sequence[trialIndex];
        const referenceIndex = trialIndex - level;
        let positionMatch = false;
        let soundMatch = false;
        if (referenceIndex >= 0) {
          const reference = sequence[referenceIndex];
          positionMatch = reference.position === trial.position;
          soundMatch = reference.letter === trial.letter;
        }

        const positionCorrect = positionMatch === response.position;
        const soundCorrect = soundMatch === response.sound;

        totalDecisions += 2;
        if (positionCorrect) {
          correctDecisions += 1;
        }
        if (soundCorrect) {
          correctDecisions += 1;
        }

        appendHistory(
          trialIndex + 1,
          trial,
          { positionMatch, soundMatch },
          { ...response },
          { position: positionCorrect, sound: soundCorrect }
        );
      }

      function stopTimer() {
        if (trialTimer) {
          window.clearTimeout(trialTimer);
          trialTimer = null;
        }
      }

      function scheduleNextTrial() {
        stopTimer();
        trialTimer = window.setTimeout(() => {
          if (!roundActive) {
            return;
          }
          awaitingInput = false;
          setButtonsEnabled(false);
          evaluateCurrentTrial();
          clearHighlight();
          if (trialIndex + 1 >= TOTAL_TRIALS) {
            completeRound();
          } else {
            startNextTrial();
          }
        }, TRIAL_DURATION);
      }

      function startNextTrial() {
        trialIndex += 1;
        sequence[trialIndex] = generateTrial();
        resetButtons();
        highlightCell(sequence[trialIndex].position);
        setLetterDisplay(sequence[trialIndex].letter);
        updateProgress();
        awaitingInput = true;
        setButtonsEnabled(true);
        scheduleNextTrial();
      }

      function completeRound() {
        stopTimer();
        roundActive = false;
        awaitingInput = false;
        setButtonsEnabled(false);
        clearHighlight();
        setLetterDisplay('—');
        updateProgress();

        const playedLevel = level;
        const accuracy = totalDecisions === 0
          ? 0
          : Math.round((correctDecisions / totalDecisions) * 100);

        const summary = `Round complete: ${accuracy}% accuracy on ${playedLevel}-back.`;

        recordSession({
          score: accuracy,
          label: `${accuracy}% accuracy`,
          summary: `Tracked ${TOTAL_TRIALS} dual cues at ${accuracy}% accuracy (level ${playedLevel})`,
          extra: {
            accuracy,
            totalDecisions,
            correctDecisions,
            level: playedLevel
          }
        });

        let difficultyNote = '';
        let nextLevel = playedLevel;
        if (accuracy >= 80 && playedLevel < MAX_DIFFICULTY) {
          nextLevel = playedLevel + 1;
          difficultyNote = ` Advancing to ${nextLevel}-back next round.`;
        } else if (accuracy < 55 && playedLevel > INITIAL_DIFFICULTY) {
          nextLevel = playedLevel - 1;
          difficultyNote = ` Stepping back to ${nextLevel}-back to reinforce consistency.`;
        }

        if (nextLevel !== playedLevel && typeof updateDifficulty === 'function') {
          const persisted = updateDifficulty(nextLevel);
          if (typeof persisted === 'number') {
            nextLevel = persisted;
          }
        }

        level = nextLevel;
        setDifficultyDisplay(level);
        setStatus(summary + difficultyNote);

        if (elements.start) {
          elements.start.disabled = false;
          elements.start.textContent = 'Start next round';
          elements.start.focus();
        }
      }

      function resetState() {
        stopTimer();
        roundActive = false;
        awaitingInput = false;
        trialIndex = -1;
        sequence = [];
        correctDecisions = 0;
        totalDecisions = 0;
        resetButtons();
        setButtonsEnabled(false);
        clearHighlight();
        setLetterDisplay('—');
        updateProgress();
      }

      function startRound() {
        if (roundActive) {
          return;
        }
        const levelFromStore = typeof getDifficulty === 'function' ? Number(getDifficulty()) : level;
        if (Number.isFinite(levelFromStore) && levelFromStore >= 1) {
          level = Math.min(MAX_DIFFICULTY, Math.max(INITIAL_DIFFICULTY, Math.round(levelFromStore)));
        }

        resetState();
        clearHistory();
        setDifficultyDisplay(level);
        setStatus(`Mark matches from ${level} step${level === 1 ? '' : 's'} back.`);
        if (elements.start) {
          elements.start.disabled = true;
          elements.start.textContent = 'Training…';
        }

        roundActive = true;
        startNextTrial();
      }

      function toggleResponse(type) {
        if (!awaitingInput) {
          return;
        }
        if (type === 'position') {
          response.position = !response.position;
          setMatchButtonState(elements.positionBtn, response.position);
        } else if (type === 'sound') {
          response.sound = !response.sound;
          setMatchButtonState(elements.soundBtn, response.sound);
        }
      }

      const handleStart = () => startRound();
      const handlePosition = () => toggleResponse('position');
      const handleSound = () => toggleResponse('sound');

      elements.start?.addEventListener('click', handleStart);
      elements.positionBtn?.addEventListener('click', handlePosition);
      elements.soundBtn?.addEventListener('click', handleSound);

      setDifficultyDisplay(level);
      resetButtons();
      setButtonsEnabled(false);
      setLetterDisplay('—');
      updateProgress();

      return {
        destroy() {
          stopTimer();
          elements.start?.removeEventListener('click', handleStart);
          elements.positionBtn?.removeEventListener('click', handlePosition);
          elements.soundBtn?.removeEventListener('click', handleSound);
        }
      };
    }
  };
}

function createStroopFocusExercise() {
  const COLOR_POOL = [
    { name: 'Red', value: '#d94141' },
    { name: 'Blue', value: '#2c7be5' },
    { name: 'Green', value: '#28a745' },
    { name: 'Yellow', value: '#f6c343' },
    { name: 'Purple', value: '#9b51e0' },
    { name: 'Orange', value: '#f2994a' }
  ];
  const LEVELS = [
    { colours: 4, prompts: 10, limit: 4500 },
    { colours: 5, prompts: 12, limit: 3800 },
    { colours: 6, prompts: 14, limit: 3200 },
    { colours: 6, prompts: 16, limit: 2600 }
  ];
  const INITIAL_LEVEL = 1;

  return {
    id: 'stroop-focus',
    name: 'Stroop Focus Lab',
    shortName: 'Stroop focus',
    icon: '🎨',
    tagline: 'Select the ink colour while ignoring the word to sharpen cognitive control.',
    highlights: [
      'Tap the button that matches the ink colour—not the word you read.',
      'As accuracy stays high the palette grows and the rhythm speeds up.',
      'Review each cue to spot where interference tripped you up.'
    ],
    measurement: {
      better: 'higher',
      chartLabel: 'Accuracy (%)',
      intro: 'High accuracy with swift responses indicates improved interference control.'
    },
    initialDifficulty: INITIAL_LEVEL,
    mount({ container, recordSession, getDifficulty, updateDifficulty }) {
      if (!container) {
        return {};
      }

      container.innerHTML = `
        <div class="stroop-module">
          <div class="module-bar">
            <button class="button primary" id="stroop-start" type="button">Begin sequence</button>
            <span class="difficulty-pill" id="stroop-difficulty">Level 1</span>
          </div>
          <p class="game-status" id="stroop-status">Focus on the ink colour, not the word itself.</p>
          <div class="stroop-display" aria-live="polite">
            <span class="stroop-word" id="stroop-word">—</span>
          </div>
          <p class="stroop-progress" id="stroop-progress">0 / 0</p>
          <div class="stroop-options" id="stroop-options" role="group" aria-label="Select the ink colour"></div>
          <div class="history">
            <div class="history-header">
              <h3>Colour log</h3>
              <span class="attempt-count" id="stroop-count">0 prompts</span>
            </div>
            <p class="history-empty" id="stroop-empty">Your choices will appear after each cue.</p>
            <ol class="history-list" id="stroop-history" aria-live="polite"></ol>
          </div>
        </div>
      `;

      const elements = {
        start: container.querySelector('#stroop-start'),
        difficulty: container.querySelector('#stroop-difficulty'),
        status: container.querySelector('#stroop-status'),
        word: container.querySelector('#stroop-word'),
        progress: container.querySelector('#stroop-progress'),
        options: container.querySelector('#stroop-options'),
        count: container.querySelector('#stroop-count'),
        historyEmpty: container.querySelector('#stroop-empty'),
        historyList: container.querySelector('#stroop-history')
      };

      let level = INITIAL_LEVEL;
      if (typeof getDifficulty === 'function') {
        const stored = Number(getDifficulty());
        if (Number.isFinite(stored) && stored >= 1) {
          level = stored;
        }
      }

      let prompts = [];
      let promptIndex = 0;
      let roundActive = false;
      let awaitingResponse = false;
      let promptTimer = null;
      let responseTimes = [];
      let correctCount = 0;
      let timeoutCount = 0;
      let currentSettings = LEVELS[0];
      let promptStartedAt = 0;

      function clampLevel(raw) {
        return Math.max(1, Math.min(LEVELS.length, Math.round(raw)));
      }

      function resolveSettings(currentLevel) {
        return LEVELS[Math.min(LEVELS.length - 1, Math.max(0, currentLevel - 1))];
      }

      function setDifficultyDisplay(currentLevel) {
        if (elements.difficulty) {
          elements.difficulty.textContent = `Level ${currentLevel}`;
        }
      }

      function setStatus(message) {
        if (elements.status) {
          elements.status.textContent = message;
        }
      }

      function setProgress(value, total) {
        if (elements.progress) {
          elements.progress.textContent = `${value} / ${total}`;
        }
        if (elements.count) {
          elements.count.textContent = `${total} ${total === 1 ? 'prompt' : 'prompts'}`;
        }
      }

      function clearHistory() {
        if (elements.historyList) {
          elements.historyList.innerHTML = '';
        }
        if (elements.historyEmpty) {
          elements.historyEmpty.hidden = false;
        }
      }

      function renderColourButtons(activeColours) {
        if (!elements.options) {
          return;
        }
        elements.options.innerHTML = '';
        activeColours.forEach((colour) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'button subtle stroop-option';
          button.textContent = colour.name;
          button.dataset.colourName = colour.name;
          button.disabled = true;
          button.addEventListener('click', () => handleResponse(colour));
          elements.options.append(button);
        });
      }

      function buildPrompts(colourSet, total) {
        const list = [];
        for (let i = 0; i < total; i += 1) {
          const word = colourSet[Math.floor(Math.random() * colourSet.length)];
          let ink = colourSet[Math.floor(Math.random() * colourSet.length)];
          if (ink.name === word.name) {
            ink = colourSet[(colourSet.indexOf(ink) + 1) % colourSet.length];
          }
          list.push({ word, ink });
        }
        return list;
      }

      function stopTimer() {
        if (promptTimer) {
          window.clearTimeout(promptTimer);
          promptTimer = null;
        }
      }

      function updateWordDisplay(text, colour) {
        if (elements.word) {
          elements.word.textContent = text;
          elements.word.style.color = colour || 'inherit';
        }
      }

      function setOptionsEnabled(enabled) {
        elements.options?.querySelectorAll('button').forEach((button) => {
          button.disabled = !enabled;
        });
      }

      function appendHistoryEntry(index, prompt, selection, correct, elapsedMs) {
        if (!elements.historyList || !elements.historyEmpty) {
          return;
        }
        elements.historyEmpty.hidden = true;
        const item = document.createElement('li');
        item.className = 'history-item';

        const attempt = document.createElement('span');
        attempt.className = 'history-attempt';
        attempt.textContent = `Cue ${index}`;

        const details = document.createElement('div');
        details.className = 'history-details';

        const summary = document.createElement('span');
        summary.className = 'history-guess';
        summary.textContent = `${prompt.word.name} in ${prompt.ink.name}`;

        const result = document.createElement('span');
        result.className = 'history-result';
        if (selection) {
          result.textContent = `Answered ${selection} • ${formatSeconds(elapsedMs / 1000)}`;
          result.classList.add(correct ? 'history-result--correct' : 'history-result--low');
        } else {
          result.textContent = 'No response logged';
          result.classList.add('history-result--low');
        }

        details.append(summary, result);
        item.append(attempt, details);
        elements.historyList.append(item);
      }

      function advancePrompt() {
        if (promptIndex >= prompts.length) {
          completeRound();
          return;
        }
        const prompt = prompts[promptIndex];
        updateWordDisplay(prompt.word.name.toUpperCase(), prompt.ink.value);
        setProgress(promptIndex + 1, prompts.length);
        awaitingResponse = true;
        setOptionsEnabled(true);
        promptStartedAt = performance.now ? performance.now() : Date.now();
        stopTimer();
        promptTimer = window.setTimeout(() => handleTimeout(), currentSettings.limit);
      }

      function handleResponse(colour) {
        if (!roundActive || !awaitingResponse) {
          return;
        }
        awaitingResponse = false;
        setOptionsEnabled(false);
        stopTimer();

        const prompt = prompts[promptIndex];
        const now = performance.now ? performance.now() : Date.now();
        const elapsed = Math.max(0, now - promptStartedAt);
        responseTimes.push(elapsed);

        const isCorrect = colour.name === prompt.ink.name;
        if (isCorrect) {
          correctCount += 1;
        }

        appendHistoryEntry(promptIndex + 1, prompt, colour.name, isCorrect, elapsed);

        promptIndex += 1;
        if (promptIndex >= prompts.length) {
          completeRound();
        } else {
          advancePrompt();
        }
      }

      function handleTimeout() {
        if (!roundActive || !awaitingResponse) {
          return;
        }
        awaitingResponse = false;
        setOptionsEnabled(false);
        stopTimer();
        timeoutCount += 1;
        const prompt = prompts[promptIndex];
        appendHistoryEntry(promptIndex + 1, prompt, null, false, currentSettings.limit);
        promptIndex += 1;
        advancePrompt();
      }

      function completeRound() {
        stopTimer();
        roundActive = false;
        awaitingResponse = false;
        setOptionsEnabled(false);
        updateWordDisplay('—');

        const playedLevel = level;
        const total = prompts.length;
        const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);
        const totalMs = responseTimes.reduce((sum, value) => sum + value, 0) + timeoutCount * currentSettings.limit;
        const averageMs = total === 0 ? 0 : totalMs / total;
        const averageLabel = formatSeconds(averageMs / 1000);

        recordSession({
          score: accuracy,
          label: `${accuracy}% accuracy • ${averageLabel}`,
          summary: `Identified ${total} colour cues with ${accuracy}% accuracy (${averageLabel} average response, level ${playedLevel})`,
          extra: {
            accuracy,
            averageMs,
            level: playedLevel,
            total,
            correct: correctCount,
            timeouts: timeoutCount
          }
        });

        let nextLevel = playedLevel;
        let difficultyNote = '';
        if (accuracy >= 85 && averageMs <= currentSettings.limit * 0.65 && playedLevel < LEVELS.length) {
          nextLevel = playedLevel + 1;
          difficultyNote = ` Palette expanding to level ${nextLevel} next time.`;
        } else if (accuracy < 70 && playedLevel > INITIAL_LEVEL) {
          nextLevel = playedLevel - 1;
          difficultyNote = ` Stepping back to level ${nextLevel} to reinforce accuracy.`;
        }

        if (nextLevel !== playedLevel && typeof updateDifficulty === 'function') {
          const persisted = updateDifficulty(nextLevel);
          if (typeof persisted === 'number') {
            nextLevel = persisted;
          }
        }

        level = clampLevel(nextLevel);
        currentSettings = resolveSettings(level);
        setDifficultyDisplay(level);
        setStatus(`Sequence complete at ${accuracy}% accuracy (${averageLabel}).${difficultyNote}`);

        if (elements.start) {
          elements.start.disabled = false;
          elements.start.textContent = 'Run it again';
          elements.start.focus();
        }
      }

      function startRound() {
        if (roundActive) {
          return;
        }
        const storedLevel = typeof getDifficulty === 'function' ? Number(getDifficulty()) : level;
        if (Number.isFinite(storedLevel)) {
          level = clampLevel(storedLevel);
        }

        currentSettings = resolveSettings(level);
        prompts = buildPrompts(COLOR_POOL.slice(0, currentSettings.colours), currentSettings.prompts);
        promptIndex = 0;
        responseTimes = [];
        correctCount = 0;
        timeoutCount = 0;
        clearHistory();
        setDifficultyDisplay(level);
        updateWordDisplay('—');
        setProgress(0, prompts.length);
        setStatus('Tap the ink colour as quickly and accurately as you can.');
        renderColourButtons(COLOR_POOL.slice(0, currentSettings.colours));
        setOptionsEnabled(false);

        if (elements.start) {
          elements.start.disabled = true;
          elements.start.textContent = 'In progress…';
        }

        roundActive = true;
        advancePrompt();
      }

      const handleStart = () => startRound();

      elements.start?.addEventListener('click', handleStart);
      setDifficultyDisplay(level);
      setProgress(0, 0);
      updateWordDisplay('—');

      return {
        destroy() {
          stopTimer();
          elements.start?.removeEventListener('click', handleStart);
        }
      };
    }
  };
}

function createTaskSwitchCircuit() {
  const LETTERS = ['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G', 'H', 'L', 'M', 'N', 'R', 'S', 'T'];
  const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const LEVELS = [
    { prompts: 12, limit: 4200, switchProbability: 0.45 },
    { prompts: 16, limit: 3500, switchProbability: 0.55 },
    { prompts: 20, limit: 3000, switchProbability: 0.65 },
    { prompts: 24, limit: 2600, switchProbability: 0.75 }
  ];
  const INITIAL_LEVEL = 1;

  const TASKS = {
    letter: {
      label: 'Letter rule',
      prompt: 'Is the letter a vowel?',
      left: 'Vowel',
      right: 'Consonant',
      evaluate(value) {
        const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
        return vowels.has(value);
      }
    },
    number: {
      label: 'Number rule',
      prompt: 'Is the number odd?',
      left: 'Odd',
      right: 'Even',
      evaluate(value) {
        return value % 2 === 1;
      }
    }
  };

  return {
    id: 'task-switch',
    name: 'Task Switch Circuit',
    shortName: 'Task switch',
    icon: '🔀',
    tagline: 'Shift between vowel and parity checks to build cognitive flexibility.',
    highlights: [
      'Rules shift throughout the circuit—watch the banner before you answer.',
      'High accuracy and quick reactions unlock longer, faster circuits.',
      'Session history shows where rule switches caused slips.'
    ],
    measurement: {
      better: 'higher',
      chartLabel: 'Accuracy (%)',
      intro: 'Stay accurate while the active rule changes. Higher percentages reflect stronger task switching.'
    },
    initialDifficulty: INITIAL_LEVEL,
    mount({ container, recordSession, getDifficulty, updateDifficulty }) {
      if (!container) {
        return {};
      }

      container.innerHTML = `
        <div class="task-switch-module">
          <div class="module-bar">
            <button class="button primary" id="switch-start" type="button">Start circuit</button>
            <span class="difficulty-pill" id="switch-difficulty">Level 1</span>
          </div>
          <p class="game-status" id="switch-status">Watch the active rule, then respond.</p>
          <div class="task-switch-display" aria-live="polite">
            <span class="task-switch-rule" id="switch-rule">Rule ready</span>
            <span class="task-switch-prompt" id="switch-prompt">—</span>
          </div>
          <p class="task-switch-progress" id="switch-progress">0 / 0</p>
          <div class="task-switch-controls" role="group" aria-label="Task switch responses">
            <button class="button subtle" id="switch-left" type="button" disabled>Vowel</button>
            <button class="button subtle" id="switch-right" type="button" disabled>Consonant</button>
          </div>
          <div class="history">
            <div class="history-header">
              <h3>Switch log</h3>
              <span class="attempt-count" id="switch-count">0 prompts</span>
            </div>
            <p class="history-empty" id="switch-empty">Prompts and responses will appear here.</p>
            <ol class="history-list" id="switch-history" aria-live="polite"></ol>
          </div>
        </div>
      `;

      const elements = {
        start: container.querySelector('#switch-start'),
        difficulty: container.querySelector('#switch-difficulty'),
        status: container.querySelector('#switch-status'),
        rule: container.querySelector('#switch-rule'),
        prompt: container.querySelector('#switch-prompt'),
        progress: container.querySelector('#switch-progress'),
        left: container.querySelector('#switch-left'),
        right: container.querySelector('#switch-right'),
        count: container.querySelector('#switch-count'),
        historyEmpty: container.querySelector('#switch-empty'),
        historyList: container.querySelector('#switch-history')
      };

      let level = INITIAL_LEVEL;
      if (typeof getDifficulty === 'function') {
        const stored = Number(getDifficulty());
        if (Number.isFinite(stored) && stored >= 1) {
          level = stored;
        }
      }

      let prompts = [];
      let promptIndex = 0;
      let roundActive = false;
      let awaitingResponse = false;
      let currentSettings = LEVELS[0];
      let promptTimer = null;
      let promptStartedAt = 0;
      let responseTimes = [];
      let correctCount = 0;
      let timeoutCount = 0;

      function clampLevel(raw) {
        return Math.max(1, Math.min(LEVELS.length, Math.round(raw)));
      }

      function resolveSettings(currentLevel) {
        return LEVELS[Math.min(LEVELS.length - 1, Math.max(0, currentLevel - 1))];
      }

      function setDifficultyDisplay(currentLevel) {
        if (elements.difficulty) {
          elements.difficulty.textContent = `Level ${currentLevel}`;
        }
      }

      function setStatus(message) {
        if (elements.status) {
          elements.status.textContent = message;
        }
      }

      function setProgress(value, total) {
        if (elements.progress) {
          elements.progress.textContent = `${value} / ${total}`;
        }
        if (elements.count) {
          elements.count.textContent = `${total} ${total === 1 ? 'prompt' : 'prompts'}`;
        }
      }

      function clearHistory() {
        if (elements.historyList) {
          elements.historyList.innerHTML = '';
        }
        if (elements.historyEmpty) {
          elements.historyEmpty.hidden = false;
        }
      }

      function setControlsEnabled(enabled) {
        if (elements.left) {
          elements.left.disabled = !enabled;
        }
        if (elements.right) {
          elements.right.disabled = !enabled;
        }
      }

      function updateRuleDisplay(task) {
        const taskMeta = TASKS[task];
        if (!taskMeta) {
          return;
        }
        if (elements.rule) {
          elements.rule.textContent = taskMeta.label;
        }
        if (elements.status) {
          elements.status.textContent = taskMeta.prompt;
        }
        if (elements.left) {
          elements.left.textContent = taskMeta.left;
        }
        if (elements.right) {
          elements.right.textContent = taskMeta.right;
        }
      }

      function updatePromptDisplay(text) {
        if (elements.prompt) {
          elements.prompt.textContent = text;
        }
      }

      function stopTimer() {
        if (promptTimer) {
          window.clearTimeout(promptTimer);
          promptTimer = null;
        }
      }

      function buildPrompts(total, settings) {
        const list = [];
        let previousTask = null;
        for (let i = 0; i < total; i += 1) {
          let task = previousTask;
          if (!task || Math.random() < settings.switchProbability) {
            task = Math.random() < 0.5 ? 'letter' : 'number';
          }
          const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
          const number = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
          list.push({ task, letter, number });
          previousTask = task;
        }
        return list;
      }

      function appendHistoryEntry(index, prompt, selection, correct, elapsedMs, timedOut) {
        if (!elements.historyList || !elements.historyEmpty) {
          return;
        }
        elements.historyEmpty.hidden = true;
        const item = document.createElement('li');
        item.className = 'history-item';

        const attempt = document.createElement('span');
        attempt.className = 'history-attempt';
        attempt.textContent = `Prompt ${index}`;

        const details = document.createElement('div');
        details.className = 'history-details';

        const summary = document.createElement('span');
        summary.className = 'history-guess';
        summary.textContent = `${prompt.letter}${prompt.number} (${TASKS[prompt.task].label})`;

        const result = document.createElement('span');
        result.className = 'history-result';
        if (timedOut) {
          result.textContent = 'No response';
          result.classList.add('history-result--low');
        } else {
          result.textContent = `Answered ${selection} • ${formatSeconds(elapsedMs / 1000)}`;
          result.classList.add(correct ? 'history-result--correct' : 'history-result--low');
        }

        details.append(summary, result);
        item.append(attempt, details);
        elements.historyList.append(item);
      }

      function handleResponse(choice) {
        if (!roundActive || !awaitingResponse) {
          return;
        }
        awaitingResponse = false;
        setControlsEnabled(false);
        stopTimer();

        const prompt = prompts[promptIndex];
        const now = performance.now ? performance.now() : Date.now();
        const elapsed = Math.max(0, now - promptStartedAt);
        responseTimes.push(elapsed);

        const taskMeta = TASKS[prompt.task];
        const correctLeft = taskMeta.evaluate(prompt.task === 'letter' ? prompt.letter : prompt.number);
        const isLeft = choice === 'left';
        const isCorrect = isLeft === correctLeft;
        if (isCorrect) {
          correctCount += 1;
        }

        appendHistoryEntry(promptIndex + 1, prompt, choice === 'left' ? taskMeta.left : taskMeta.right, isCorrect, elapsed, false);

        promptIndex += 1;
        if (promptIndex >= prompts.length) {
          completeRound();
        } else {
          advancePrompt();
        }
      }

      function handleTimeout() {
        if (!roundActive || !awaitingResponse) {
          return;
        }
        awaitingResponse = false;
        setControlsEnabled(false);
        stopTimer();
        timeoutCount += 1;
        const prompt = prompts[promptIndex];
        appendHistoryEntry(promptIndex + 1, prompt, null, false, currentSettings.limit, true);
        promptIndex += 1;
        advancePrompt();
      }

      function advancePrompt() {
        if (promptIndex >= prompts.length) {
          completeRound();
          return;
        }
        const prompt = prompts[promptIndex];
        updateRuleDisplay(prompt.task);
        updatePromptDisplay(`${prompt.letter}${prompt.number}`);
        setProgress(promptIndex + 1, prompts.length);
        awaitingResponse = true;
        setControlsEnabled(true);
        promptStartedAt = performance.now ? performance.now() : Date.now();
        stopTimer();
        promptTimer = window.setTimeout(() => handleTimeout(), currentSettings.limit);
      }

      function completeRound() {
        stopTimer();
        roundActive = false;
        awaitingResponse = false;
        setControlsEnabled(false);
        updatePromptDisplay('—');

        const playedLevel = level;
        const total = prompts.length;
        const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);
        const totalMs = responseTimes.reduce((sum, value) => sum + value, 0) + timeoutCount * currentSettings.limit;
        const averageMs = total === 0 ? 0 : totalMs / total;
        const averageLabel = formatSeconds(averageMs / 1000);

        recordSession({
          score: accuracy,
          label: `${accuracy}% accuracy • ${averageLabel}`,
          summary: `Navigated ${total} task switches with ${accuracy}% accuracy (${averageLabel} average response, level ${playedLevel})`,
          extra: {
            accuracy,
            averageMs,
            level: playedLevel,
            total,
            correct: correctCount,
            timeouts: timeoutCount
          }
        });

        let nextLevel = playedLevel;
        let difficultyNote = '';
        if (accuracy >= 85 && averageMs <= currentSettings.limit * 0.7 && playedLevel < LEVELS.length) {
          nextLevel = playedLevel + 1;
          difficultyNote = ` Level ${nextLevel} unlocked for the next circuit.`;
        } else if (accuracy < 70 && playedLevel > INITIAL_LEVEL) {
          nextLevel = playedLevel - 1;
          difficultyNote = ` Dropping to level ${nextLevel} to rebuild accuracy.`;
        }

        if (nextLevel !== playedLevel && typeof updateDifficulty === 'function') {
          const persisted = updateDifficulty(nextLevel);
          if (typeof persisted === 'number') {
            nextLevel = persisted;
          }
        }

        level = clampLevel(nextLevel);
        currentSettings = resolveSettings(level);
        setDifficultyDisplay(level);
        setStatus(`Circuit complete at ${accuracy}% accuracy (${averageLabel}).${difficultyNote}`);

        if (elements.start) {
          elements.start.disabled = false;
          elements.start.textContent = 'Run another circuit';
          elements.start.focus();
        }
      }

      function startRound() {
        if (roundActive) {
          return;
        }
        const storedLevel = typeof getDifficulty === 'function' ? Number(getDifficulty()) : level;
        if (Number.isFinite(storedLevel)) {
          level = clampLevel(storedLevel);
        }

        currentSettings = resolveSettings(level);
        prompts = buildPrompts(currentSettings.prompts, currentSettings);
        promptIndex = 0;
        responseTimes = [];
        correctCount = 0;
        timeoutCount = 0;
        clearHistory();
        setDifficultyDisplay(level);
        setProgress(0, prompts.length);
        updatePromptDisplay('—');
        setStatus('Respond using the current rule banner as quickly as you can.');
        setControlsEnabled(false);

        if (elements.start) {
          elements.start.disabled = true;
          elements.start.textContent = 'Circuit running…';
        }

        roundActive = true;
        advancePrompt();
      }

      const handleStart = () => startRound();
      const handleLeft = () => handleResponse('left');
      const handleRight = () => handleResponse('right');

      elements.start?.addEventListener('click', handleStart);
      elements.left?.addEventListener('click', handleLeft);
      elements.right?.addEventListener('click', handleRight);

      setDifficultyDisplay(level);
      setProgress(0, 0);
      updateRuleDisplay('letter');
      updatePromptDisplay('—');

      return {
        destroy() {
          stopTimer();
          elements.start?.removeEventListener('click', handleStart);
          elements.left?.removeEventListener('click', handleLeft);
          elements.right?.removeEventListener('click', handleRight);
        }
      };
    }
  };
}
