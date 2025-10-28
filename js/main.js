import { loadConfig } from './config.js';
import { domainKey } from './domain.js';
// logging and alerts
import { enableTracing, disableTracing, getRecentActions } from './alerts/logger.js';
import { debouncedLogActivity } from './alerts/logger.js';
import { errorHandler } from './alerts/errorUtils.js';
import { logActivity } from './alerts/logger.js';

export let features = {};
let domain = {};
let settings = {};

// applySettings()
// Configures initial UI text and browser title based on domain and settings.
// Sets document.title using domain.subject and settings.appTitle
// Updates placeholder text and no-data message in key input elements
// Logs the action and handles errors via
function applySettings() {
  logActivity("info", "applySettings");
 
  try {
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
  } catch (error) {
    errorHandler(error, "applySettings - Failed while configurng initial UI text and browser title");
  }     
}

// applyFeatureVisibility()
// Dynamically removes UI panels based on feature toggles.
// Checks features flags like enableFilterPanel, enableOptionsPanel, etc.
// Removes corresponding DOM elements if disabled
// Logs the action and handles errors via handleError
function applyFeatureVisibility() {
 logActivity("info", "applyFeatureVisibility"); 
 try {
    if (!features.enableFilterPanel) document.querySelector('.filter-panel')?.remove();
    if (!features.enableOptionsPanel) document.querySelector('.options-panel')?.remove();
    if (!features.enableLegendPanel) document.querySelector('.timeline-legend')?.remove();
    if (!features.enableStatsPanel) document.querySelector('.stats-panel')?.remove();
  } catch (error) {
    errorHandler(error, "applyFeatureVisibility - Failed while setting feature visibility");
  }       
}

 import { setupOptions } from './options.js';
 import { updateStats } from './stats.js';
 import { fetchData } from './data.js';
 import { applyFilters } from './filters.js';
 import { populateDropdowns } from './filters.js';
 import { toggleControls } from './filters.js';
 import { loadPinned } from './pinnedManager.js';



 // initApp()
 // Bootstraps the entire application lifecycle.
 // Loads config using domainKey
 // Initializes features, domain, and settings
 // Applies settings and visibility rules
 // Fetches data and populates dropdowns
 // Sets up options panel and applies filters
 // Loads feature-specific modules (Wikipedia, map, local storage)
 // Logs the action and delegates error handling to errorHandler with metadata and retry callback
 async function initApp() { 
   
   try {  
     // 1. CONFIG LOADING (Will re-throw on error)
    const config = await loadConfig(domainKey);
        
    // throw new Error("Simulated error for testing");
   
    features = config.features;
    domain = config.domain;
    settings = config.settings;
    logActivity("info", "initApp: Config Loaded", { domain });
     
    applySettings();
    applyFeatureVisibility();

     // 2. DATA LOADING (Returns [] on error, but still needs to be inside the try)
    const data = await fetchData(features, domain, settings);

    if (data.length === 0) {
      logActivity("warning", "initApp: No data available", { reason: "Data loading failed or returned empty set." });
    }

    // 3. UI and Logic Setup (Where applyFilters() lives)
    populateDropdowns(data);
    toggleControls(true);
  
    // Set up the options (load state, set checkboxes, attach listeners)
    if (features.enableOptionsPanel) {
      setupOptions(applyFilters);
    }
  
    // If applyFilters() throws an error here, it's caught below.
    applyFilters(data);
  
    // load data for features, if they turned on
    loadFeatures(data);
  
  
   } catch (error) {
    // This catch block now handles:
    // 1. Errors from loadConfig (loadConfig re-throws)
    // 2. Unexpected errors from ANY synchronous function (e.g., applyFilters, populateDropdowns)
    
    errorHandler(error, "initApp - Failed during application startup", {
        // Use locally scoped variables if available
        metadata: { domain: domain, settings: settings }, 
        retryCallback: () => initApp()
     });
   }
}

// loadFeatures()
// Conditionally loads feature modules and toggles visibility of export/theme controls.
// Dynamically imports and executes wiki.js, map.js, and local-storage.js if enabled
// Hides export and theme buttons if disabled
// Collapses button panel if both are disabled
// Logs the action and handles errors via handleError
function loadFeatures(data) {
  logActivity("info", "loadFeatures"); 
  try {
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
   
  } catch (error) {
    errorHandler(error, "loadFeatures - Fail on loading app features");
  }  
}


initApp();
