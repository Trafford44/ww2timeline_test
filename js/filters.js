// js/filters.js - Fully Generic, Corrected Version

import { renderTimeline } from './timeline.js';
import { updateStats } from './stats.js';
import { dataset } from './data.js';
import { isPinned } from './pinnedManager.js';

// --- 1. DOM Element References ---
// (Your existing DOM references here...)

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
export const filterCount = document.getElementById("filterCount");


export function updateFilterStats(filteredCount, totalCount) {
    if (filterCount) {
      filterCount.textContent = `Showing ${filteredCount} of ${totalCount} record${totalCount !== 1 ? "s" : ""}`;
    }
}

// --- 2. Dropdown Population (Updated to be Generic) ---
export function populateDropdowns(fullData, domain) {
    // Helper to get unique, sorted values based on a dynamic field
    const getUniqueValues = (fieldKey) => {
        const fieldName = domain.fieldMap[fieldKey];
        if (!fieldName) return [];
        return [...new Set(fullData.map(f => f[fieldName]).filter(Boolean))].sort();
    };

    // Note: Platforms are complex and still use the hardcoded field name 'WatchOn' 
    // because of the string splitting logic. We will use the generic field if possible.
    const platformKey = domain.fieldMap.platform || "WatchOn";

    const formats = getUniqueValues('format');
    const classifications = getUniqueValues('classification');
    const eventYears = getUniqueValues('year');
    const periods = getUniqueValues('period');

    const platforms = [...new Set(
        fullData
            .flatMap(f => (f[platformKey] || "")
                .replace(/^,+|,+$/g, "")
                .split(',')
                .map(p => p.trim().toLowerCase()))
            .filter(p => p)
    )].sort();

    // The rest of the dropdown population logic remains the same, 
    // just ensure all filter elements are available in the DOM.
    // (Your existing dropdown population logic goes here, using the 'formats', 'classifications', etc. variables)
    
    // --- POPULATION LOGIC GOES HERE (from your original file) ---
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

// --- 3. Filter State Abstraction (Updated for use in updateApp) ---
export function getAppliedFilters() {
  return {
    search: searchInput.value.trim(),
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

// --- 4. Core Filtering Logic (Updated to be Generic) ---
export function applyFilters(data, values, domain) {
  const { search, watched, format, classification, platform, eventYear, period, pinned, hideWatched, hidePinned, challengeMode } = values;
  
  // Use the domain's field map
  const fieldMap = domain.fieldMap;
  const platformKey = fieldMap.platform || "WatchOn";
  const titleKey = fieldMap.title || "FilmTitle";
  const yearKey = fieldMap.year || "ReleaseYear";
  const classificationKey = fieldMap.classification || "Classification";
  const periodKey = fieldMap.period || "Period";
  const watchedKey = fieldMap.watched || "Watched";


  const filtered = data.filter(event => {
    
    const text = Object.values(event).join(" ").toLowerCase();
    const watchedValue = (event[watchedKey] || "").trim().toLowerCase();
    const isPinnedStatus = isPinned(event.RecordID); 

    // Keyword search (simplified to single keywords for stability)
    if (search && !text.includes(search.toLowerCase())) return false;

    // Platform Filter
    if (platform === "__none__" && event[platformKey]) return false;
    if (platform && platform !== "__none__" && !(event[platformKey] || "").toLowerCase().includes(platform.toLowerCase())) return false;

    // Classification Filter
    if (classification && (event[classificationKey] || "").toLowerCase() !== classification.toLowerCase()) return false;

    // Period Filter 
    if (period && (event[periodKey] || "").toLowerCase() !== period.toLowerCase()) return false;

    // Year Filter
    if (eventYear && String(event[yearKey] || "").trim() !== eventYear.trim()) return false;

    // Watched Filter
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
  });

  console.log("Filtered results:", filtered);
  return filtered;
}

// --- 5. Event Wiring (Updated for Generic Structure) ---

/**
 * Attaches event listeners to filters and maps them to the updateApp function.
 * @param {object} domain - The configuration object.
 * @param {function} updateApp - The main application update function (from main.js).
 */
export function setFilterUIListeners(domain, updateApp) {
  const elements = [
    formatFilter, classificationFilter, platformFilter, eventYearFilter, 
    periodFilter, watchedFilter, pinnedFilter
  ].filter(el => el); // filter out null elements

  elements.forEach(el => el.addEventListener("change", updateApp));
  
  if (searchInput) searchInput.addEventListener("input", updateApp);
  if (hideWatchedToggle) hideWatchedToggle.addEventListener("change", updateApp);
  if (hidePinnedToggle) hidePinnedToggle.addEventListener("change", updateApp);
  if (challengeModeToggle) challengeModeToggle.addEventListener("change", updateApp);

  if (clearFilters) {
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
        if (hideWatchedToggle) hideWatchedToggle.checked = false;
        if (hidePinnedToggle) hidePinnedToggle.checked = false; 
        if (challengeModeToggle) challengeModeToggle.checked = false;

        updateApp();
      });
  }
}

export function toggleControls(enable) {
  [
    searchInput, watchedFilter, formatFilter, classificationFilter,
    platformFilter, eventYearFilter, periodFilter, pinnedFilter, clearFilters
  ].forEach(el => el.disabled = !enable);
}
