async function fetchGreeting() {
  const messageEl = document.getElementById('api-message');
  const timestampEl = document.getElementById('api-timestamp');

  try {
    const response = await fetch('/api/hello');

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    messageEl.textContent = data.message;
    timestampEl.textContent = `Received at ${new Date(data.timestamp).toLocaleString()}`;
  } catch (error) {
    console.error('Unable to load the API response:', error);
    messageEl.textContent = 'Something went wrong while reaching the API.';
    timestampEl.textContent = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchGreeting();
});
