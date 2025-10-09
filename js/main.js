import { loadConfig } from './config.js';
let features = {};
let theme = {};
let domain = {};
let settings = {};

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
  if (!features.enableOptionsPanel) document.querySelector('.config-panel')?.remove();
  if (!features.enableLegendPanel) document.querySelector('.timeline-legend')?.remove();
  if (!features.enableStatsPanel) document.querySelector('.stats-panel')?.remove();
}

import { setupOptions } from './options.js';
import { applyFilters } from './filters.js';
import { updateStats } from './stats.js';

async function initApp() {
  const config = await loadConfig("ww2infilm");
  features = config.features;
  theme = config.theme;
  domain = config.domain;
  settings = config.settings;
  
  applyTheme();
  applySettings();
  applyFeatureVisibility();

  const { fetchAndRenderData } = await import('./data.js');
  const data = await fetchAndRenderData(features, domain, settings); // ✅ capture returned data

  if (features.enableOptionsPanel) {
    const { setupOptions } = await import('./options.js');
    const { applyFilters } = await import('./filters.js');
    setupOptions(applyFilters, features); // ✅ wire up config panel toggles
  }
  
  if (features.enableWikipedia) {
    import('./wiki.js').then(({ loadWikipediaSummaries }) => {
      loadWikipediaSummaries(data);
    });
  }
  
  if (features.enableMapThumb) {
    import('./map.js').then(({ renderMapThumbs }) => {
      renderMapThumbs(data); // ✅ pass data
    });
  }
  
  if (features.enableExport) {
    import('./export.js').then(({ setupExport }) => {
      const exportButton = document.getElementById("exportButton");
      if (exportButton) {
        exportButton.addEventListener("click", () => setupExport(data)); // ✅ only runs on click
      }
    });
  }

  
  if (features.enableLocalStorage) {
    import('./storage.js').then(({ syncLocalState }) => {
      syncLocalState(data); // ✅ pass data
    });
  }

}

initApp();
