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
/**
 * Safely accesses and cleans the value from a DOM input element.
 * @param {HTMLInputElement | HTMLSelectElement} el - The DOM element.
 * @returns {string} The trimmed value, or an empty string.
 */
const getDomValue = (el) => el?.value?.trim() || "";

/**
 * Enables or disables all filter controls and the clear button.
 * @param {boolean} enable - True to enable, false to disable.
 */
export function toggleControls(enable) {
    logActivity("info", "toggleControls", { enable });
    try {
        [
            searchInput, watchedFilter, formatFilter, classificationFilter,
            platformFilter, eventYearFilter, periodFilter, pinnedFilter, clearFilters
        ].forEach(el => {
            if (el) el.disabled = !enable;
        });
    } catch (error) {
        errorHandler(error, "toggleControls - Failed to update control state");
    }
}

/**
 * Extracts unique values from fullData and populates dropdown filters.
 * @param {Array} fullData - The complete dataset.
 */
export function populateDropdowns(fullData) {
    // R1: Robustness Check - Stop if data is invalid or empty.
    if (!Array.isArray(fullData) || fullData.length === 0) {
        logActivity("warning", "populateDropdowns", { reason: "No data to populate dropdowns." });
        return;
    }

    logActivity("info", "populateDropdowns initiated", { dataCount: fullData.length });
    
    try {
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
            formatFilter.value = ""; // Explicitly set to default
        }   
        if (classificationFilter) {
            classificationFilter.innerHTML = `<option value="">Classification: All</option>` + createOptions(classifications);
            classificationFilter.value = ""; // Explicitly set to default
        }   
        if (eventYearFilter) {
            eventYearFilter.innerHTML = `<option value="">Event Year: All</option>` + createOptions(eventYears);
            eventYearFilter.value = ""; // Explicitly set to default
        }   
        if (periodFilter) {
            periodFilter.innerHTML = `<option value="">Period: All</option>` + createOptions(periods);
            periodFilter.value = ""; // Explicitly set to default
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
            platformFilter.value = ""; // Explicitly set to default
        }
        // CRITICAL FIX: Ensure the watched filter is explicitly set to the empty string
        if (watchedFilter) watchedFilter.value = "";
        
    } catch (error) {
        errorHandler(error, "populateDropdowns - Failed to populate dropdown menus");
    }
}

/**
 * Parses a free-text search query into structured filters and keywords.
 * @param {string} query - The raw search query string.
 * @returns {{filters: Object<string, string>, keywords: string[]}}
 */
export function parseSearchQuery(query) {
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

/**
 * Captures the current state of all filters and toggles.
 * @returns {Object} A structured object of current filter values.
 */
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
        
        // Use optional chaining for toggles
        hideWatched: hideWatchedToggle?.checked || false,
        hidePinned: hidePinnedToggle?.checked || false,
        challengeMode: challengeModeToggle?.checked || false
    };
}

/**
 * Prepares the export button to trigger data export using the current filtered dataset.
 * Ensures the export button is cleanly wired by removing and re-attaching the listener.
 * @param {Array} filtered - The currently filtered dataset to be exported.
 */
export function setupExportButton(filtered) {
    try {
        logActivity("info", "setupExportButton initiated", { filteredCount: filtered.length });
        
        const oldButton = document.getElementById("exportButton");
        
        // Safety check: If button doesn't exist, exit cleanly.
        if (!oldButton) return;

        // 1. Clone the button to remove any previously attached listeners.
        const newButton = oldButton.cloneNode(true);
        
        // 2. Replace the old button with the clean clone in the DOM.
        oldButton.replaceWith(newButton);
        
        // 3. Attach a fresh click listener using dynamic import for efficiency.
        newButton.addEventListener("click", () => {
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
    } catch (error) {
        errorHandler(error, "setupExportButton - Failed to setup export button listener");
    }
}


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

    // Watched Filter (Dropdown) - Logic remains robust: "" = All, "Yes", "No"
    // Case 1: Filter is set to 'Yes'
    if (watched === "Yes") {
        if (watchedValue !== "yes") return false;
    } 
    // Case 2: Filter is set to 'No'
    else if (watched === "No") {
        // Only reject events that ARE watched. This correctly includes "" (Not Watched) and "no" (Future Not Watched)
        if (watchedValue === "yes") return false;
    }
    // Case 3 (Implicit): Filter is "" (All), so we skip filtering.
    
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

/**
 * Executes the full filtering pipeline and updates the UI.
 */
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
        const filterValues = getFilterValues();
        const totalEvents = dataset.length;
        
        // TEMPORARY DEBUG: Log the filter value to confirm initial state
        console.log("DEBUG: Current Watched Filter Value:", filterValues.watched);

        // 2. Filtering Logic
        const filtered = dataset.filter(event => shouldIncludeEvent(event, filterValues));
        
        // 3. UI Updates
        const countDisplay = document.getElementById("filterCount");
        if (countDisplay) {
            countDisplay.textContent = `Showing ${filtered.length} of ${dataset.length} event${dataset.length !== 1 ? "s" : ""}`;
        }
        
        console.log("Number of results:", filtered.length); 
        
        renderTimeline(filtered);
        updateStats(filtered, totalEvents);
        setupExportButton(filtered);

    } catch (error) {
        errorHandler(error, "applyFilters - Unexpected error during filtering pipeline.");         
    }
}

/**
 * Resets all filter values (dropdowns, search, toggles) to their default states
 * and reapplies filters.
 */
export function resetFilters() {
    // Reset Dropdowns and Search
    if (watchedFilter) watchedFilter.value = "";
    if (formatFilter) formatFilter.value = "";
    if (classificationFilter) classificationFilter.value = "";
    if (platformFilter) platformFilter.value = "";
    if (eventYearFilter) eventYearFilter.value = "";
    if (periodFilter) periodFilter.value = "";
    if (searchInput) searchInput.value = "";
    if (pinnedFilter) pinnedFilter.value = "";

    // Reset Toggles
    if (hideWatchedToggle) hideWatchedToggle.checked = false;
    if (hidePinnedToggle) hidePinnedToggle.checked = false; 
    if (challengeModeToggle) challengeModeToggle.checked = false;

    applyFilters();
}

// Event Wiring
// Filter & Toggle Listeners are now correctly wired to call applyFilters() without arguments.
// This ensures they use the internal, up-to-date 'dataset' and 'getFilterValues()'
if (formatFilter) formatFilter.addEventListener("change", applyFilters);
if (classificationFilter) classificationFilter.addEventListener("change", applyFilters);
if (platformFilter) platformFilter.addEventListener("change", applyFilters);
if (eventYearFilter) eventYearFilter.addEventListener("change", applyFilters);
if (periodFilter) periodFilter.addEventListener("change", applyFilters);
if (watchedFilter) watchedFilter.addEventListener("change", applyFilters);
if (pinnedFilter) pinnedFilter.addEventListener("change", applyFilters);

// Toggles use optional chaining on the element reference check for safety
hideWatchedToggle?.addEventListener("change", applyFilters);
hidePinnedToggle?.addEventListener("change", applyFilters);
challengeModeToggle?.addEventListener("change", applyFilters);

// Search input is debounced for performance (but here we use direct call as per current design)
if (searchInput) searchInput.addEventListener("input", applyFilters);


if (clearFilters) clearFilters.addEventListener("click", resetFilters);


// CRITICAL: Call resetFilters on module load to ensure all filter states are initially set to "" (All)
// This aggressively fixes the initial state issue that 'Clear Filters' solves manually.
resetFilters();
