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
  const platforms = [...new Set(fullData.flatMap(f => f.WatchOn?.split(',').map(p => p.trim()) || []))].sort();
  const eventYears = [...new Set(fullData.map(f => f.EventYear).filter(Boolean))].sort();
  const periods = [...new Set(fullData.map(f => f.Period).filter(Boolean))].sort();

  formatFilter.innerHTML = '<option value="">Format: All</option>' + formats.map(f => `<option value="${f}">${f}</option>`).join("");
  classificationFilter.innerHTML = '<option value="">Classification: All</option>' + classifications.map(c => `<option value="${c}">${c}</option>`).join("");
  platformFilter.innerHTML = '<option value="">Platform/s: All</option>' + platforms.map(p => `<option value="${p}">${p}</option>`).join("");
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

export function applyFilters() {
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

  const filtered = fetchAndRenderData.filter(film => {
    const text = Object.values(film).join(" ").toLowerCase();
    if (keywords.length && !keywords.every(k => text.includes(k))) return false;
    if (filters.title && !(film.FilmTitle || "").toLowerCase().includes(filters.title)) return false;
    if (filters.platform && !(film.WatchOn || "").toLowerCase().includes(filters.platform)) return false;
    if (filters.classification && !(film.Classification || "").toLowerCase().includes(filters.classification)) return false;
    if (filters.period && !(film.Period || "").toLowerCase().includes(filters.period)) return false;
    if (filters.year && String(film.EventYear || "").trim() !== filters.year.trim()) return false;
    if (filters.watched && String(film.Watched || "").toLowerCase() !== filters.watched) return false;
    if (watched && film.Watched !== watched) return false;
    if (format && film.Format !== format) return false;
    if (classification && film.Classification !== classification) return false;
    if (platform && !(film.WatchOn || "").toLowerCase().includes(platform.toLowerCase())) return false;
    if (eventYear && String(film.EventYear || "").trim() !== eventYear.trim()) return false;
    if (period && film.Period !== period) return false;
    if (pinned === "Yes" && !film.Pinned) return false;
    if (pinned === "No" && film.Pinned) return false;
    if (hideWatched && film.Watched === "Yes") return false;
    if (hidePinned && film.Pinned) return false;
    if (challengeMode && (film.Watched === "Yes" || film.Pinned)) return false;
    return true;
  });

  renderTimeline(filtered);
  updateStats(filtered);
}
