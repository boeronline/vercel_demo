let latestGreeting = null;
let isFetchingGreeting = false;

function updatePersonalizedPreview() {
  const input = document.getElementById('name-input');
  const output = document.getElementById('personalized-output');

  if (!input || !output) {
    return;
  }

  const value = input.value.trim();
  if (value.length === 0) {
    output.textContent = 'Enter a name to craft a friendly greeting.';
    return;
  }

  const baseMessage = latestGreeting?.message || 'Hello from the Vercel demo!';
  output.textContent = `${baseMessage} Let’s build something great, ${value}!`;
}

async function fetchGreeting() {
  if (isFetchingGreeting) {
    return;
  }

  const messageEl = document.getElementById('api-message');
  const timestampEl = document.getElementById('api-timestamp');
  const refreshButton = document.getElementById('refresh-btn');

  if (!messageEl || !timestampEl) {
    return;
  }

  isFetchingGreeting = true;
  messageEl.textContent = 'Requesting the latest message…';
  timestampEl.textContent = '';

  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Refreshing…';
  }

  try {
    const response = await fetch('/api/hello');

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    latestGreeting = data;
    messageEl.textContent = data.message;
    timestampEl.textContent = `Received at ${new Date(data.timestamp).toLocaleString()}`;
  } catch (error) {
    console.error('Unable to load the API response:', error);
    latestGreeting = null;
    messageEl.textContent = 'Something went wrong while reaching the API.';
  } finally {
    isFetchingGreeting = false;
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent = 'Refresh';
    }
    updatePersonalizedPreview();
  }
}

function setupPersonalizer() {
  const form = document.getElementById('personalize-form');
  const input = document.getElementById('name-input');

  if (!form || !input) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    updatePersonalizedPreview();
    input.focus();
  });

  input.addEventListener('input', () => {
    updatePersonalizedPreview();
  });

  updatePersonalizedPreview();
}

function loadChecklistState(key) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return {};
    }
    const parsed = JSON.parse(stored);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch (error) {
    console.warn('Unable to read checklist progress from localStorage:', error);
  }
  return {};
}

function saveChecklistState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to save checklist progress to localStorage:', error);
  }
}

function setupChecklist() {
  const checklistEl = document.getElementById('checklist');
  const progressBar = document.getElementById('progress-bar');
  const progressLabel = document.getElementById('progress-label');

  if (!checklistEl || !progressBar || !progressLabel) {
    return;
  }

  const STORAGE_KEY = 'vercel-demo-checklist';
  const tasks = [
    { id: 'repo', label: 'Connect your Git repository to Vercel' },
    { id: 'env', label: 'Configure required environment variables' },
    { id: 'preview', label: 'Test a preview deployment and share the link' },
    { id: 'monitoring', label: 'Set up monitoring or analytics for launch day' },
    { id: 'teammates', label: 'Invite teammates to collaborate on the project' }
  ];

  const savedState = loadChecklistState(STORAGE_KEY);

  function updateProgress() {
    const checkboxes = checklistEl.querySelectorAll('input[type="checkbox"]');
    const completed = Array.from(checkboxes).filter((checkbox) => checkbox.checked).length;
    const percent = Math.round((completed / tasks.length) * 100);

    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', String(percent));
    progressBar.setAttribute(
      'aria-valuetext',
      `${completed} of ${tasks.length} steps complete`
    );
    progressLabel.textContent = `You're ${completed} of ${tasks.length} steps done (${percent}%).`;
  }

  tasks.forEach((task) => {
    const listItem = document.createElement('li');
    const label = document.createElement('label');
    label.className = 'checklist-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `checklist-${task.id}`;
    checkbox.checked = Boolean(savedState[task.id]);
    checkbox.dataset.taskId = task.id;

    const text = document.createElement('span');
    text.textContent = task.label;

    checkbox.addEventListener('change', () => {
      savedState[task.id] = checkbox.checked;
      saveChecklistState(STORAGE_KEY, savedState);
      updateProgress();
    });

    label.append(checkbox, text);
    listItem.append(label);
    checklistEl.append(listItem);
  });

  progressBar.setAttribute('role', 'progressbar');
  progressBar.setAttribute('aria-valuemin', '0');
  progressBar.setAttribute('aria-valuemax', '100');
  progressBar.setAttribute('aria-label', 'Launch checklist progress');

  updateProgress();
}

function setupTips() {
  const tipMessage = document.getElementById('tip-message');
  const tipButton = document.getElementById('tip-button');

  if (!tipMessage || !tipButton) {
    return;
  }

  const tips = [
    'Preview deployments are perfect for gathering quick feedback from stakeholders.',
    'Use environment variables to keep secrets out of your repository.',
    'Need scheduled jobs? Pair serverless functions with background cron triggers.',
    'Share the preview URL with teammates so they can comment before you ship.',
    'Monitor function logs in the Vercel dashboard to understand real traffic patterns.'
  ];

  let previousIndex = -1;

  function showRandomTip() {
    let nextIndex = Math.floor(Math.random() * tips.length);
    if (tips.length > 1 && nextIndex === previousIndex) {
      nextIndex = (nextIndex + 1) % tips.length;
    }
    previousIndex = nextIndex;
    tipMessage.textContent = tips[nextIndex];
  }

  tipButton.addEventListener('click', () => {
    showRandomTip();
    tipButton.blur();
  });

  showRandomTip();
}

document.addEventListener('DOMContentLoaded', () => {
  const refreshButton = document.getElementById('refresh-btn');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      fetchGreeting();
    });
  }

  setupPersonalizer();
  setupChecklist();
  setupTips();
  fetchGreeting();
});
