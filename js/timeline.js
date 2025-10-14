import { renderStars } from './stars.js';
import { getPlatformIcons } from './platforms.js';
import { applyFilters } from './filters.js';
import { dataset } from './data.js';
import { features } from './main.js';
import { savePinned, loadPinned, isPinned, togglePinned } from './pinnedManager.js';

/**
 * Groups event data by its event year for timeline rendering.
 * @param {Array<object>} filteredData - The list of event records to group.
 * @param {object} domain - The configuration object containing fieldMap.
 * @returns {object} An object where keys are years (string) and values are arrays of events.
 */
function groupEventsByYear(filteredData, domain) {
  const grouped = {};
  const fm = domain.fieldMap || {};
  // Use the mapped year field, defaulting to 'EventYear' if not mapped in config
  const yearKey = fm.eventYear || 'EventYear'; 

  filteredData.forEach(event => {
    let year = "Unknown Year";
    const rawYear = String(event[yearKey] || "").trim();
    
    // Logic remains generic based on string manipulation of the year field
    if (/^\d{4}$/.test(rawYear)) {
      year = rawYear;
    } else if (rawYear.includes('–') || rawYear.includes('-')) {
      year = rawYear.split(/[–-]/)[0].trim();
    } else if (rawYear) {
      year = rawYear.split(' ')[0];
    }
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(event);
  });

  return grouped;
}

/**
 * Renders the timeline from filtered event data.
 * @param {Array<object>} filteredData - The event records to render.
 * @param {object} domain - The configuration object.
 */
export function renderTimeline(filteredData, domain) {
  const timelineContainer = document.getElementById("timeline");
  const initialPrompt = document.getElementById("initialPrompt");

  timelineContainer.innerHTML = "";

  if (filteredData.length === 0) {
    initialPrompt.style.display = 'block';
    initialPrompt.textContent = "No data found or all records filtered out.";
    return;
  }

  initialPrompt.style.display = 'none';

  // Pass domain config to the grouping utility
  const grouped = groupEventsByYear(filteredData, domain); 

  const sortedYears = Object.keys(grouped).sort((a, b) => {
    if (a === "Unknown Year") return 1;
    if (b === "Unknown Year") return -1;
    return parseInt(a) - parseInt(b);
  });

  sortedYears.forEach(year => {
    const eventsInYear = grouped[year];
    const yearGroup = document.createElement("div");
    yearGroup.className = "year-group";

    
    const yearMarker = document.createElement("div");
    yearMarker.className = "year-marker";
    
    const yearLabel = document.createElement("span");
    yearLabel.className = "year-label";
    yearLabel.textContent = year;
    
    const countSpan = document.createElement("span");
    countSpan.className = "year-count";
    countSpan.textContent = `(${eventsInYear.length} event${eventsInYear.length !== 1 ? 's' : ''})`;
    
    yearMarker.appendChild(yearLabel);
    yearMarker.appendChild(countSpan);

    yearMarker.addEventListener("click", () => {
      yearGroup.classList.toggle("collapsed");
    });

    yearGroup.appendChild(yearMarker);

    eventsInYear.forEach((event, index) => {
      // Pass domain config to createEventCard
      const card = createEventCard(event, index, domain); 
      attachEventCardListeners(card, event); 
      yearGroup.appendChild(card);
    });

    timelineContainer.appendChild(yearGroup);
  });
}

/**
 * Creates the base HTML structure for an event card.
 * @param {object} event - The event data object.
 * @param {number} index - Index for left/right positioning.
 * @param {object} domain - The configuration object containing fieldMap and labels.
 * @returns {HTMLElement} The event card DOM element without listeners.
 */
function createEventCard(event, index, domain) {
  const fm = domain.fieldMap || {};
  const labels = domain.labels || {};
  
  // Use mapped keys, with fallbacks to the original hardcoded keys
  const titleKey = fm.title || 'FilmTitle';
  const yearKey = fm.year || 'ReleaseYear';
  const classificationKey = fm.classification || 'Classification';
  const periodKey = fm.period || 'Period';
  const accuracyKey = fm.accuracy || 'HistoricalAccuracy';
  const platformKey = fm.platform || 'WatchOn';
  const watchedKey = fm.watched || 'Watched';
  const notesKey = fm.notes || 'Notes';

  const card = document.createElement("div");
  card.className = `timeline-event ${index % 2 === 0 ? "left" : "right"}`;
  
  // Use mapped key for classification for styling class
  if (event[classificationKey]) {
    card.classList.add(`classification-${String(event[classificationKey]).split('/')[0].trim().replace(/\s/g, '-')}`);
  }
  
  // Initialize Pinned status based on stored state
  if (isPinned(event.RecordID)) {
    event.Pinned = true;
    card.classList.add("pinned");
  }
  
  card.dataset.id = event.RecordID;

  
  // Use mapped key for Watched status display
  const watchedValue = event[watchedKey] && String(event[watchedKey]).toLowerCase() === 'yes';
  const watchedStatus = watchedValue
    ? `${labels.watchedLabel || 'Yes'} <span class="watched-status-icon" title="You have watched this event.">✔</span>`
    : (event[watchedKey] || (labels.notWatchedLabel || "No"));

  // Use mapped key for Notes check
  const hasNotes = event[notesKey];
  const notesIndicator = hasNotes ? `<span class="notes-indicator" title="Click to view notes!">&#9999;</span>` : '';
  
  const imageHTML = event.ImageURL
    ? `<img src="${event.ImageURL}" alt="Poster for ${event[titleKey] || 'Untitled Event'}" class="event-image">`
    : '';

  const titleText = event[titleKey] || "Untitled Event";
  const releaseYear = event[yearKey];

  const title = document.createElement("div");
  title.className = "event-title";
  // Use mapped keys for Title and Year
  title.innerHTML = `${imageHTML}${titleText}${releaseYear ? ` <span class="release-year">(${releaseYear})</span>` : ""}${notesIndicator}`;
  card.appendChild(title);

  const details = document.createElement("div");
  details.className = "event-details";
  
  // Use mapped keys AND labels for all detail fields
  details.innerHTML = 
    `<b>${labels.periodLabel || 'Period'}:</b> ${event[periodKey] || ""}<br>` +
    `<b>Format:</b> ${event.Format || ""}<br>` + // Format is still hardcoded as it's not in the fieldMap
    `<b>${labels.classificationLabel || 'Classification'}:</b> ${event[classificationKey] || ""}<br>` +
    `<b>Running Time:</b> ${event.RunningTime || ""}<br>` + // RunningTime is still hardcoded
    `<b>${labels.accuracyLabel || 'Historical Accuracy'}:</b> ${renderStars(event[accuracyKey])}<br>` +
    `<b>Short Description:</b> ${event.ShortDescription || ""}<br>` + // ShortDescription is still hardcoded
    `<b>${labels.platformLabel || 'Watch On'}:</b> ${event[platformKey] || ""} ${getPlatformIcons(event[platformKey])}<br>` +
    `<b>Link:</b> ${event.Link ? `<a href="${event.Link}" target="_blank">View Link</a>` : ""}<br>` +
    `<b>${labels.watchedLabel || 'Watched'}:</b> ${watchedStatus}<br>` +
    `<b>Rating:</b> ${renderStars(event.Rating || 0)}` + // Rating is still hardcoded
    `<span class="pin-icon" title="Click to pin/unpin this event">${event.Pinned ? "📌" : "📍"}</span>`;
  card.appendChild(details);

  // Use mapped key for Notes display
  if (hasNotes) {
    const notes = document.createElement("div");
    notes.className = "notes";
    notes.textContent = `${labels.notesLabel || 'Notes'}: ${event[notesKey]}`;
    card.appendChild(notes);
  }

  console.log("Created Card Element Check:", {
    eventClass: card.className,
    titleClass: title.className,
    detailsClass: details.className
  });

  return card;
}

/**
 * Attaches event listeners to the event card for interaction (pinning and notes).
 * @param {HTMLElement} card - The event card DOM element.
 * @param {object} event - The event data object.
 */
function attachEventCardListeners(card, event) {
  const pinSpan = card.querySelector(".pin-icon");
  const notesDiv = card.querySelector(".notes"); 
  
  // Pinning Listener
  pinSpan.addEventListener("click", (e) => {
    e.stopPropagation();
    event.Pinned = !event.Pinned;
    card.classList.toggle("pinned", event.Pinned); // Update visual class
    pinSpan.innerHTML = event.Pinned ? "📌" : "📍"; // Update pin emoji
    togglePinned(event.RecordID); // Update local storage
    applyFilters(dataset); // Re-render/Update view based on new pin state
  });

  // Notes Toggle Listener
  if (notesDiv) {
    card.addEventListener("click", (e) => {
      // Prevent note toggle if clicking on interactive elements
      if (e.target.tagName !== 'A' && !e.target.closest('.pin-icon') && !e.target.closest('.notes-indicator')) {
        notesDiv.classList.toggle("show");
      }
    });
  }
}
