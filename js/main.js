let features = {};
let theme = {};
let domain = {};

async function loadConfigs() {
  const [featuresRes, themeRes, domainRes] = await Promise.all([
    fetch('../config/features.json'),
    fetch('../config/theme.json'),
    fetch('../config/domain.json')
  ]);
  features = await featuresRes.json();
  theme = await themeRes.json();
  domain = await domainRes.json();
}

function applyTheme() {
  document.body.style.backgroundColor = theme.backgroundColor || "#f4f4f4";
  document.body.style.color = theme.textColor || "#333";
  document.body.style.fontFamily = theme.fontFamily || "Arial, sans-serif";

  const root = document.documentElement;
  root.style.setProperty('--primary-color', theme.primaryColor || "#0d6efd");
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
  applyFeatureVisibility();

  const { fetchAndRenderData } = await import('./data.js');
  fetchAndRenderData(features, domain);

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
