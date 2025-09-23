
const STORAGE_KEY = 'synapse-studio-progress-v1';
const LEGACY_STORAGE_KEYS = ['brain-training-stats', 'launch-code-stats'];
const MAX_SESSIONS_STORED = 60;
const DATE_OPTIONS = { month: 'short', day: 'numeric' };
const TIME_OPTIONS = { hour: 'numeric', minute: '2-digit' };

const exercises = [
  createNumberLineExercise(),
  createSpeedMathExercise(),
  createMemoryFlashExercise()
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
      recordSession: (session) => recordSession(exerciseId, session)
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
    if (!data.exercises[exercise.id]) {
      data.exercises[exercise.id] = { sessions: [] };
    }
  });
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

function createNumberLineExercise() {
  const DEFAULT_RANGE = { min: 1, max: 100 };

  return {
    id: 'number-line',
    name: 'Number Line Focus',
    shortName: 'Number line',
    icon: '🎯',
    tagline: 'Use high-low hints to zero in on the hidden number as efficiently as possible.',
    highlights: [
      'Begin near the middle to keep your options flexible.',
      'Update the hint range with every guess to move quickly.',
      'Lower try counts push the trend line upward on the chart.'
    ],
    measurement: {
      better: 'lower',
      chartLabel: 'Tries per solve',
      intro: 'Solve the hidden number in as few tries as you can. Lower values mean quicker focus.'
    },
    mount({ container, recordSession }) {
      if (!container) {
        return {};
      }

      container.innerHTML = `
        <div class="number-line-module">
          <button class="button primary" id="number-line-start" type="button">Start round</button>
          <p class="range-display" id="number-line-range">Hint range: 1 – 100.</p>
          <p class="game-status" id="number-line-status">Tap start to begin your warm-up.</p>
          <form class="form" id="number-line-form" novalidate>
            <label class="form-field" for="number-line-input">Enter your guess</label>
            <div class="form-controls">
              <input id="number-line-input" name="guess" type="number" min="1" max="100" inputmode="numeric" autocomplete="off" placeholder="e.g. 42" required />
              <button class="button primary" id="number-line-submit" type="submit">Submit</button>
            </div>
          </form>
          <div class="history">
            <div class="history-header">
              <h3>Session log</h3>
              <span class="attempt-count" id="number-line-attempts">0 tries</span>
            </div>
            <p class="history-empty" id="number-line-empty">Your guesses will appear here.</p>
            <ol class="history-list" id="number-line-history" aria-live="polite"></ol>
          </div>
        </div>
      `;

      const elements = {
        start: container.querySelector('#number-line-start'),
        range: container.querySelector('#number-line-range'),
        status: container.querySelector('#number-line-status'),
        form: container.querySelector('#number-line-form'),
        input: container.querySelector('#number-line-input'),
        submit: container.querySelector('#number-line-submit'),
        attempts: container.querySelector('#number-line-attempts'),
        historyEmpty: container.querySelector('#number-line-empty'),
        historyList: container.querySelector('#number-line-history')
      };

      let secretNumber = null;
      let attempts = 0;
      let range = { ...DEFAULT_RANGE };
      let roundActive = false;

      function setStatus(message) {
        if (elements.status) {
          elements.status.textContent = message;
        }
      }

      function setRangeDisplay() {
        if (elements.range) {
          elements.range.textContent = `Hint range: ${range.min} – ${range.max}.`;
        }
      }

      function updateAttempts() {
        if (elements.attempts) {
          elements.attempts.textContent = attempts === 0 ? '0 tries' : formatTries(attempts);
        }
      }

      function resetHistory() {
        if (elements.historyList) {
          elements.historyList.innerHTML = '';
        }
        if (elements.historyEmpty) {
          elements.historyEmpty.hidden = false;
        }
      }

      function appendHistory(guess, outcome) {
        if (!elements.historyList || !elements.historyEmpty) {
          return;
        }
        elements.historyEmpty.hidden = true;
        const item = document.createElement('li');
        item.className = 'history-item';

        const attempt = document.createElement('span');
        attempt.className = 'history-attempt';
        attempt.textContent = `Try ${attempts}`;

        const details = document.createElement('div');
        details.className = 'history-details';

        const guessText = document.createElement('span');
        guessText.className = 'history-guess';
        guessText.textContent = `Entered ${guess}`;

        const result = document.createElement('span');
        result.className = 'history-result';
        if (outcome === 'correct') {
          result.classList.add('history-result--correct');
          result.textContent = 'Bullseye';
        } else if (outcome === 'low') {
          result.classList.add('history-result--low');
          result.textContent = 'Aim higher';
        } else {
          result.classList.add('history-result--high');
          result.textContent = 'Aim lower';
        }

        details.append(guessText, result);
        item.append(attempt, details);
        elements.historyList.append(item);
      }

      function startRound() {
        secretNumber = Math.floor(Math.random() * (DEFAULT_RANGE.max - DEFAULT_RANGE.min + 1)) + DEFAULT_RANGE.min;
        attempts = 0;
        range = { ...DEFAULT_RANGE };
        roundActive = true;
        resetHistory();
        setRangeDisplay();
        updateAttempts();
        setStatus('Guess a number between 1 and 100 to log your first try.');
        if (elements.input) {
          elements.input.disabled = false;
          elements.input.value = '';
          elements.input.focus();
        }
        if (elements.submit) {
          elements.submit.disabled = false;
        }
        if (elements.start) {
          elements.start.textContent = 'Restart round';
        }
      }

      function completeRound() {
        roundActive = false;
        if (elements.input) {
          elements.input.disabled = true;
        }
        if (elements.submit) {
          elements.submit.disabled = true;
        }
        if (elements.start) {
          elements.start.textContent = 'Start another round';
          elements.start.focus();
        }
        setStatus(`Bullseye! You solved it in ${formatTries(attempts)}.`);
        recordSession({
          score: attempts,
          label: formatTries(attempts),
          summary: `Solved the number line in ${formatTries(attempts)}`,
          extra: { attempts }
        });
      }

      function handleSubmit(event) {
        event.preventDefault();
        if (!roundActive) {
          setStatus('Press "Start round" to begin a new attempt.');
          return;
        }
        if (!elements.input) {
          return;
        }
        const rawValue = elements.input.value.trim();
        if (rawValue.length === 0) {
          setStatus('Enter a number between 1 and 100 to log a try.');
          elements.input.focus();
          return;
        }
        const guess = Number(rawValue);
        if (!Number.isInteger(guess)) {
          setStatus('Tries must be whole numbers.');
          elements.input.focus();
          return;
        }
        if (guess < DEFAULT_RANGE.min || guess > DEFAULT_RANGE.max) {
          setStatus('Stay within the hint range: choose a number from 1 to 100.');
          elements.input.focus();
          return;
        }

        attempts += 1;
        updateAttempts();

        if (guess === secretNumber) {
          appendHistory(guess, 'correct');
          completeRound();
          return;
        }

        if (guess < secretNumber) {
          range.min = Math.max(range.min, guess + 1);
          appendHistory(guess, 'low');
          setStatus(`Too low. Aim between ${range.min} and ${range.max}.`);
        } else {
          range.max = Math.min(range.max, guess - 1);
          appendHistory(guess, 'high');
          setStatus(`Too high. Aim between ${range.min} and ${range.max}.`);
        }

        setRangeDisplay();
        elements.input.value = '';
        elements.input.focus();
      }

      const startListener = () => startRound();
      const submitListener = (event) => handleSubmit(event);

      elements.start?.addEventListener('click', startListener);
      elements.form?.addEventListener('submit', submitListener);

      return {
        destroy() {
          elements.start?.removeEventListener('click', startListener);
          elements.form?.removeEventListener('submit', submitListener);
        }
      };
    }
  };
}

function createSpeedMathExercise() {
  const TOTAL_QUESTIONS = 5;

  return {
    id: 'speed-math',
    name: 'Speed Sum Sprint',
    shortName: 'Speed sums',
    icon: '⚡️',
    tagline: 'Answer a burst of addition and subtraction prompts faster each round.',
    highlights: [
      'Five quick equations test your mental arithmetic under light pressure.',
      'Corrections are counted, so aim for accuracy and speed.',
      'The chart tracks how your completion time improves across sessions.'
    ],
    measurement: {
      better: 'lower',
      chartLabel: 'Completion time (sec)',
      intro: 'Complete five equations as quickly as possible. Lower times signal faster processing.'
    },
    mount({ container, recordSession }) {
      if (!container) {
        return {};
      }

      container.innerHTML = `
        <div class="speed-math-module">
          <button class="button primary" id="math-start" type="button">Start sprint</button>
          <p class="game-status" id="math-status">Warm up your mental arithmetic, then tap start.</p>
          <form class="form" id="math-form" novalidate>
            <label class="form-field" for="math-input">Current prompt</label>
            <div class="form-controls">
              <input id="math-input" name="answer" type="number" inputmode="numeric" autocomplete="off" placeholder="Type the answer" required disabled />
              <button class="button primary" id="math-submit" type="submit" disabled>Submit</button>
            </div>
          </form>
          <div class="history">
            <div class="history-header">
              <h3>Equation log</h3>
              <span class="attempt-count" id="math-progress">0 / ${TOTAL_QUESTIONS}</span>
            </div>
            <p class="history-empty" id="math-empty">Your solutions will appear here.</p>
            <ol class="history-list" id="math-history" aria-live="polite"></ol>
          </div>
        </div>
      `;

      const elements = {
        start: container.querySelector('#math-start'),
        status: container.querySelector('#math-status'),
        form: container.querySelector('#math-form'),
        input: container.querySelector('#math-input'),
        submit: container.querySelector('#math-submit'),
        progress: container.querySelector('#math-progress'),
        historyEmpty: container.querySelector('#math-empty'),
        historyList: container.querySelector('#math-history')
      };

      let questions = [];
      let index = 0;
      let mistakes = 0;
      let questionMistakes = 0;
      let roundActive = false;
      let startedAt = 0;

      function generateQuestion() {
        const first = Math.floor(Math.random() * 20) + 5;
        const second = Math.floor(Math.random() * 12) + 1;
        const useSubtraction = Math.random() < 0.4;
        if (useSubtraction) {
          const minuend = Math.max(first, second + 4);
          const subtrahend = Math.floor(Math.random() * (Math.min(minuend, 18) - 3)) + 3;
          return {
            prompt: `${minuend} − ${subtrahend}`,
            answer: minuend - subtrahend
          };
        }
        return {
          prompt: `${first} + ${second}`,
          answer: first + second
        };
      }

      function buildQuestions() {
        const set = [];
        while (set.length < TOTAL_QUESTIONS) {
          set.push(generateQuestion());
        }
        return set;
      }

      function setStatus(message) {
        if (elements.status) {
          elements.status.textContent = message;
        }
      }

      function updateProgress() {
        if (elements.progress) {
          elements.progress.textContent = `${index} / ${TOTAL_QUESTIONS}`;
        }
      }

      function resetHistory() {
        if (elements.historyList) {
          elements.historyList.innerHTML = '';
        }
        if (elements.historyEmpty) {
          elements.historyEmpty.hidden = false;
        }
      }

      function appendHistory(question, adjustmentCount) {
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

        const prompt = document.createElement('span');
        prompt.className = 'history-guess';
        prompt.textContent = `${question.prompt} = ${question.answer}`;

        const result = document.createElement('span');
        result.className = 'history-result';
        if (adjustmentCount === 0) {
          result.textContent = 'Clean solve';
        } else {
          result.textContent = `${adjustmentCount} ${pluralize(adjustmentCount, 'correction')}`;
        }

        details.append(prompt, result);
        item.append(attempt, details);
        elements.historyList.append(item);
      }

      function startRound() {
        questions = buildQuestions();
        index = 0;
        mistakes = 0;
        questionMistakes = 0;
        roundActive = true;
        startedAt = performance.now ? performance.now() : Date.now();
        resetHistory();
        updateProgress();
        setStatus('Solve each prompt as quickly as you can.');
        if (elements.input) {
          elements.input.disabled = false;
          elements.input.value = '';
        }
        if (elements.submit) {
          elements.submit.disabled = false;
        }
        if (elements.start) {
          elements.start.textContent = 'Restart sprint';
        }
        focusInput();
        showCurrentPrompt();
      }

      function focusInput() {
        window.requestAnimationFrame(() => {
          elements.input?.focus();
        });
      }

      function showCurrentPrompt() {
        if (!elements.form) {
          return;
        }
        const question = questions[index];
        if (!question) {
          return;
        }
        const label = elements.form.querySelector('label[for="math-input"]');
        if (label) {
          label.textContent = `Prompt ${index + 1} of ${TOTAL_QUESTIONS}`;
        }
        setStatus(`What is ${question.prompt}?`);
      }

      function completeRound() {
        roundActive = false;
        if (elements.input) {
          elements.input.disabled = true;
        }
        if (elements.submit) {
          elements.submit.disabled = true;
        }
        if (elements.start) {
          elements.start.textContent = 'Start another sprint';
          elements.start.focus();
        }

        const finishedAt = performance.now ? performance.now() : Date.now();
        const elapsedMs = finishedAt - startedAt;
        const elapsedSeconds = Math.max(0, elapsedMs / 1000);
        const label = mistakes === 0
          ? `${formatSeconds(elapsedSeconds)}`
          : `${formatSeconds(elapsedSeconds)} • ${mistakes} ${pluralize(mistakes, 'correction')}`;

        setStatus(`Sprint complete in ${formatSeconds(elapsedSeconds)} with ${mistakes} ${pluralize(
          mistakes,
          'correction'
        )}.`);

        recordSession({
          score: elapsedSeconds,
          label,
          summary: `Solved ${TOTAL_QUESTIONS} equations in ${formatSeconds(elapsedSeconds)} (${mistakes} ${pluralize(
            mistakes,
            'correction'
          )})`,
          extra: { elapsedSeconds, mistakes, total: TOTAL_QUESTIONS }
        });
      }

      function handleSubmit(event) {
        event.preventDefault();
        if (!roundActive || !elements.input) {
          setStatus('Tap "Start sprint" to begin.');
          return;
        }
        const raw = elements.input.value.trim();
        if (raw.length === 0) {
          setStatus('Enter an answer to keep the sprint moving.');
          elements.input.focus();
          return;
        }
        const value = Number(raw);
        if (!Number.isFinite(value)) {
          setStatus('Answers must be numbers.');
          elements.input.focus();
          return;
        }

        const currentQuestion = questions[index];
        if (!currentQuestion) {
          return;
        }

        if (value === currentQuestion.answer) {
          index += 1;
          appendHistory(currentQuestion, questionMistakes);
          questionMistakes = 0;
          updateProgress();
          if (index >= questions.length) {
            completeRound();
            return;
          }
          elements.input.value = '';
          showCurrentPrompt();
          focusInput();
        } else {
          mistakes += 1;
          questionMistakes += 1;
          setStatus('Not quite right—adjust and try again.');
          elements.input.select();
        }
      }

      const startListener = () => startRound();
      const submitListener = (event) => handleSubmit(event);

      elements.start?.addEventListener('click', startListener);
      elements.form?.addEventListener('submit', submitListener);

      return {
        destroy() {
          elements.start?.removeEventListener('click', startListener);
          elements.form?.removeEventListener('submit', submitListener);
        }
      };
    }
  };
}

function createMemoryFlashExercise() {
  return {
    id: 'memory-flash',
    name: 'Memory Flash Recall',
    shortName: 'Memory flash',
    icon: '✨',
    tagline: 'Study a quick number string, let it fade, then reproduce it from memory.',
    highlights: [
      'Sequences vary between four and seven digits to keep you adaptable.',
      'The display hides after a short pause so you can practise recall without cues.',
      'Accuracy percentages climb when more digits land in the correct position.'
    ],
    measurement: {
      better: 'higher',
      chartLabel: 'Recall accuracy (%)',
      intro: 'Recreate the hidden number string. Higher percentages show stronger short-term recall.'
    },
    mount({ container, recordSession }) {
      if (!container) {
        return {};
      }

      container.innerHTML = `
        <div class="memory-flash-module">
          <button class="button primary" id="memory-start" type="button">Show sequence</button>
          <p class="range-display" id="memory-sequence" aria-live="polite">Press the button to reveal a sequence.</p>
          <p class="game-status" id="memory-status">You will have a few seconds to study the digits before they vanish.</p>
          <form class="form" id="memory-form" novalidate>
            <label class="form-field" for="memory-input">Type the sequence from memory</label>
            <div class="form-controls">
              <input id="memory-input" name="memory" type="text" inputmode="numeric" autocomplete="off" placeholder="Enter the digits" disabled required />
              <button class="button primary" id="memory-submit" type="submit" disabled>Submit</button>
            </div>
          </form>
          <div class="history">
            <div class="history-header">
              <h3>Recall summary</h3>
              <span class="attempt-count" id="memory-length">0 digits</span>
            </div>
            <p class="history-empty" id="memory-empty">Complete a recall to see the breakdown.</p>
            <ol class="history-list" id="memory-history" aria-live="polite"></ol>
          </div>
        </div>
      `;

      const elements = {
        start: container.querySelector('#memory-start'),
        sequence: container.querySelector('#memory-sequence'),
        status: container.querySelector('#memory-status'),
        form: container.querySelector('#memory-form'),
        input: container.querySelector('#memory-input'),
        submit: container.querySelector('#memory-submit'),
        length: container.querySelector('#memory-length'),
        historyEmpty: container.querySelector('#memory-empty'),
        historyList: container.querySelector('#memory-history')
      };

      let sequence = '';
      let revealTimeout = null;
      let accepting = false;

      function clearTimeoutIfNeeded() {
        if (revealTimeout) {
          window.clearTimeout(revealTimeout);
          revealTimeout = null;
        }
      }

      function generateSequence() {
        const length = Math.floor(Math.random() * 4) + 4;
        const digits = [];
        for (let i = 0; i < length; i += 1) {
          digits.push(Math.floor(Math.random() * 9) + 1);
        }
        return digits.join('');
      }

      function setStatus(message) {
        if (elements.status) {
          elements.status.textContent = message;
        }
      }

      function setLengthDisplay(length) {
        if (elements.length) {
          elements.length.textContent = `${length} ${pluralize(length, 'digit')}`;
        }
      }

      function resetHistory() {
        if (elements.historyList) {
          elements.historyList.innerHTML = '';
        }
        if (elements.historyEmpty) {
          elements.historyEmpty.hidden = false;
        }
      }

      function startRound() {
        clearTimeoutIfNeeded();
        sequence = generateSequence();
        setLengthDisplay(sequence.length);
        accepting = false;
        resetHistory();

        if (elements.sequence) {
          elements.sequence.textContent = sequence.split('').join(' ');
        }
        setStatus('Memorise the digits before they fade.');
        if (elements.input) {
          elements.input.value = '';
          elements.input.disabled = true;
        }
        if (elements.submit) {
          elements.submit.disabled = true;
        }
        if (elements.start) {
          elements.start.textContent = 'Show another sequence';
          elements.start.disabled = true;
        }

        const displayDuration = 2200 + sequence.length * 400;
        revealTimeout = window.setTimeout(() => {
          if (elements.sequence) {
            elements.sequence.textContent = 'Sequence hidden. Recreate it from memory.';
          }
          setStatus('Type the digits in order, then press submit.');
          if (elements.input) {
            elements.input.disabled = false;
            elements.input.focus();
          }
          if (elements.submit) {
            elements.submit.disabled = false;
          }
          accepting = true;
          if (elements.start) {
            elements.start.disabled = false;
          }
        }, displayDuration);
      }

      function appendHistoryEntry(accuracy, correctCount, attempt) {
        if (!elements.historyList || !elements.historyEmpty) {
          return;
        }
        elements.historyEmpty.hidden = true;
        const item = document.createElement('li');
        item.className = 'history-item';

        const heading = document.createElement('span');
        heading.className = 'history-attempt';
        heading.textContent = `${accuracy}% accuracy`;

        const details = document.createElement('div');
        details.className = 'history-details';

        const target = document.createElement('span');
        target.className = 'history-guess';
        target.textContent = `Target: ${sequence}`;

        const result = document.createElement('span');
        result.className = 'history-result';
        result.textContent = `You entered: ${attempt || '—'} (${correctCount}/${sequence.length} correct)`;

        details.append(target, result);
        item.append(heading, details);
        elements.historyList.append(item);
      }

      function completeRound(attempt) {
        accepting = false;
        if (elements.input) {
          elements.input.disabled = true;
        }
        if (elements.submit) {
          elements.submit.disabled = true;
        }
        if (elements.start) {
          elements.start.focus();
        }

        const sanitized = (attempt || '').replace(/\s+/g, '');
        let correct = 0;
        for (let i = 0; i < sequence.length; i += 1) {
          if (sanitized[i] === sequence[i]) {
            correct += 1;
          }
        }
        const accuracy = sequence.length === 0 ? 0 : Math.round((correct / sequence.length) * 100);
        setStatus(`Recall scored ${accuracy}% with ${correct} of ${sequence.length} digits in place.`);
        appendHistoryEntry(accuracy, correct, sanitized);

        recordSession({
          score: accuracy,
          label: `${accuracy}% accuracy`,
          summary: `Recalled ${sequence.length} digits with ${accuracy}% accuracy`,
          extra: { accuracy, correct, length: sequence.length }
        });
      }

      function handleSubmit(event) {
        event.preventDefault();
        if (!accepting || !elements.input) {
          setStatus('Press "Show sequence" to start a round.');
          return;
        }
        const attempt = elements.input.value.trim();
        if (attempt.length === 0) {
          setStatus('Enter the digits you remember to log a result.');
          elements.input.focus();
          return;
        }
        completeRound(attempt);
      }

      const startListener = () => startRound();
      const submitListener = (event) => handleSubmit(event);

      elements.start?.addEventListener('click', startListener);
      elements.form?.addEventListener('submit', submitListener);

      return {
        destroy() {
          clearTimeoutIfNeeded();
          elements.start?.removeEventListener('click', startListener);
          elements.form?.removeEventListener('submit', submitListener);
        }
      };
    }
  };
}
