let features = {};
let theme = {};
let domain = {};
let settings = {};

async function loadConfigs() {
  const [featuresRes, themeRes, domainRes, settingsRes] = await Promise.all([
    fetch('../config/features.json'),
    fetch('../config/theme_ww2infilm.json'),
    fetch('../config/domain_ww2infilm.json'),
    fetch('../config/settings_ww2infilm.json')
    //change above lines (theme, domain, settings) to new settings file when changing domain to, for example, science (settings_science.json)
  ]);
  features = await featuresRes.json();
  theme = await themeRes.json();
  domain = await domainRes.json();
  settings = await settingsRes.json();
}

function applyTheme() {
  document.body.style.backgroundColor = theme.backgroundColor || "#f4f4f4";
  document.body.style.color = theme.textColor || "#333";
  document.body.style.fontFamily = theme.fontFamily || "Arial, sans-serif";

  const root = document.documentElement;
  root.style.setProperty('--primary-color', theme.primaryColor || "#0d6efd");
}

function applySettings() {
  document.title = settings.appTitle || "Timeline App";
  const searchInput = document.getElementById("searchInput");
  const initialPrompt = document.getElementById("initialPrompt");
  if (searchInput && settings.searchPlaceholder) {
    searchInput.placeholder = settings.searchPlaceholder;
  }
  if (initialPrompt && settings.noDataMessage) {
    initialPrompt.textContent = settings.noDataMessage;
  }
}

function applyFeatureVisibility() {
  if (!features.enableFilterPanel) document.querySelector('.filter-panel')?.remove();
  if (!features.enableConfigPanel) document.querySelector('.config-panel')?.remove();
  if (!features.enableLegendPanel) document.querySelector('.timeline-legend')?.remove();
  if (!features.enableStatsPanel) document.querySelector('.stats-panel')?.remove();
}

async function initApp() {
  await loadConfigs();
  applyTheme();
  applySettings();
  applyFeatureVisibility();

  const { fetchAndRenderData } = await import('./data.js');
  fetchAndRenderData(features, domain, settings);

  if (features.enableWikipedia) {
    import('./wiki.js').then(({ loadWikipediaSummaries }) => {
      loadWikipediaSummaries();
    });
  }

  if (features.enableMapThumb) {
    import('./map.js').then(({ renderMapThumbs }) => {
      renderMapThumbs();
    });
  }

  if (features.enableExport) {
    import('./export.js').then(({ setupExport }) => {
      setupExport();
    });
  }

  if (features.enableLocalStorage) {
    import('./storage.js').then(({ syncLocalState }) => {
      syncLocalState();
    });
  }
}

initApp();
