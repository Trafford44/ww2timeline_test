import { renderTimeline } from './timeline.js';
import { updateStats } from './stats.js';
import { dataset } from './data.js';
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

export function toggleControls(enable) {
  [
    searchInput, watchedFilter, formatFilter, classificationFilter,
    platformFilter, eventYearFilter, periodFilter, pinnedFilter, clearFilters
  ].forEach(el => el.disabled = !enable);
}

// --- 2. Dropdown Population ---
export function populateDropdowns(fullData) {
  const formats = [...new Set(fullData.map(f => f.Format).filter(Boolean))].sort();
  const classifications = [...new Set(fullData.map(f => f.Classification).filter(Boolean))].sort();
  const eventYears = [...new Set(fullData.map(f => f.EventYear).filter(Boolean))].sort();
  const periods = [...new Set(fullData.map(f => f.Period).filter(Boolean))].sort();
  const platforms = [...new Set(
    fullData
      .flatMap(f => (f.WatchOn || "")
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
}

// --- 3. Search Query Parsing ---
export function parseSearchQuery(query) {
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
      setupExport(filtered);
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
function shouldIncludeFilm(film, values) {
  const { search, watched, format, classification, platform, eventYear, period, pinned, hideWatched, hidePinned, challengeMode } = values;
  const { filters, keywords } = search;
  
  const text = Object.values(film).join(" ").toLowerCase();
  const watchedValue = (film.Watched || "").trim().toLowerCase();
  const isPinnedStatus = isPinned(film.RecordID); 

  // Keyword search
  if (keywords.length && !keywords.every(k => text.includes(k))) return false;

  // Search Filters (field:value)
  if (filters.title && !(film.FilmTitle || "").toLowerCase().includes(filters.title)) return false;
  
  // Platform Filter
  if (platform === "__none__") {
    if (film.WatchOn) return false;
    // If platform is "__none__" and WatchOn is empty, it passes.
  } else if (platform && !(film.WatchOn || "").toLowerCase().includes(platform)) return false;

  // Classification Filter (Dropdown and Search)
  if (filters.classification && !(film.Classification || "").toLowerCase().includes(filters.classification)) return false;
  if (classification && (film.Classification || "").toLowerCase() !== classification.toLowerCase()) return false;

  // Period Filter (Dropdown and Search)
  if (filters.period && !(film.Period || "").toLowerCase().includes(filters.period)) return false;
  if (period && (film.Period || "").toLowerCase() !== period.toLowerCase()) return false;

  // Event Year Filter (Dropdown and Search)
  if (filters.year && String(film.EventYear || "").trim() !== filters.year.trim()) return false;
  if (eventYear && String(film.EventYear || "").trim() !== eventYear.trim()) return false;

  // Watched Filter (Dropdown and Search)
  if (filters.watched === "yes" && watchedValue !== "yes") return false;
  if (filters.watched === "no" && watchedValue === "yes") return false;
  if (watched === "Yes" && watchedValue !== "yes") return false;
  if (watched === "No" && watchedValue === "yes") return false;

  // Format Filter
  if (format && (film.Format || "").toLowerCase() !== format.toLowerCase()) return false;

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
export function applyFilters(data) {
  const filterValues = getFilterValues();

  const filtered = dataset.filter(film => shouldIncludeFilm(film, filterValues));

  const countDisplay = document.getElementById("filterCount");
  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} of ${dataset.length} record${dataset.length !== 1 ? "s" : ""}`;
  }

  console.log("Filtered results:", filtered);
  console.log("Number of results:", filtered.length);

  renderTimeline(filtered);
  updateStats(filtered);
  setupExportButton(filtered);
}

// --- 8. Event Wiring ---
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
