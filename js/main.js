import { loadConfig } from './config.js';
export let features = {};
let theme = {};
let domain = {};
let settings = {};

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty('--background-color', theme.backgroundColor || "#f5f5f5");
  root.style.setProperty('--text-color', theme.textColor || "#333");
  root.style.setProperty('--font-family', theme.fontFamily || "Arial, sans-serif");
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
import { updateStats } from './stats.js';
import { fetchAndRenderData } from './data.js';
import { applyFilters } from './filters.js';
import { populateDropdowns } from './filters.js';
import { toggleControls } from './filters.js';


// main.js

async function initApp() {
  // Use a dynamic key based on URL, user input, or fallback
  const urlParams = new URLSearchParams(window.location.search);
  const domainKey = urlParams.get("domain") || "ww2infilm";
  console.log("🧩 Using domain key:", domainKey);

  const config = await loadConfig(domainKey);
  console.log("🧩 Loaded domain config:", config.domain);
  
  features = config.features;
  theme = config.theme;
  domain = config.domain;
  settings = config.settings;

  applyTheme();
  applySettings();
  applyFeatureVisibility();

  const data = await fetchAndRenderData(domain);
  console.log("Sample item:", data[0]);

  populateDropdowns(data);
  toggleControls(true);

  if (features.enableConfigPanel) {
    setupOptions(applyFilters);
  }

  applyFilters(data);
  updateStats(data);

  if (features.enableWikipedia) {
    import('./wiki.js').then(({ loadWikipediaSummaries }) => {
      loadWikipediaSummaries(data);
    });
  }

  if (features.enableMapThumb) {
    import('./map.js').then(({ renderMapThumbs }) => {
      renderMapThumbs(data);
    });
  }

  if (features.enableLocalStorage) {
    import('./storage.js').then(({ syncLocalState }) => {
      syncLocalState(data);
    });
  }

  if (!features.enableExport) {
    const exportPanel = document.querySelector('.export-button-panel');
    if (exportPanel) {
      exportPanel.style.display = 'none';
    }
  }
}


initApp();
