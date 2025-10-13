import { renderTimeline } from './timeline.js';
import { updateStats } from './stats.js';
import { dataset } from './data.js';
import { isPinned } from './pinnedManager.js'; // CRITICAL: Import the function to check localStorage

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

export function applyFilters(data) {
  const { filters, keywords } = parseSearchQuery(searchInput.value.trim());
  const watched = watchedFilter.value;
  const format = formatFilter.value;
  const classification = classificationFilter.value;
  const platform = platformFilter.value;
  const eventYear = eventYearFilter.value;
  const period = periodFilter.value;
  const pinned = pinnedFilter.value;
  const hideWatched = hideWatchedToggle?.checked;
  const hidePinned = hidePinnedToggle?.checked;
  const challengeMode = challengeModeToggle?.checked;

  const filtered = dataset.filter(film => {
    const text = Object.values(film).join(" ").toLowerCase();
    const watchedValue = (film.Watched || "").trim().toLowerCase();
    
    // CRITICAL FIX: Use the external isPinned function to check localStorage
    const isPinnedStatus = isPinned(film.RecordID); 

    if (keywords.length && !keywords.every(k => text.includes(k))) return false;
    if (filters.title && !(film.FilmTitle || "").toLowerCase().includes(filters.title)) return false;

    if (platform === "__none__") {
      if (film.WatchOn) return false;
      return true;
    }
    if (platform && !(film.WatchOn || "").toLowerCase().includes(platform)) return false;

    if (filters.classification && !(film.Classification || "").toLowerCase().includes(filters.classification)) return false;
    if (classification && (film.Classification || "").toLowerCase() !== classification.toLowerCase()) return false;

    if (filters.period && !(film.Period || "").toLowerCase().includes(filters.period)) return false;
    if (period && (film.Period || "").toLowerCase() !== period.toLowerCase()) return false;

    if (filters.year && String(film.EventYear || "").trim() !== filters.year.trim()) return false;
    if (eventYear && String(film.EventYear || "").trim() !== eventYear.trim()) return false;

    if (filters.watched === "yes" && watchedValue !== "yes") return false;
    if (filters.watched === "no" && watchedValue === "yes") return false;
    if (watched === "Yes" && watchedValue !== "yes") return false;
    if (watched === "No" && watchedValue === "yes") return false;

    if (format && (film.Format || "").toLowerCase() !== format.toLowerCase()) return false;

    // Use the reliable isPinnedStatus variable for all pin checks
    if (pinned === "Yes" && !isPinnedStatus) return false;
    if (pinned === "No" && isPinnedStatus) return false;
    
    // This is the filter for the 'Hide Pinned Films' toggle
    if (hidePinned && isPinnedStatus) return false; 
    
    // Update Challenge Mode check to use the reliable status
    if (challengeMode && (watchedValue === "yes" || isPinnedStatus)) return false;
    
    if (hideWatched && watchedValue === "yes") return false;

    return true;
  });

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
  watchedFilter.value = "";
  formatFilter.value = "";
  classificationFilter.value = "";
  platformFilter.value = "";
  eventYearFilter.value = "";
  periodFilter.value = "";
  searchInput.value = "";
  pinnedFilter.value = "";

  hideWatchedToggle.checked = false;
  hidePinnedToggle.checked = false; // CRITICAL: Reset the hide pinned toggle
  challengeModeToggle.checked = false;

  applyFilters(dataset);
});
