import { loadConfig } from './config.js';
import { domainKey } from './domain.js';
// logging and alerts
import { enableTracing, disableTracing, getRecentActions } from './alerts/logger.js';
import { debouncedLogAction } from './alerts/logger.js';
import { hideAlert } from './alerts/alertUtils.js';


export let features = {};
let domain = {};
let settings = {};


function applySettings() {
 // document.title = settings.appTitle || "Timeline App";

  // set the browser title. Use default if either are blank/null
  const subject = domain.subject?.trim();
  const title = settings.appTitle?.trim();  
  document.title = (subject && title)
    ? `${subject} ${title}`
    : "Timeline App";

  const searchInput = document.getElementById("searchInput");
  const initialPrompt = document.getElementById("initialPrompt");
  if (searchInput && settings.searchPlaceholder) {
    searchInput.placeholder = settings.searchPlaceholder;
  }
  if (initialPrompt && settings.noDataMessage) {
    initialPrompt.textContent = settings.noDataMessage;
  }
  hideAlert();
}

function applyFeatureVisibility() {
  // NOTE: Changed .config-panel to .options-panel based on index.html
  if (!features.enableFilterPanel) document.querySelector('.filter-panel')?.remove();
  if (!features.enableOptionsPanel) document.querySelector('.options-panel')?.remove();
  if (!features.enableLegendPanel) document.querySelector('.timeline-legend')?.remove();
  if (!features.enableStatsPanel) document.querySelector('.stats-panel')?.remove();
}

import { setupOptions } from './options.js';
import { updateStats } from './stats.js';
import { fetchData } from './data.js';
import { applyFilters } from './filters.js';
import { populateDropdowns } from './filters.js';
import { toggleControls } from './filters.js';
import { loadPinned } from './pinnedManager.js';

async function initApp() {
  // Use a dynamic key based on URL, user input, or fallback
  //const urlParams = new URLSearchParams(window.location.search);
  
  const config = await loadConfig(domainKey);
  console.log("🧩 Loaded domain config:", config.domain);
  
  features = config.features;
  domain = config.domain;
  settings = config.settings;
  console.log("🔍 features.enableOptionsPanel:", features.enableOptionsPanel);
  
  applySettings();
  applyFeatureVisibility();

  const data = await fetchData(features, domain, settings);
  console.log("Sample item:", data[0]);

  // dataset.length = 0;
  // dataset.push(...data); // ✅ update shared dataset. This ensures all modules referencing dataset see the updated content.

  populateDropdowns(data);
  toggleControls(true);
  
  // ✅ Restore pinned state before filtering
  // const pinnedIds = loadPinned();
  // data.forEach(event => { // Assuming 'data' is the main dataset
  //    event.Pinned = pinnedIds.includes(event.RecordID);
  // }); 
  
  // --- START: CRITICAL FIX ---
  // 1. Set up the options (load state, set checkboxes, attach listeners)
  if (features.enableOptionsPanel) {
    setupOptions(applyFilters);
  }
  // --- END: CRITICAL FIX ---


  // 2. Apply filters (which now correctly reads the restored options state)
  applyFilters(data);
  
  // 3. Update stats (which run after filters)
  //updateStats(data);


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

  if (!features.enableExport) {
    //const exportPanel = document.querySelector('.options-button-panel');
    const exportButton = document.getElementById("exportButton");
    if (exportButton) {
      exportButton.style.display = 'none';
    }
  }

  if (!features.enableThemeToggle) {
    const themeSelect = document.getElementById("themeToggleButton");
    if (themeSelect) {
      themeSelect.style.display = 'none';
    }
  }  
  
  if (!features.enableExport && !features.enableThemeToggle) {
    const buttonsPanel = document.querySelector('.options-button-panel');
    if (buttonsPanel) {
      buttonsPanel.style.display = 'none';
    }
  }


  // The syncLocalState call may still be useful for other local storage items (like filters/sort)
  if (features.enableLocalStorage) {
    import('./local-storage.js').then(({ syncLocalState }) => {
      syncLocalState(data);
    });
  }  
}


initApp();
