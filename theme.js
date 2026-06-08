const THEME_KEY = 'milestoneTheme';

function getThemePreference() {
  return localStorage.getItem(THEME_KEY) || 'system';
}

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(pref) {
  return pref === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : pref;
}

function applyTheme(pref) {
  const resolved = resolveTheme(pref);
  document.documentElement.setAttribute('data-theme', resolved);
  document.dispatchEvent(new CustomEvent('milestone:themechange', { detail: { theme: resolved } }));
}

function updateThemeToggleUI(pref) {
  document.querySelectorAll('.theme-toggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === pref);
  });
}

function setThemePreference(pref) {
  localStorage.setItem(THEME_KEY, pref);
  applyTheme(pref);
  updateThemeToggleUI(pref);
}

function setupThemeToggle() {
  document.querySelectorAll('.theme-toggle button').forEach(btn => {
    btn.addEventListener('click', () => setThemePreference(btn.dataset.theme));
  });
  updateThemeToggleUI(getThemePreference());

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getThemePreference() === 'system') applyTheme('system');
    });
  }
}

setupThemeToggle();
