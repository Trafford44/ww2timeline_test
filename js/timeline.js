import { renderStars } from './stars.js';
import { getPlatformIcons } from './platforms.js';
import { applyFilters } from './filters.js';
import { dataset } from './data.js';
import { features } from './main.js';
import { savePinned, loadPinned, isPinned, togglePinned } from './pinnedManager.js';

/**
 * Groups event data by its event year for timeline rendering.
 * @param {Array<object>} filteredData - The list of event records to group.
 * @returns {object} An object where keys are years (string) and values are arrays of events.
 */
function groupEventsByYear(filteredData) {
  const grouped = {};

  filteredData.forEach(event => {
    let year = "Unknown Year";
    const rawYear = String(event.EventYear || "").trim();
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

export function renderTimeline(filteredData) {
  const timelineContainer = document.getElementById("timeline");
  const initialPrompt = document.getElementById("initialPrompt");

  timelineContainer.innerHTML = "";

  if (filteredData.length === 0) {
    initialPrompt.style.display = 'block';
    initialPrompt.textContent = "No data found or all records filtered out.";
    return;
  }

  initialPrompt.style.display = 'none';

  // Use the extracted utility function
  const grouped = groupEventsByYear(filteredData); 

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
      const card = createEventCard(event, index);
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
 * @returns {HTMLElement} The event card DOM element without listeners.
 */
function createEventCard(event, index) {
  const card = document.createElement("div");
  card.className = `timeline-event ${index % 2 === 0 ? "left" : "right"}`;
  
  if (event.Classification) {
    card.classList.add(`classification-${String(event.Classification).split('/')[0].trim().replace(/\s/g, '-')}`);
  }
  
  // Initialize Pinned status based on stored state
  if (isPinned(event.RecordID)) {
    event.Pinned = true;
    card.classList.add("pinned");
  }
  
  card.dataset.id = event.RecordID;

  
  const watchedStatus = event.Watched && String(event.Watched).toLowerCase() === 'yes'
    ? `Yes <span class="watched-status-icon" title="You have watched this event.">✔</span>`
    : (event.Watched || "No");

  const notesIndicator = event.Notes ? `<span class="notes-indicator" title="Click to view notes!">&#9999;</span>` : '';
  const imageHTML = event.ImageURL
    ? `<img src="${event.ImageURL}" alt="Poster for ${event.FilmTitle || 'Untitled Event'}" class="event-image">`
    : '';

  const title = document.createElement("div");
  title.className = "event-title";
  // RESTORED: Removed the extra span class to allow the original .event-title CSS to apply directly to the text node.
  title.innerHTML = `${imageHTML}${event.FilmTitle || "Untitled Event"}${event.ReleaseYear ? ` <span class="release-year">(${event.ReleaseYear})</span>` : ""}${notesIndicator}`;
  card.appendChild(title);
  
  const details = document.createElement("div");
  details.className = "event-details";
  // CORRECTED: Cleaned template literal to prevent unwanted whitespace/entities from breaking CSS
  //details.innerHTML = `<b>Period:</b> ${event.Period || ""}<br><b>Format:</b> ${event.Format || ""}<br><b>Classification:</b> ${event.Classification || ""}<br><b>Running Time:</b> ${event.RunningTime || ""}<br><b>Historical Accuracy:</b> ${renderStars(event.HistoricalAccuracy)}<br><b>Short Description:</b> ${event.ShortDescription || ""}<br><b>Watch On:</b> ${event.WatchOn || ""} ${getPlatformIcons(event.WatchOn)}<br><b>Link:</b> ${event.Link ? `<a href="${event.Link}" target="_blank">View Link</a>` : ""}<br><b>Watched:</b> ${watchedStatus}<br><b>Rating:</b> ${renderStars(event.Rating || 0)}<span class="pin-icon" title="Click to pin/unpin this event">${event.Pinned ? "📌" : "📍"}</span>`;

  details.innerHTML = `
  <b>Period:</b> ${event.Period || ""}
  <br><b>Format:</b> ${event.Format || ""}
  <br><b>Classification:</b> ${event.Classification || ""}
  <br><b>Running Time:</b> ${event.RunningTime || ""}
  <br><b>Historical Accuracy:</b> ${renderStars(event.HistoricalAccuracy)}
  <br><b>Short Description:</b> ${event.ShortDescription || ""}
  <br><b>Watch On:</b> ${event.WatchOn || ""} ${getPlatformIcons(event.WatchOn)}
  <br><b>Link:</b> ${event.Link ? `<a href="${event.Link}" target="_blank">View Link</a>` : ""}
  <br><b>Watched:</b> ${watchedStatus}
  <br><b>Rating:</b> ${renderStars(event.Rating || 0)}
  <span class="pin-icon" title="Click to pin/unpin this event">
    ${event.Pinned ? "📌" : "📍"}
  </span>
`;

  
  card.appendChild(details);

  //add notes after the detail in its own div
  if (event.Notes) {
    const notes = document.createElement("div");
    notes.className = "notes";
    notes.textContent = `Notes: ${event.Notes}`;
    card.appendChild(notes);
  }
  
  /*
  // this section outputs all the below call detail for all records to console
  console.log("Created Card Element Check:", {
    eventClass: card.className,
    titleClass: title.className,
    detailsClass: details.className
  });
  */
  return card;
}

/**
 * Attaches event listeners to the event card for interaction (pinning and notes).
 * @param {HTMLElement} card - The event card DOM element.
 * @param {object} event - The event data object.
 */
function attachEventCardListeners(card, event) {
  const pinSpan = card.querySelector(".pin-icon");
  // Now querying the notes div which is a direct child of 'card' again
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
