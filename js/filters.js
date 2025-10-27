import { renderTimeline } from './timeline.js';
import { updateStats } from './stats.js';
import { dataset } from './data.js';
import { isPinned } from './pinnedManager.js';
import { logActivity } from './alerts/logger.js';
import { errorHandler } from './alerts/errorUtils.js';

// --- 1. DOM Element References ---
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

// toggleControls() - UI Control & Dropdown Setup
// Enables or disables all filter controls and the clear button.
// Accepts a boolean enable
// Applies .disabled = true/false to all relevant UI elements
// Logs the action and handles errors via handleError
export function toggleControls(enable) {
  logActivity("info", "toggleControls", { enable });
  try {
    [
      searchInput, watchedFilter, formatFilter, classificationFilter,
      platformFilter, eventYearFilter, periodFilter, pinnedFilter, clearFilters
    ].forEach(el => el.disabled = !enable);
  } catch (error) {
    errorHandler(error, "toggleControls");
  }      
}

// populateDropdowns() - UI Control & Dropdown Setup
// Extracts unique values from fullData and populates dropdown filters.
// Derives sorted lists for Format, Classification, EventYear, Period, and Platform
// Normalizes platform values (trimming, lowercasing, deduplicating)
// Injects <option> elements into corresponding <select> elements
// Logs the action and handles errors via handleError
export function populateDropdowns(fullData) {

  logActivity("info", "populateDropdowns", { fullData });
  try {
      const formats = [...new Set(fullData.map(f => f.Format).filter(Boolean))].sort();
      const classifications = [...new Set(fullData.map(f => f.Classification).filter(Boolean))].sort();
      const eventYears = [...new Set(fullData.map(f => f.EventYear).filter(Boolean))].sort();
      const periods = [...new Set(fullData.map(f => f.Period).filter(Boolean))].sort();
      const platforms = [...new Set(
        fullData
          .flatMap(f => (f.Platform || "")
            .replace(/^,+|,+$/g, "")
            .split(',')
            .map(p => p.trim().toLowerCase()))
          .filter(p => p)
      )].sort();
    
      formatFilter.innerHTML = '<option value="">Format: All</option>' + formats.map(f => `<option value="${f}">${f}</option>`).join("");
      classificationFilter.innerHTML = '<option value="">Classification: All</option>' + classifications.map(c => `<option value="${c}">${c}</option>`).join("");
      platformFilter.innerHTML = `
        <option value="">Platform/s: All</option>
        <option value="__none__">(none assigned)</option>
        ${platforms.map(p => {
          const sentenceCase = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
          return `<option value="${p}">${sentenceCase}</option>`;
        }).join("")}
      `;
      eventYearFilter.innerHTML = '<option value="">Event Year: All</option>' + eventYears.map(y => `<option value="${y}">${y}</option>`).join("");
      periodFilter.innerHTML = '<option value="">Period: All</option>' + periods.map(p => `<option value="${p}">${p}</option>`).join("");
  } catch (error) {
    errorHandler(error, "populateDropdowns");
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
  logActivity("info", "parseSearchQuery", { query });
  try {  
    const terms = query.toLowerCase().split(/\s+/);
    const filters = {};
    const keywords = [];
    terms.forEach(term => {
      const [field, value] = term.split(":");
      if (value && ["title", "platform", "classification", "period", "year", "watched"].includes(field)) {
        filters[field] = value;
      } else {
        keywords.push(term);
      }
    });
    return { filters, keywords };

  } catch (error) {
    errorHandler(error, "parseSearchQuery");
  }    
}

// getFilterValues() - Search & Filter Parsing
// Captures the current state of all filters and toggles.
// Reads values from dropdowns, toggles, and search input
// Parses search input using parseSearchQuery()
// Returns a structured object of filter values
// Logs the action and handles errors via handleError
function getFilterValues() {
  logActivity("info", "getFilterValues");
  try {     
    return {
      search: parseSearchQuery(searchInput.value.trim()),
      watched: watchedFilter.value,
      format: formatFilter.value,
      classification: classificationFilter.value,
      platform: platformFilter.value,
      eventYear: eventYearFilter.value,
      period: periodFilter.value,
      pinned: pinnedFilter.value,
      hideWatched: hideWatchedToggle?.checked,
      hidePinned: hidePinnedToggle?.checked,
      challengeMode: challengeModeToggle?.checked
    };
  } catch (error) {
    errorHandler(error, "getFilterValues");
  }     
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
export function setupExportButton(filtered) {
  logActivity("info", "setupExportButton", { filtered });
  try {    
      const oldButton = document.getElementById("exportButton");
      if (!oldButton) return;
    
      // create a new button in case of ending up with 
      // attach multiple listeners, causing the export function to run several times per click.
      const newButton = oldButton.cloneNode(false);
      newButton.innerHTML = oldButton.innerHTML;
      oldButton.replaceWith(newButton);
    
      newButton.addEventListener("click", () => {
        import('./export.js').then(({ setupExport }) => {
          setupExport(filtered);
        });
      });
  } catch (error) {
    errorHandler(error, "setupExportButton");
  }      
}


// shouldIncludeEvent() - Filtering Logic
// Determines whether a single event matches the current filter criteria.
// Accepts an event object and filter values
// Applies keyword matching, field-specific filters, and toggle logic
// Handles special cases like "__none__" platform and challenge mode overrides
// Returns true or false
// Logs the action and handles errors via handleError
function shouldIncludeEvent(event, values) {
  logActivity("info", "shouldIncludeEvent", { event, values });
  try {   
    const { search, watched, format, classification, platform, eventYear, period, pinned, hideWatched, hidePinned, challengeMode } = values;
    const { filters, keywords } = search;
    
    const text = Object.values(event).join(" ").toLowerCase();
    const watchedValue = (event.Watched || "").trim().toLowerCase();
    const isPinnedStatus = isPinned(event.RecordID); 
  
    // Keyword search
    if (keywords.length && !keywords.every(k => text.includes(k))) return false;
  
    // Search Filters (field:value)
    if (filters.title && !(event.Title || "").toLowerCase().includes(filters.title)) return false;
    
    // Platform Filter
    if (platform === "__none__") {
      if (event.Platform) return false;
      // If platform is "__none__" and Platform is empty, it passes.
    } else if (platform && !(event.Platform || "").toLowerCase().includes(platform)) return false;
  
    // Classification Filter (Dropdown and Search)
    if (filters.classification && !(event.Classification || "").toLowerCase().includes(filters.classification)) return false;
    if (classification && (event.Classification || "").toLowerCase() !== classification.toLowerCase()) return false;
  
    // Period Filter (Dropdown and Search)
    if (filters.period && !(event.Period || "").toLowerCase().includes(filters.period)) return false;
    if (period && (event.Period || "").toLowerCase() !== period.toLowerCase()) return false;
  
    // Event Year Filter (Dropdown and Search)
    if (filters.year && String(event.EventYear || "").trim() !== filters.year.trim()) return false;
    if (eventYear && String(event.EventYear || "").trim() !== eventYear.trim()) return false;
  
    // Watched Filter (Dropdown and Search)
    if (filters.watched === "yes" && watchedValue !== "yes") return false;
    if (filters.watched === "no" && watchedValue === "yes") return false;
    if (watched === "Yes" && watchedValue !== "yes") return false;
    if (watched === "No" && watchedValue === "yes") return false;
  
    // Format Filter
    if (format && (event.Format || "").toLowerCase() !== format.toLowerCase()) return false;
  
    // Pinned Filter (Dropdown)
    if (pinned === "Yes" && !isPinnedStatus) return false;
    if (pinned === "No" && isPinnedStatus) return false;
    
    // Options Toggles
    if (hidePinned && isPinnedStatus) return false; 
    if (hideWatched && watchedValue === "yes") return false;
    
    // Challenge Mode (Overrides other Toggles)
    if (challengeMode && (watchedValue === "yes" || isPinnedStatus)) return false;
  
    return true;
  } catch (error) {
    errorHandler(error, "shouldIncludeEvent");
  }     
}

// applyFilters() - Filtering Logic
// Executes the full filtering pipeline and updates the UI.
// Retrieves current filter state via getFilterValues()
// Filters dataset using shouldIncludeEvent()
// Updates count display
// Renders timeline and stats
// Reinitializes export button with filtered data
// Logs the action and handles errors via handleError
export function applyFilters(data) {
  logActivity("info", "applyFilters", { data });
  try {  
    const filterValues = getFilterValues();
    const totalEvents = data.length;  
    const filtered = dataset.filter(event => shouldIncludeEvent(event, filterValues));
  
    const countDisplay = document.getElementById("filterCount");
    if (countDisplay) {
      countDisplay.textContent = `Showing ${filtered.length} of ${dataset.length} record${dataset.length !== 1 ? "s" : ""}`;
    }
  
    //console.log("Filtered results:", filtered);
    console.log("Number of results:", filtered.length);
  
    renderTimeline(filtered);
    updateStats(filtered, totalEvents);
    setupExportButton(filtered);
  } catch (error) {
    errorHandler(error, "applyFilters");
    throw error; //bubble it up   
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
