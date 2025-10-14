// js/main.js - Fully Generic, Corrected Version

import { getQueryParam, loadConfig } from './config.js';
import { fetchAndRenderData, dataset } from './data.js';
import { renderTimeline, updateTimeline, createStatsPanel } from './timeline.js';
import { applyFilters, setFilterUIListeners, updateFilterStats, getAppliedFilters, populateDropdowns } from './filters.js';
import { setOptionsUIListeners } from './options.js'; // populateDropdowns removed from options.js
import { initPinnedManager } from './pinnedManager.js';
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

    style.innerHTML = `:root { ${cssVariables} }`;
    document.head.appendChild(style);
    console.log("🎨 Dynamic styles injected.");
}

/**
 * Applies initial settings like document title and data message.
 */
function applySettings() {
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
    
    const config = await loadConfig(domainKey);
    if (!config) return;

    ({ features, domain, settings } = config);

    applySettings();

    // --- GENERICISM INITIATION ---
    initPinnedManager(domain);
    injectDynamicStyles(domain);
    initWikiManager(domain);
    initMap(domain);

    let events = await fetchAndRenderData(features, domain, settings);

    if (events.length === 0) return;

    // --- State Synchronization and Initial Rendering ---
    
    renderTimeline(events, domain);
    
    // Load local storage items (filters/sort)
    import('./local-storage.js').then(({ syncLocalState }) => {
        // IMPORTANT: syncLocalState now requires the domain object
        syncLocalState(dataset, domain);
    });

    const filteredEvents = updateTimeline(dataset, domain);

    // IMPORTANT: populateDropdowns now requires the domain object
    populateDropdowns(dataset, domain); 
    setFilterUIListeners(domain, updateApp);
    setOptionsUIListeners(domain, updateApp);
    
    createStatsPanel(dataset, domain);
    renderMap(filteredEvents);
    updateFilterStats(filteredEvents.length, dataset.length);


}

/**
 * Called after any user action (filter, sort, toggle watched/pinned).
 */
export function updateApp() {
    const appliedFilters = getAppliedFilters();
    
    // IMPORTANT: applyFilters now requires the domain object
    const filtered = applyFilters(dataset, appliedFilters, domain);
    
    const visibleEvents = updateTimeline(filtered, domain);
    
    updateFilterStats(visibleEvents.length, dataset.length);
    createStatsPanel(filtered, domain);
    renderMap(visibleEvents);
}

initApp();
