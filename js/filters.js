import { renderTimeline } from './timeline.js';
import { updateStats } from './stats.js';
import { dataset } from './data.js';
import { isPinned } from './pinnedManager.js';
import { logActivity } from './alerts/logger.js';
import { errorHandler } from './alerts/errorUtils.js';

// --- DOM Element References ---
export const searchInput = document.getElementById('searchInput');
export const watchedFilter = document.getElementById('watchedFilter');
export const formatFilter = document.getElementById('formatFilter');
export const classificationFilter = document.getElementById('classificationFilter');
export const platformFilter = document.getElementById('platformFilter');
export const eventYearFilter = document.getElementById('eventYearFilter');
export const periodFilter = document.getElementById('periodFilter');
export const pinnedFilter = document.getElementById('pinnedFilter');
export const clearFilters = document.getElementById('clearFilters');
export const hideWatchedToggle = document.getElementById("hideWatchedToggle");
export const hidePinnedToggle = document.getElementById("hidePinnedToggle");
export const challengeModeToggle = document.getElementById("challengeModeToggle");
// --- Utility for Sanitization ---
// Used to safely access and clean DOM element values
const getDomValue = (el) => el?.value?.trim() || "";

// toggleControls() - UI Control & Dropdown Setup
// Enables or disables all filter controls and the clear button.
// Accepts a boolean enable
// Applies .disabled = true/false to all relevant UI elements
// Logs the action and handles errors via handleError
export function toggleControls(enable) {
  logActivity("info", "toggleControls", { enable });
  [
    searchInput, watchedFilter, formatFilter, classificationFilter,
    platformFilter, eventYearFilter, periodFilter, pinnedFilter, clearFilters
  ].forEach(el => el.disabled = !enable);
}

// populateDropdowns() - UI Control & Dropdown Setup
// Extracts unique values from fullData and populates dropdown filters.
// Derives sorted lists for Format, Classification, EventYear, Period, and Platform
// Normalizes platform values (trimming, lowercasing, deduplicating)
// Injects <option> elements into corresponding <select> elements
// Logs the action and handles errors via handleError
export function populateDropdowns(fullData) {
    
    // R1: Robustness Check - Stop if data is invalid or empty.
    if (!Array.isArray(fullData) || fullData.length === 0) {
        logActivity("warning", "populateDropdowns", { reason: "No data to populate dropdowns." });
        return;
    }

    logActivity("info", "populateDropdowns initiated", { dataCount: fullData.length });
    
    // --- Data Extraction & Sorting ---
    const formats = [...new Set(fullData.map(f => f.Format).filter(Boolean))].sort();
    const classifications = [...new Set(fullData.map(f => f.Classification).filter(Boolean))].sort();
    const eventYears = [...new Set(fullData.map(f => f.EventYear).filter(Boolean))].sort();
    const periods = [...new Set(fullData.map(f => f.Period).filter(Boolean))].sort();
    
    // Platform extraction logic: FlatMap, clean commas, split, trim, deduplicate
    const platforms = [...new Set(
        fullData
            .flatMap(f => (f.Platform || "")
                .replace(/^,+|,+$/g, "") // Remove leading/trailing commas
                .split(',')
                .map(p => p.trim().toLowerCase()))
            .filter(p => p) // Filter out empty strings
    )].sort();
    
    // --- DOM Injection ---
    
    // Helper function to create option HTML from an array of values
    const createOptions = (arr) => arr.map(v => `<option value="${v}">${v}</option>`).join("");
    
    if (formatFilter) {
        formatFilter.innerHTML = `<option value="">Format: All</option>` + createOptions(formats);
    }    
    if (classificationFilter) {
        classificationFilter.innerHTML = `<option value="">Classification: All</option>` + createOptions(classifications);
    }    
    if (eventYearFilter) {
        eventYearFilter.innerHTML = `<option value="">Event Year: All</option>` + createOptions(eventYears);
    }    
    if (periodFilter) {
        periodFilter.innerHTML = `<option value="">Period: All</option>` + createOptions(periods);
    }    
    if (platformFilter) {
        platformFilter.innerHTML = `
            <option value="">Platform/s: All</option>
            <option value="__none__">(none assigned)</option>
            ${platforms.map(p => {
                // Capitalize first letter for display
                const sentenceCase = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
                return `<option value="${p}">${sentenceCase}</option>`;
            }).join("")}
        `;
    }
}

// parseSearchQuery() - Search & Filter Parsing
// Parses a free-text search query into structured filters and keywords.
// Splits query into terms
// Extracts field:value pairs for supported fields
// Separates remaining terms as keywords
// Returns { filters, keywords }
// Logs the action and handles errors via handleError
export function parseSearchQuery(query) {
    // Note: Logging should probably be outside this tight, utility function
    const terms = query.toLowerCase().split(/\s+/).filter(t => t); // filter(t => t) cleans empty strings from split
    const filters = {};
    const keywords = [];
    
    terms.forEach(term => {
        const [field, value] = term.split(":");
        // Check for value AND supported field
        if (value && ["title", "platform", "classification", "period", "year", "watched"].includes(field)) {
            filters[field] = value;
        } else {
            keywords.push(term);
        }
    });
    return { filters, keywords };
}

// getFilterValues() - Search & Filter Parsing
// Captures the current state of all filters and toggles.
// Reads values from dropdowns, toggles, and search input
// Parses search input using parseSearchQuery()
// Returns a structured object of filter values
// Logs the action and handles errors via handleError
function getFilterValues() {
    return {
      // Use getDomValue for robustness
      search: parseSearchQuery(getDomValue(searchInput)),
      watched: getDomValue(watchedFilter),
      format: getDomValue(formatFilter),
      classification: getDomValue(classificationFilter),
      platform: getDomValue(platformFilter),
      eventYear: getDomValue(eventYearFilter),
      period: getDomValue(periodFilter),
      pinned: getDomValue(pinnedFilter),
      
      // Use optional chaining for toggles (safer, as in your original code)
      hideWatched: hideWatchedToggle?.checked || false,
      hidePinned: hidePinnedToggle?.checked || false,
      challengeMode: challengeModeToggle?.checked || false
    };
}

// setupExportButton()
// Prepares the export button to trigger data export using the current filtered dataset.
// Purpose: Ensures the export button is cleanly wired to export logic without duplicate listeners
// Input: filtered — the currently filtered dataset to be exported
// Process:
//   Locates the existing export button by ID
//   Clones the button to remove any previously attached listeners (avoids multiple triggers)
//   Replaces the old button with the clean clone
//   Attaches a new click listener that dynamically imports export.js and calls setupExport(filtered)
// Output: Replaces and rebinds the export button with a fresh listener
// Error Handling: Catches DOM or import failures and delegates to handleError() with context "setupExportButton"
// Logging: Uses logAction() to trace setup and filtered data
/**
 * Prepares the export button to trigger data export using the current filtered dataset.
 * Ensures the export button is cleanly wired by removing and re-attaching the listener.
 * * @param {Array} filtered - The currently filtered dataset to be exported.
 */
export function setupExportButton(filtered) {
    // Log the initiation of the setup
    logActivity("info", "setupExportButton initiated", { filteredCount: filtered.length });
    
    // Use a clean DOM query reference
    const oldButton = document.getElementById("exportButton");
    
    // Safety check: If button doesn't exist, exit cleanly.
    if (!oldButton) return;

    // 1. Clone the button to remove any previously attached listeners.
    const newButton = oldButton.cloneNode(true); // NOTE: cloneNode(true) copies children too (if any text/icons are inside)
    
    // 2. Replace the old button with the clean clone in the DOM.
    oldButton.replaceWith(newButton);
    
    // 3. Attach a fresh click listener using dynamic import for efficiency.
    newButton.addEventListener("click", () => {
        // Log the action when the user clicks
        logActivity("action", "exportButtonClicked", { count: filtered.length });
        
        // Dynamically import the export function and call it
        import('./export.js').then(({ setupExport }) => {
            setupExport(filtered);
        })
        .catch(error => {
            // This .catch() handles failures specific to the dynamic import or setupExport call
            errorHandler(error, "Export failed during button click");
        });
    });
}


// shouldIncludeEvent() - Filtering Logic
// Determines whether a single event matches the current filter criteria.
// Accepts an event object and filter values
// Applies keyword matching, field-specific filters, and toggle logic
// Handles special cases like "__none__" platform and challenge mode overrides
// Returns true or false
// Logs the action and handles errors via handleError
/**
 * Determines whether a single event matches the current filter criteria.
 * @param {Object} event - The single event object to check.
 * @param {Object} values - The structured object of current filter values.
 * @returns {boolean} True if the event should be included, false otherwise.
 */
function shouldIncludeEvent(event, values) {
  const { 
      search, watched, format, classification, platform, 
      eventYear, period, pinned, hideWatched, hidePinned, challengeMode 
  } = values;
  const { filters, keywords } = search;

  // --- Prepare Normalized Event Values ---
  // Join all object values into one string for keyword search
  const text = Object.values(event).join(" ").toLowerCase(); 
  const watchedValue = (event.Watched || "").trim().toLowerCase();
  const eventClassification = (event.Classification || "").toLowerCase();
  const eventPeriod = (event.Period || "").toLowerCase();
  const eventPlatform = (event.Platform || "").toLowerCase();
  const eventYearStr = String(event.EventYear || "").trim();
  const eventFormat = (event.Format || "").toLowerCase();
  const isPinnedStatus = isPinned(event.RecordID);
  
  // --- FAIL FAST: Toggles (Highest Priority Exclusions) ---

  // 1. Challenge Mode (Overrides all other toggles/filters related to Watched/Pinned)
  if (challengeMode && (watchedValue === "yes" || isPinnedStatus)) return false;
  
  // 2. Hide Toggles
  if (hidePinned && isPinnedStatus) return false; 
  if (hideWatched && watchedValue === "yes") return false;
  
  // --- Keyword Search ---
  // Must match ALL keywords if any are present
  if (keywords.length && !keywords.every(k => text.includes(k))) return false;

  // --- Dropdown Filters (Must match EXACTLY) ---

  // Format Filter
  if (format && eventFormat !== format.toLowerCase()) return false;

  // Classification Filter
  if (classification && eventClassification !== classification.toLowerCase()) return false;
  
  // Period Filter
  if (period && eventPeriod !== period.toLowerCase()) return false;
  
  // Event Year Filter
  if (eventYear && eventYearStr !== eventYear.trim()) return false;

  // Watched Filter (Dropdown)
  if (watched === "Yes" && watchedValue !== "yes") return false;
  if (watched === "No" && watchedValue === "yes") return false;
  
  // Pinned Filter (Dropdown)
  if (pinned === "Yes" && !isPinnedStatus) return false;
  if (pinned === "No" && isPinnedStatus) return false;
  
  // Platform Filter (Special "__none__" case)
  if (platform === "__none__") {
      if (eventPlatform) return false; // Fail if platform exists when filtering for none
  } else if (platform && !eventPlatform.includes(platform)) return false; // Fail if selected platform isn't included

  // --- Search Term Filters (field:value) ---
  // These use 'includes' for partial matches as per your original logic

  if (filters.title && !(event.Title || "").toLowerCase().includes(filters.title)) return false;
  if (filters.platform && !eventPlatform.includes(filters.platform)) return false;
  if (filters.classification && !eventClassification.includes(filters.classification)) return false;
  if (filters.period && !eventPeriod.includes(filters.period)) return false;
  
  // Watched Search Filter
  if (filters.watched === "yes" && watchedValue !== "yes") return false;
  if (filters.watched === "no" && watchedValue === "yes") return false;
  
  // Event Year Search Filter (Using exact match for year, like dropdown)
  if (filters.year && eventYearStr !== filters.year.trim()) return false;
  
  // --- All checks passed ---
  return true;
}
// applyFilters() - Filtering Logic
// Executes the full filtering pipeline and updates the UI.
// Retrieves current filter state via getFilterValues()
// Filters dataset using shouldIncludeEvent()
// Updates count display
// Renders timeline and stats
// Reinitializes export button with filtered data
// Logs the action and handles errors via handleError
export function applyFilters() {
    logActivity("action", "applyFilters initiated", { datasetCount: dataset.length });

    // R1: Safety Check - Ensure global data is available before proceeding.
    if (!Array.isArray(dataset) || dataset.length === 0) {
        logActivity("info", "applyFilters", { reason: "Cannot filter, dataset is empty." });
        renderTimeline([]);
        updateStats([], 0);
        return;
    }
    
    try {
        const filterValues = getFilterValues(); // Assumed to be clean, synchronous
        const totalEvents = dataset.length;
        
        // 2. Filtering Logic
        const filtered = dataset.filter(event => shouldIncludeEvent(event, filterValues));
        
        // 3. UI Updates
        const countDisplay = document.getElementById("filterCount");
        if (countDisplay) {
            countDisplay.textContent = `Showing ${filtered.length} of ${dataset.length} record${dataset.length !== 1 ? "s" : ""}`;
        }
        
        console.log("Number of results:", filtered.length);
        
        renderTimeline(filtered);
        updateStats(filtered, totalEvents);
        setupExportButton(filtered);

    } catch (error) {
        errorHandler(error, "applyFilters - Unexpected error during filtering pipeline.");        
        // Stop execution here; do not re-throw, as this function is primarily an event listener callback.
    }
}

// Event Wiring
// Filter & Toggle Listeners
// Each dropdown and toggle is wired to re-run applyFilters(dataset) on change.
// Ensures real-time filtering as user interacts
// Includes searchInput for live keyword filtering
// clearFilters resets all filters and toggles, then re-applies filters
formatFilter.addEventListener("change", () => applyFilters(dataset));
classificationFilter.addEventListener("change", () => applyFilters(dataset));
platformFilter.addEventListener("change", () => applyFilters(dataset));
eventYearFilter.addEventListener("change", () => applyFilters(dataset));
periodFilter.addEventListener("change", () => applyFilters(dataset));
watchedFilter.addEventListener("change", () => applyFilters(dataset));
pinnedFilter.addEventListener("change", () => applyFilters(dataset));
hideWatchedToggle?.addEventListener("change", () => applyFilters(dataset));
hidePinnedToggle?.addEventListener("change", () => applyFilters(dataset));
challengeModeToggle?.addEventListener("change", () => applyFilters(dataset));
searchInput.addEventListener("input", () => applyFilters(dataset));

clearFilters.addEventListener("click", () => {
  // Reset Dropdowns and Search
  watchedFilter.value = "";
  formatFilter.value = "";
  classificationFilter.value = "";
  platformFilter.value = "";
  eventYearFilter.value = "";
  periodFilter.value = "";
  searchInput.value = "";
  pinnedFilter.value = "";

  // Reset Toggles
  hideWatchedToggle.checked = false;
  hidePinnedToggle.checked = false; 
  challengeModeToggle.checked = false;

  applyFilters(dataset);


});
