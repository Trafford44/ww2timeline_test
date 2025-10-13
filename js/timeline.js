import { renderStars } from './stars.js';
import { getPlatformIcons } from './platforms.js';
import { applyFilters } from './filters.js';
import { dataset } from './data.js';
import { features } from './main.js';
import { savePinned, loadPinned, isPinned, togglePinned } from './pinnedManager.js';

/**
 * Groups film data by its event year for timeline rendering.
 * @param {Array<object>} filteredData - The list of film records to group.
 * @returns {object} An object where keys are years (string) and values are arrays of films.
 */
function groupFilmsByYear(filteredData) {
  const grouped = {};

  filteredData.forEach(film => {
    let year = "Unknown Year";
    const rawYear = String(film.EventYear || "").trim();
    if (/^\d{4}$/.test(rawYear)) {
      year = rawYear;
    } else if (rawYear.includes('–') || rawYear.includes('-')) {
      year = rawYear.split(/[–-]/)[0].trim();
    } else if (rawYear) {
      year = rawYear.split(' ')[0];
    }
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(film);
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
  const grouped = groupFilmsByYear(filteredData); 

  const sortedYears = Object.keys(grouped).sort((a, b) => {
    if (a === "Unknown Year") return 1;
    if (b === "Unknown Year") return -1;
    return parseInt(a) - parseInt(b);
  });

  sortedYears.forEach(year => {
    const filmsInYear = grouped[year];
    const yearGroup = document.createElement("div");
    yearGroup.className = "year-group";

    
    const yearMarker = document.createElement("div");
    yearMarker.className = "year-marker";
    
    const yearLabel = document.createElement("span");
    yearLabel.className = "year-label";
    yearLabel.textContent = year;
    
    const countSpan = document.createElement("span");
    countSpan.className = "year-count";
    countSpan.textContent = `(${filmsInYear.length} film${filmsInYear.length !== 1 ? 's' : ''})`;
    
    yearMarker.appendChild(yearLabel);
    yearMarker.appendChild(countSpan);

    yearMarker.addEventListener("click", () => {
      yearGroup.classList.toggle("collapsed");
    });

    yearGroup.appendChild(yearMarker);

    filmsInYear.forEach((film, index) => {
      const event = createEventCard(film, index);
      attachEventCardListeners(event, film); 
      yearGroup.appendChild(event);
    });

    timelineContainer.appendChild(yearGroup);
  });
}

/**
 * Creates the base HTML structure for a film event card.
 * @param {object} film - The film data object.
 * @param {number} index - Index for left/right positioning.
 * @returns {HTMLElement} The event card DOM element without listeners.
 */
function createEventCard(film, index) {
  const event = document.createElement("div");
  event.className = `timeline-event ${index % 2 === 0 ? "left" : "right"}`;
  
  if (film.Classification) {
    event.classList.add(`classification-${String(film.Classification).split('/')[0].trim().replace(/\s/g, '-')}`);
  }
  
  // Initialize Pinned status based on stored state
  if (isPinned(film.RecordID)) {
    film.Pinned = true;
    event.classList.add("pinned");
  }
  
  event.dataset.id = film.RecordID;

  
  const watchedStatus = film.Watched && String(film.Watched).toLowerCase() === 'yes'
    ? `Yes <span class="watched-status-icon" title="You have watched this film.">✔</span>`
    : (film.Watched || "No");

  const notesIndicator = film.Notes ? `<span class="notes-indicator" title="Click to view notes!">&#9999;</span>` : '';
  const imageHTML = film.ImageURL
    ? `<img src="${film.ImageURL}" alt="Poster for ${film.FilmTitle || 'Untitled'}" class="event-image">`
    : '';

  const title = document.createElement("div");
  title.className = "event-title";
  // FIX: Wrapped the film title in a span to ensure consistent styling regardless of image/notes presence.
  title.innerHTML = `${imageHTML}<span class="film-name">${film.FilmTitle || "Untitled Film"}</span>${film.ReleaseYear ? ` <span class="release-year">(${film.ReleaseYear})</span>` : ""}${notesIndicator}`;
  event.appendChild(title);

  const details = document.createElement("div");
  details.className = "event-details";
  // CORRECTED: Cleaned template literal to prevent unwanted whitespace/entities from breaking CSS
  details.innerHTML = `
    <b>Period:</b> ${film.Period || ""}<br>
    <b>Format:</b> ${film.Format || ""}<br>
    <b>Classification:</b> ${film.Classification || ""}<br>
    <b>Running Time:</b> ${film.RunningTime || ""}<br>
    <b>Historical Accuracy:</b> ${renderStars(film.HistoricalAccuracy)}<br>
    <b>Short Description:</b> ${film.ShortDescription || ""}<br>
    <b>Watch On:</b> ${film.WatchOn || ""} ${getPlatformIcons(film.WatchOn)}<br>
    <b>Link:</b> ${film.Link ? `<a href="${film.Link}" target="_blank">View Link</a>` : ""}<br>
    <b>Watched:</b> ${watchedStatus}<br>
    <b>Rating:</b> ${renderStars(film.Rating || 0)}
    <span class="pin-icon" title="Click to pin/unpin this film">
      ${film.Pinned ? "📌" : "📍"}
    </span>
  `;
  event.appendChild(details);

  // Reverting this back to appending a separate element to maintain original structure
  if (film.Notes) {
    const notes = document.createElement("div");
    notes.className = "notes";
    notes.textContent = `Notes: ${film.Notes}`;
    event.appendChild(notes);
  }

  console.log("Created Card Element Check:", {
    eventClass: event.className,
    titleClass: title.className,
    detailsClass: details.className
  });

  return event;
}

/**
 * Attaches event listeners to the film card for interaction (pinning and notes).
 * @param {HTMLElement} event - The film card DOM element.
 * @param {object} film - The film data object.
 */
function attachEventCardListeners(event, film) {
  const pinSpan = event.querySelector(".pin-icon");
  // Now querying the notes div which is a direct child of 'event' again
  const notesDiv = event.querySelector(".notes"); 
  
  // Pinning Listener
  pinSpan.addEventListener("click", (e) => {
    e.stopPropagation();
    film.Pinned = !film.Pinned;
    event.classList.toggle("pinned", film.Pinned); // Update visual class
    pinSpan.innerHTML = film.Pinned ? "📌" : "📍"; // Update pin emoji
    togglePinned(film.RecordID); // Update local storage
    applyFilters(dataset); // Re-render/Update view based on new pin state
  });

  // Notes Toggle Listener
  if (notesDiv) {
    event.addEventListener("click", (e) => {
      // Prevent note toggle if clicking on interactive elements
      if (e.target.tagName !== 'A' && !e.target.closest('.pin-icon') && !e.target.closest('.notes-indicator')) {
        notesDiv.classList.toggle("show");
      }
    });
  }
}
