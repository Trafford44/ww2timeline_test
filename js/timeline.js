import { renderStars } from './stars.js';
import { getPlatformIcons } from './platforms.js';
import { applyFilters } from './filters.js';
import { dataset } from './data.js';
import { features } from './main.js';

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
    yearMarker.textContent = year;
    yearGroup.appendChild(yearMarker);

    filmsInYear.forEach((film, index) => {
      const event = createEventCard(film, index);
      yearGroup.appendChild(event);
    });

    timelineContainer.appendChild(yearGroup);
  });
}

function createEventCard(film, index) {
  const event = document.createElement("div");
  event.className = `timeline-event ${index % 2 === 0 ? "left" : "right"}`;

  if (film.Classification) {
    event.classList.add(`classification-${String(film.Classification).split('/')[0].trim().replace(/\s/g, '-')}`);
  }
  if (film.Pinned) {
    event.classList.add("pinned");
  }

  const watchedStatus = film.Watched && String(film.Watched).toLowerCase() === 'yes'
    ? `Yes <span class="watched-status-icon" title="You have watched this film.">✔</span>`
    : (film.Watched || "No");

  const notesIndicator = film.Notes ? `<span class="notes-indicator" title="Click to view notes!">&#9999;</span>` : '';
  const imageHTML = film.ImageURL
    ? `<img src="${film.ImageURL}" alt="Poster for ${film.FilmTitle || 'Untitled'}" class="event-image">`
    : '';

  const title = document.createElement("div");
  title.className = "event-title";
  title.innerHTML = `
    ${imageHTML}${film.FilmTitle || "Untitled Film"}${film.ReleaseYear ? `<span class="release-year"> (${film.ReleaseYear})</span>` : ""}
    ${notesIndicator}
  `;
  event.appendChild(title);

  const details = document.createElement("div");
  details.className = "event-details";
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

  const pinSpan = details.querySelector(".pin-icon");
  pinSpan.addEventListener("click", (e) => {
    e.stopPropagation();
    film.Pinned = !film.Pinned;
    event.classList.toggle("pinned", film.Pinned); // ✅ Immediate visual feedback
    applyFilters(dataset);
  });

  if (film.Notes) {
    const notes = document.createElement("div");
    notes.className = "notes";
    notes.textContent = `Notes: ${film.Notes}`;
    event.appendChild(notes);
    event.addEventListener("click", (e) => {
      if (e.target.tagName !== 'A') {
        notes.classList.toggle("show");
      }
    });
  }

  return event;
}
