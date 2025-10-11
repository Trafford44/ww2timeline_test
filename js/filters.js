import { renderTimeline } from './timeline.js';
import { updateStats } from './stats.js';
import { fetchAndRenderData } from './data.js';

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
  [searchInput, watchedFilter, formatFilter, classificationFilter, platformFilter, eventYearFilter, periodFilter, pinnedFilter, clearFilters].forEach(el => {
    el.disabled = !enable;
  });
}

export function populateDropdowns(fullData) {
  const formats = [...new Set(fullData.map(f => f.Format).filter(Boolean))].sort();
  const classifications = [...new Set(fullData.map(f => f.Classification).filter(Boolean))].sort();
  /* const platforms = [...new Set(fullData.flatMap(f => f.WatchOn?.split(',').map(p => p.trim()) || []))].sort(); */
  const eventYears = [...new Set(fullData.map(f => f.EventYear).filter(Boolean))].sort();
  const periods = [...new Set(fullData.map(f => f.Period).filter(Boolean))].sort();
  const platforms = [...new Set(
    fullData
      .flatMap(f => 
        (f.WatchOn || "")
          .replace(/^,+|,+$/g, "") // remove leading/trailing commas
          .split(',')
          .map(p => p.trim().toLowerCase()) // normalize here
      )
      .filter(p => p) // remove empty strings
  )].sort();

  formatFilter.innerHTML = '<option value="">Format: All</option>' + formats.map(f => `<option value="${f}">${f}</option>`).join("");
  classificationFilter.innerHTML = '<option value="">Classification: All</option>' + classifications.map(c => `<option value="${c}">${c}</option>`).join("");
  /* platformFilter.innerHTML = '<option value="">Platform/s: All</option>' + platforms.map(p => `<option value="${p}">${p}</option>`).join(""); */
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

  const newButton = oldButton.cloneNode(false); // clone without children or listeners
  newButton.innerHTML = oldButton.innerHTML;    // preserve visual content
  oldButton.replaceWith(newButton);


newButton.addEventListener("click", () => {
  import('./export.js').then(({ setupExport }) => {
    setupExport(filtered);
  });
});

}

import { dataset } from './data.js';

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
  
    // Keyword search
    if (keywords.length && !keywords.every(k => text.includes(k.toLowerCase()))) return false;
  
    // Title match
    if (filters.title && !(film.FilmTitle || "").toLowerCase().includes(filters.title.toLowerCase())) return false;
  
    // Platform match
    if (platform === "__none__") {
      if (film.WatchOn) return false;
      return true;
    }
    if (platform && platform !== "__none__" && !(film.WatchOn || "").toLowerCase().includes(platform.toLowerCase())) return false;

  
    // Classification match
    if (filters.classification && !(film.Classification || "").toLowerCase().includes(filters.classification.toLowerCase())) return false;
    if (classification && (film.Classification || "").toLowerCase() !== classification.toLowerCase()) return false;
  
    // Period match
    if (filters.period && !(film.Period || "").toLowerCase().includes(filters.period.toLowerCase())) return false;
    if (period && (film.Period || "").toLowerCase() !== period.toLowerCase()) return false;
  
    // Year match
    if (filters.year && String(film.EventYear || "").trim() !== filters.year.trim()) return false;
    if (eventYear && String(film.EventYear || "").trim() !== eventYear.trim()) return false;
  
    // Watched match
    const watchedValue = String(film.Watched || "").trim().toLowerCase();
    
    // Search query filter
    if (filters.watched === "yes" && watchedValue !== "yes") return false;
    if (filters.watched === "no" && watchedValue === "yes") return false;
    
    // Dropdown filter
    if (watched === "Yes" && watchedValue !== "yes") return false;
    if (watched === "No" && watchedValue === "yes") return false;


    // Format match
    if (format && (film.Format || "").toLowerCase() !== format.toLowerCase()) return false;
  
    const isPinned = Boolean(film.Pinned);
    
    if (pinned === "Yes" && !isPinned) return false;
    if (pinned === "No" && isPinned) return false;
    if (hidePinned && isPinned) return false;
    if (challengeMode && (film.Watched === "Yes" || isPinned)) return false;
  
    // Hide watched
    if (hideWatched && film.Watched === "Yes") return false;
  
    return true;
  });

  const countDisplay = document.getElementById("filterCount");
  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} of ${dataset.length} record${dataset.length !== 1 ? "s" : ""}`;
  }
  
  console.log("Filtered results:", filtered);
  console.log("Number of results:", filtered.length);
  /* document.body.innerHTML = `<pre>${JSON.stringify(filtered, null, 2)}</pre>`;*/ 
  
  renderTimeline(filtered);
  updateStats(filtered);
  setupExportButton(filtered);
  /*
  if (features.enableExport) {
    const exportButton = document.getElementById("exportButton");
    if (exportButton) {
      exportButton.style.display = filtered.length > 0 ? 'inline-block' : 'none';
    }
    setupExportButton(filtered); // always exports what’s displayed
  } else {
    const exportPanel = document.querySelector('.export-button-panel');
    if (exportPanel) {
      exportPanel.style.display = 'none';
    }
  }
  */

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

const clearButton = document.getElementById("clearFilters");
clearButton.addEventListener("click", () => {
  // Reset all filter inputs
  watchedFilter.value = "";
  formatFilter.value = "";
  classificationFilter.value = "";
  platformFilter.value = "";
  eventYearFilter.value = "";
  periodFilter.value = "";
  searchInput.value = "";
  pinnedFilter.value = "";

  // Reset toggles if you have them
  hideWatchedToggle.checked = false;
  challengeModeToggle.checked = false;

  // Reapply filters with default state
  applyFilters(dataset);
});
