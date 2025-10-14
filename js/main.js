// js/main.js

import { getQueryParam, loadConfig } from './config.js';
import { fetchAndRenderData, dataset } from './data.js';
import { renderTimeline, updateTimeline, createStatsPanel } from './timeline.js';
import { applyFilters, setFilterUIListeners, updateFilterStats, getAppliedFilters } from './filters.js';
import { populateDropdowns, setOptionsUIListeners } from './options.js';
import { syncLocalState } from './local-storage.js';
import { initPinnedManager } from './pinnedManager.js'; // NOTE: loadPinned is handled internally or in timeline.js
import { getTheme } from './theme.js';
import { initMap, renderMap } from './map.js';
import { initWikiManager } from './wiki.js';

// Global variables for configuration
let features = {};
let domain = {};
let settings = {};

/**
 * Reads classification colors from domain config and injects them as CSS variables.
 * @param {object} domain - The configuration object containing classificationColors.
 */
function injectDynamicStyles(domain) {
    if (!domain?.classificationColors) return;

    const style = document.createElement('style');
    let cssVariables = '';

    for (const [key, color] of Object.entries(domain.classificationColors)) {
        // Creates a CSS variable name like --classification-color-documentary
        const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '-');
        cssVariables += `--classification-color-${cleanKey}: ${color};`;
    }

    // Apply these variables to the root of the document
    style.innerHTML = `:root { ${cssVariables} }`;
    document.head.appendChild(style);
    console.log("🎨 Dynamic styles injected.");
}

/**
 * Applies initial settings like document title and data message.
 */
function applySettings() {
    // Apply initial application settings from the config
    document.title = settings.title || "Timeline Application";

    const searchInput = document.getElementById("searchInput");
    if (searchInput && settings.searchPlaceholder) {
        searchInput.placeholder = settings.searchPlaceholder;
    }
    
    const initialPrompt = document.getElementById("initialPrompt");
    if (initialPrompt && settings.noDataMessage) {
        initialPrompt.textContent = settings.noDataMessage;
    }
}

/**
 * Main application initializer.
 */
async function initApp() {
    const domainKey = getQueryParam('domain') || "ww2infilm";
    console.log("🧩 Using domain key:", domainKey);
    
    // Load all configuration files
    const config = await loadConfig(domainKey);
    if (!config) return;

    // Destructure loaded config
    ({ features, domain, settings } = config);

    // Apply configuration settings
    applySettings();

    // --- GENERICISM INITIATION ---
    // 1. Initialize Pinned Manager with the current domain to ensure unique storage keys
    initPinnedManager(domain);
    
    // 2. Inject dynamic classification colors into CSS
    injectDynamicStyles(domain);

    // 3. Initialize Wiki Manager with the base URL
    initWikiManager(domain);

    // 4. Initialize the map (does not render yet)
    initMap(domain);

    // Load data and store it globally
    let events = await fetchAndRenderData(features, domain, settings);

    if (events.length === 0) {
        // Stop execution if no data was loaded
        return;
    }

    // --- State Synchronization and Initial Rendering ---
    
    // Create the initial timeline HTML from the full, unsorted dataset
    renderTimeline(events, domain);
    
    // Synchronize local state (filters/sort) before any other UI rendering
    // NOTE: syncLocalState now correctly accepts the domain object
    import('./local-storage.js').then(({ syncLocalState }) => {
        syncLocalState(dataset, domain);
    });

    // Re-render the timeline with the potentially filtered/sorted data
    const filteredEvents = updateTimeline(dataset, domain);

    // Populate dropdowns and set up filter/options UI
    populateDropdowns(dataset, domain);
    setFilterUIListeners(domain, updateApp);
    setOptionsUIListeners(domain, updateApp);
    
    // Render initial statistics and map
    createStatsPanel(dataset, domain);
    renderMap(filteredEvents);
    updateFilterStats(filteredEvents.length, dataset.length);

    // Set initial theme
    document.body.className = getTheme();
}

/**
 * Called after any user action (filter, sort, toggle watched/pinned).
 */
export function updateApp() {
    const appliedFilters = getAppliedFilters();
    
    // 1. Filter the entire global dataset
    const filtered = applyFilters(dataset, appliedFilters, domain);
    
    // 2. Update the timeline and get the final, visible events
    const visibleEvents = updateTimeline(filtered, domain);
    
    // 3. Update all secondary views
    updateFilterStats(visibleEvents.length, dataset.length);
    createStatsPanel(filtered, domain); // Stats are based on filtered (but not sorted) events
    renderMap(visibleEvents);
}

// Start the application
initApp();
