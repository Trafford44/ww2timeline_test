import { renderTimeline } from './timeline.js';
import { updateStats } from './stats.js';
import { dataset } from './data.js'; // Assumed to be the full dataset
import { isPinned } from './pinnedManager.js';

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

// --- Global State to store configuration ---
let globalDomain = {};

export function toggleControls(enable) {
  [
    searchInput, watchedFilter, formatFilter, classificationFilter,
    platformFilter, eventYearFilter, periodFilter, pinnedFilter, clearFilters
  ].forEach(el => el.disabled = !enable);
}

// --- 2. Dropdown Population ---
export function populateDropdowns(fullData, domain) {
  const fm = domain.fieldMap;
  const labels = domain.labels;
  
  // NOTE: Format and EventYear are currently hardcoded keys in the data, 
  // as they are not explicitly mapped in the config provided.
  // We use them directly here but map others via fieldMap (fm).
  
  const formats = [...new Set(fullData.map(f => f.Format).filter(Boolean))].sort();
  const classifications = [...new Set(fullData.map(f => f[fm.classification]).filter(Boolean))].sort();
  // Assuming EventYear is used for the filter, not ReleaseYear (fm.year)
  const eventYears = [...new Set(fullData.map(f => f.EventYear).filter(Boolean))].sort();
  const periods = [...new Set(fullData.map(f => f[fm.period]).filter(Boolean))].sort();
  
  const platforms = [...new Set(
    fullData
      .flatMap(f => (f[fm.platform] || "") // Use fm.platform: "WatchOn"
        .replace(/^,+|,+$/g, "")
        .split(',')
        .map(p => p.trim().toLowerCase()))
      .filter(p => p)
  )].sort();

  // Update dropdown labels using domain.labels
  formatFilter.innerHTML = '<option value="">Format: All</option>' + formats.map(f => `<option value="${f}">${f}</option>`).join("");
  classificationFilter.innerHTML = `<option value="">${labels.classificationLabel || 'Classification'}: All</option>` + classifications.map(c => `<option value="${c}">${c}</option>`).join("");
  platformFilter.innerHTML = `
    <option value="">${labels.platformLabel || 'Platform/s'}: All</option>
    <option value="__none__">(none assigned)</option>
    ${platforms.map(p => {
      const sentenceCase = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
      return `<option value="${p}">${sentenceCase}</option>`;
    }).join("")}
  `;
  eventYearFilter.innerHTML = '<option value="">Event Year: All</option>' + eventYears.map(y => `<option value="${y}">${y}</option>`).join("");
  periodFilter.innerHTML = `<option value="">${labels.periodLabel || 'Period'}: All</option>` + periods.map(p => `<option value="${p}">${p}</option>`).join("");
}

// --- 3. Search Query Parsing ---
export function parseSearchQuery(query) {
  const terms = query.toLowerCase().split(/\s+/);
  const filters = {};
  const keywords = [];
  // NOTE: The fields here (title, platform, etc.) are GENERIC internal names, which is correct.
  terms.forEach(term => {
    const [field, value] = term.split(":");
    if (value && ["title", "platform", "classification", "period", "year", "watched"].includes(field)) {
      filters[field] = value;
    } else {
      keywords.push(term);
    }
  });
  return { filters, keywords };
}

// --- 4. Export Setup (External Dependency) ---
export function setupExportButton(filtered) {
  const oldButton = document.getElementById("exportButton");
  if (!oldButton) return;

  const newButton = oldButton.cloneNode(false);
  newButton.innerHTML = oldButton.innerHTML;
  oldButton.replaceWith(newButton);

  newButton.addEventListener("click", () => {
    import('./export.js').then(({ setupExport }) => {
      // Pass the domain configuration to the export function
      setupExport(filtered, globalDomain);
    });
  });
}

// --- 5. Filter State Abstraction (New Module) ---
function getFilterValues() {
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
}

// --- 6. Core Filtering Logic (New Module) ---
function shouldIncludeEvent(event, values, domain) {
  const fm = domain.fieldMap;
  const { search, watched, format, classification, platform, eventYear, period, pinned, hideWatched, hidePinned, challengeMode } = values;
  const { filters, keywords } = search;
  
  // Check if we have the necessary fields before using them
  const watchedKey = fm.watched || 'Watched'; // Fallback for safety
  const titleKey = fm.title || 'FilmTitle';
  const platformKey = fm.platform || 'WatchOn';
  const classificationKey = fm.classification || 'Classification';
  const periodKey = fm.period || 'Period';
  const eventYearKey = 'EventYear'; // Hardcoded fallback
  const formatKey = 'Format'; // Hardcoded fallback

  const text = Object.values(event).join(" ").toLowerCase();
  const watchedValue = (event[watchedKey] || "").trim().toLowerCase();
  const isPinnedStatus = isPinned(event.RecordID); 

  // Keyword search
  if (keywords.length && !keywords.every(k => text.includes(k))) return false;

  // Search Filters (field:value)
  // Use the mapped field for Title search
  if (filters.title && !(event[titleKey] || "").toLowerCase().includes(filters.title)) return false;
  
  // Platform Filter
  if (platform === "__none__") {
    if (event[platformKey]) return false;
    // If platform is "__none__" and mapped platform field is empty, it passes.
  } else if (platform && !(event[platformKey] || "").toLowerCase().includes(platform)) return false;

  // Classification Filter (Dropdown and Search)
  if (filters.classification && !(event[classificationKey] || "").toLowerCase().includes(filters.classification)) return false;
  if (classification && (event[classificationKey] || "").toLowerCase() !== classification.toLowerCase()) return false;

  // Period Filter (Dropdown and Search)
  if (filters.period && !(event[periodKey] || "").toLowerCase().includes(filters.period)) return false;
  if (period && (event[periodKey] || "").toLowerCase() !== period.toLowerCase()) return false;

  // Event Year Filter (Dropdown and Search)
  if (filters.year && String(event[eventYearKey] || "").trim() !== filters.year.trim()) return false;
  if (eventYear && String(event[eventYearKey] || "").trim() !== eventYear.trim()) return false;

  // Watched Filter (Dropdown and Search)
  if (filters.watched === "yes" && watchedValue !== "yes") return false;
  if (filters.watched === "no" && watchedValue === "yes") return false;
  if (watched === "Yes" && watchedValue !== "yes") return false;
  if (watched === "No" && watchedValue === "yes") return false;

  // Format Filter
  if (format && (event[formatKey] || "").toLowerCase() !== format.toLowerCase()) return false;

  // Pinned Filter (Dropdown)
  if (pinned === "Yes" && !isPinnedStatus) return false;
  if (pinned === "No" && isPinnedStatus) return false;
  
  // Options Toggles
  if (hidePinned && isPinnedStatus) return false; 
  if (hideWatched && watchedValue === "yes") return false;
  
  // Challenge Mode (Overrides other Toggles)
  if (challengeMode && (watchedValue === "yes" || isPinnedStatus)) return false;

  return true;
}

// --- 7. Main Filter Execution ---
// This function stores the domain and then applies filters using the stored domain.
export function applyFilters(data, domain) {
  // Store domain on initial call from main.js
  if (domain) globalDomain = domain;

  // Determine which data to filter (passed data on init, or imported dataset on user events)
  const dataToFilter = data || dataset;

  const filterValues = getFilterValues();

  // Use the stored global domain for filtering
  const filtered = dataToFilter.filter(event => shouldIncludeEvent(event, filterValues, globalDomain));

  const countDisplay = document.getElementById("filterCount");
  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} of ${dataToFilter.length} record${dataToFilter.length !== 1 ? "s" : ""}`;
  }

  console.log("Filtered results:", filtered);
  console.log("Number of results:", filtered.length);

  // Pass the domain configuration to the rendering and stats modules
  renderTimeline(filtered, globalDomain);
  updateStats(filtered, globalDomain);
  setupExportButton(filtered); // setupExportButton now uses globalDomain internally

  return filtered;
}

// --- 8. Event Wiring ---
// Event listeners now call applyFilters(dataset) which uses the stored globalDomain
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
