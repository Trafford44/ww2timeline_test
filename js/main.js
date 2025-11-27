// --- Core Imports ---
import { loadConfig } from './config.js';
import { domainKey } from './domain.js';

// --- System/Utility Imports ---
import { logActivity } from './alerts/logger.js';
import { errorHandler } from './alerts/errorUtils.js';

// --- Feature/Module Imports ---
import { setupOptions } from './options.js';
import { fetchData } from './data.js';
import { applyFilters, populateDropdowns, toggleControls } from './filters.js';
import { loadPinned } from './pinnedManager.js';
import { initializeDateUtils, convertToLocalDate, getLocalTimestamp } from './dateUtils.js';


// --- Toolbar ---
import { initializeToolbarListeners, renderMinimap } from './toolbar.js';

// --- Global State ---
export let features = {};
let domain = {};
let settings = {};
let general;

export function setUIMessage(uiMessage) {
    const initialPrompt = document.getElementById("initialPrompt");
    if (initialPrompt) {
        initialPrompt.textContent = uiMessage;
    }   
}

/**
 * Configures initial UI text and browser title based on domain and settings.
 * Sets document.title, input placeholders, and the no-data message.
 */
function applySettings() {
    logActivity("info", "applySettings");
    
    try {
        // Set the browser title. Use default if either are blank/null
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
        errorHandler(error, "applySettings - Failed while configuring initial UI text and browser title");
    }       
}

/**
 * Dynamically removes UI panels based on feature toggles from the config.
 */
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

/**
 * Bootstraps the entire application lifecycle.
 * Loads config, initializes UI, fetches data, loads pinned state, and applies filters.
 */
export async function initApp() { 
    logActivity("info", "initApp: Startup initiated");

    try { 
        // 1. CONFIG LOADING
        const config = await loadConfig(domainKey);
        
        // 1.2. Initialize the date utility module with the general settings object
        // We pass the settings object we just loaded (config.general) to the utility functions.
        initializeDateUtils(config.general);
        
        features = config.features;
        domain = config.domain;
        settings = config.settings;
        general = config.general;
        logActivity("info", "initApp: Config Loaded", { domain });
        
        applySettings();
        applyFeatureVisibility();

        // 2. DATA LOADING
        const data = await fetchData(features, domain, settings);

        if (data.length === 0) {
            logActivity("warning", "initApp: No data available", { reason: "Data loading failed or returned empty set." });
        }

        // 3. UI and Logic Setup
        
        // Load pinned status from storage (MUST happen before filtering/rendering)
        loadPinned();

        populateDropdowns(data);
        toggleControls(true);
        
        // Set up the options (load state, set checkboxes, attach listeners)
        if (features.enableOptionsPanel) {
            setupOptions(applyFilters);
        }
        
        // Final call to apply filters and render the timeline
        applyFilters();
        
        // Minimap Initial Render - called after data loads and initial filters apply.
        renderMinimap(data);
    
        // Load feature-specific modules (Wikipedia, map, local storage)
        loadFeatures(data);

        // 4. Toolbar Setup
        // Initialize all toolbar event listeners (handles panel toggles)
        initializeToolbarListeners(); 



    } catch (error) {
        // This catch block handles major failures during startup
        errorHandler(error, "initApp - Failed during application startup", {
            metadata: { domain: domain, settings: settings }, 
            retryCallback: () => initApp()
        });
    }
}

export async function refreshApp() {
    logActivity("info", "refreshApp: Manual refresh triggered");
    clearTimeline();
    //setUIMessage('Loading data..');
    const data = await fetchData(features, domain, settings);
    
    applyFilters();
    renderMinimap(data);
    loadFeatures(data);
}

function clearTimeline() {
  const container = document.getElementById('timelineContainer');
  if (container) {
    container.innerHTML = ''; // remove all existing timeline items
  }
}

/**
 * Conditionally loads feature modules and toggles visibility of export/theme controls.
 */
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
        
        // Toggle visibility of Export Button
        if (!features.enableExport) {
            const exportButton = document.getElementById("exportButton");
            if (exportButton) {
                exportButton.style.display = 'none';
            }
        }
        
        // Toggle visibility of Theme Select
        if (!features.enableThemeToggle) {
            const themeSelect = document.getElementById("themeToggleButton");
            if (themeSelect) {
                themeSelect.style.display = 'none';
            }
        }   
        
        // Collapse buttons panel if both contained buttons are disabled
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

// Start the application
initApp();
