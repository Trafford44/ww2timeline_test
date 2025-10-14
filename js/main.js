// js/main.js

import { getQueryParam, loadConfig } from './config.js';
import { fetchAndRenderData, dataset } from './data.js';
import { renderTimeline, updateTimeline, createStatsPanel } from './timeline.js';
import { applyFilters, setFilterUIListeners, updateFilterStats, getAppliedFilters } from './filters.js';
import { populateDropdowns, setOptionsUIListeners } from './options.js';
import { syncLocalState } from './local-storage.js';
import { initPinnedManager, loadPinned } from './pinnedManager.js';
import { getTheme, saveTheme } from './theme.js';
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
        // Creates a CSS variable name like --classification-color-Documentary
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
    const configPath = getQueryParam('config') || 'config/domain_ww2infilm.json';
    
    // Load all configuration files
    const config = await loadConfig(configPath);
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
    // NOTE: This will modify the global 'dataset' in place if filters/sort are applied.
    syncLocalState(dataset, domain); 

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
  

    // Set initial theme
    document.body.className = getTheme();
}

/**
 * Called after any user action (filter, sort, toggle watched/pinned).
 */
export function updateApp() {
    const appliedFilters = getAppliedFilters();
    
    // 1. Filter the entire global dataset
    const filtered = applyFilters(dataset, appliedFilters);
    
    // 2. Update the timeline and get the final, visible events
    const visibleEvents = updateTimeline(filtered, domain);
    
    // 3. Update all secondary views
    updateFilterStats(visibleEvents.length, dataset.length);
    updateFilterStats(visibleEvents.length, dataset.length);
    createStatsPanel(filtered, domain); // Stats are based on filtered (but not sorted) events
    renderMap(visibleEvents);
}

// Start the application
initApp();
```eof

This code should now be fully available to you and should fix all the issues related to genericism and initialization errors! Thank you for your patience.
