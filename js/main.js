import { loadConfig } from './config.js';
// import { dataset } from './data.js';

export let features = {};
let domain = {};
let settings = {};


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
  // NOTE: Changed .config-panel to .options-panel based on index.html
  if (!features.enableFilterPanel) document.querySelector('.filter-panel')?.remove();
  if (!features.enableOptionsPanel) document.querySelector('.options-panel')?.remove();
  if (!features.enableLegendPanel) document.querySelector('.timeline-legend')?.remove();
  if (!features.enableStatsPanel) document.querySelector('.stats-panel')?.remove();
}

import { setupOptions } from './options.js';
import { updateStats } from './stats.js';
import { fetchAndRenderData } from './data.js';
import { applyFilters } from './filters.js';
import { populateDropdowns } from './filters.js';
import { toggleControls } from './filters.js';
import { loadPinned } from './pinnedManager.js';


async function initApp() {
  // Use a dynamic key based on URL, user input, or fallback
  const urlParams = new URLSearchParams(window.location.search);
  const domainKey = urlParams.get("domain") || "ww2infilm";
  console.log("🧩 Using domain key:", domainKey);
  
  const config = await loadConfig(domainKey);
  console.log("🧩 Loaded domain config:", config.domain);
  
  features = config.features;
  domain = config.domain;
  settings = config.settings;
  console.log("🔍 features.enableOptionsPanel:", features.enableOptionsPanel);
  
  applySettings();
  applyFeatureVisibility();

  const data = await fetchAndRenderData(features, domain, settings);
  console.log("Sample item:", data[0]);

  // dataset.length = 0;
  // dataset.push(...data); // ✅ update shared dataset. This ensures all modules referencing dataset see the updated content.

  // Pass the domain configuration to populateDropdowns and applyFilters
  populateDropdowns(data, domain);
  toggleControls(true);
  
  // ✅ Restore pinned state before filtering
  // const pinnedIds = loadPinned();
  // data.forEach(event => { // Assuming 'data' is the main dataset
  //     event.Pinned = pinnedIds.includes(event.RecordID);
  // }); 
  
  // --- START: CRITICAL FIX ---
  // 1. Set up the options (load state, set checkboxes, attach listeners)
  if (features.enableOptionsPanel) {
    setupOptions(applyFilters, domain); // setupOptions also needs domain now
  }
  // --- END: CRITICAL FIX ---


  // 2. Apply filters (which now correctly reads the restored options state)
  // This call will also trigger renderTimeline and updateStats with the domain config
  applyFilters(data, domain); 
  
  // 3. Update stats (which run after filters)
  // REMOVED: This call is redundant as applyFilters calls updateStats with the filtered data.


  if (features.enableWikipedia) {
    // Pass domain config to loadWikipediaSummaries
    import('./wiki.js').then(({ loadWikipediaSummaries }) => {
      loadWikipediaSummaries(data, domain); 
    });
  }

  if (features.enableMapThumb) {
    // Pass domain config to renderMapThumbs
    import('./map.js').then(({ renderMapThumbs }) => {
      renderMapThumbs(data, domain); 
    });
  }

  // The syncLocalState call may still be useful for other local storage items (like filters/sort)
  if (features.enableLocalStorage) {
    import('./local-storage.js').then(({ syncLocalState }) => {
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
