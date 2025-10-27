import { renderStars } from './stars.js';
import { getPlatformIcons } from './platforms.js';
import { applyFilters } from './filters.js';
import { dataset } from './data.js';
import { features } from './main.js';
import { savePinned, loadPinned, isPinned, togglePinned } from './pinnedManager.js';
import { loadConfig } from './config.js';
import { domainKey } from './domain.js';
import { hideAlert } from './alerts/alertUtils.js';
import { errorHandler } from './alerts/errorUtils.js';
import { logActivity } from './alerts/logger.js';

let domain = {};

/**
 * Groups event data by its event year for timeline rendering.
 * @param {Array<object>} filteredData - The list of event records to group.
 * @returns {object} An object where keys are years (string) and values are arrays of events.
 */
function groupEventsByYear(filteredData) {
  const grouped = {};

  logActivity("info", "groupEventsByYear", { filteredData });
 
  try {
    
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
    
  } catch (error) {
    errorHandler(error, "groupEventsByYear");
  }    
}

export async function renderTimeline(filteredData) {
  logActivity("info", "renderTimeline", { filteredData });
 
  try {
        
      const timelineContainer = document.getElementById("timeline");
      const initialPrompt = document.getElementById("initialPrompt");
      
      const config = await loadConfig(domainKey);
      domain = config.domain;
      
      timelineContainer.innerHTML = "";
    
      if (filteredData.length === 0) {
        initialPrompt.style.display = 'block';
        initialPrompt.textContent = "No data found or all records filtered out.";
        return;
      }
    
      initialPrompt.style.display = 'none';
      hideAlert();
    
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

  } catch (error) {
    errorHandler(error, "renderTimeline");
    throw error; //bubble it up
  }       
}

/**
 * Creates the base HTML structure for an event card.
 * @param {object} event - The event data object.
 * @param {number} index - Index for left/right positioning.
 * @returns {HTMLElement} The event card DOM element without listeners.
 */
function createEventCard(event, index) {
  logActivity("info", "createEventCard", { event, index });
 
  try {
  //throw new Error("test error");
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
  
    const notesIndicator = event.Notes ? `<span class="notes-indicator" title="Click to view notes!">📝</span>` : '';
    const imageHTML = event.ImageURL
      ? `<img src="${event.ImageURL}" alt="Poster for ${event.Title || 'Untitled Event'}" class="event-image">`
      : '';
  
    const title = document.createElement("div");
    title.className = "event-title";
    // RESTORED: Removed the extra span class to allow the original .event-title CSS to apply directly to the text node.
    title.innerHTML = `${imageHTML}${event.Title || "Untitled Event"}${event.YearOfIssue ? ` <span class="release-year">(${event.YearOfIssue})</span>` : ""}${notesIndicator}`;
    card.appendChild(title);
    
    const details = document.createElement("div");
    details.className = "event-details";
    
    // add the card content
    details.innerHTML = `
    <b>${domain.labels.PeriodLabel || "Format"}:</b> ${event.Period || ""}
    <br><b>${domain.labels.FormatLabel || "Format"}:</b> ${event.Format || ""}
    <br><b>${domain.labels.ClassificationLabel || "Format"}:</b> ${event.Classification || ""}
    <br><b>${domain.labels.RunningTimeLabel || "Format"}:</b> ${event.RunningTime || ""}
    <br><b>${domain.labels.HistoricalAccuracyLabel || "Format"}:</b> ${renderStars(event.HistoricalAccuracy)}
    ${createToggleDescription(event.ShortDescription)}
    ${renderPlatformField(event.Platform, event.PlatformLink)}
    <br><b>${domain.labels.WikipediaLabel || "Format"}:</b> ${event.Wikipedia ? `<a href="${event.Wikipedia}" target="_blank">see details..</a>` : ""}
    <br><b>${domain.labels.WatchedLabel || "Format"}:</b> ${watchedStatus}
    <br><b>${domain.labels.RatingLabel || "Format"}:</b> ${renderStars(event.Rating || 0)}
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

  } catch (error) {
    errorHandler(error, "createEventCard");
    throw error; //bubble it up    
  }         
}

// note yet used - supposed to add "..." on notes
function createToggleDescription(description) {
  logActivity("info", "createToggleDescription", { description });
 
  try {
  
    const MAX_LENGTH = 70;
    const descriptionText = description || "";
  
    // The unique ID will be used to link the button to the dots/hidden text.
    // We'll use a simple timestamp or a unique event ID if available (e.g., event.id).
    // Assuming a simple timestamp for a unique identifier here.
    const uniqueId = 'desc-toggle-' + Date.now() + Math.floor(Math.random() * 1000); 
  
    if (descriptionText.length <= MAX_LENGTH) {
      // If text is short, return the standard line.
      return `<br><b>${domain.labels.ShortDescription || "Description"}:</b> ${descriptionText}`;
    }
  
    // 1. Split the text
    const shortText = descriptionText.substring(0, MAX_LENGTH);
    const hiddenText = descriptionText.substring(MAX_LENGTH);
  
    // 2. Build the HTML structure with unique IDs
    return `
      <br><b>${domain.labels.ShortDescription || "Description"}:</b> 
      <span 
        class="description-toggle-icon"
        data-target-id="${uniqueId}"
        onclick="toggleText(this, '${uniqueId}')"
        title="Click to expand/collapse description"
      >
        📖
      </span>
      ${shortText}
      <span id="${uniqueId}-dots">...</span>
      <span id="${uniqueId}-more" style="display: none;">${hiddenText}</span>
    `;
  } catch (error) {
    errorHandler(error, "createToggleDescription");
  }    
}

// - if event.PlatformLink has a value (a url), make a link to the platform using event.Platform as the link text
// - if event.Platform is null, just use teh text 'link'
// - if both are null, put nothing
function renderPlatformField(platform, link) {
  logActivity("info", "renderPlatformField", { platform, link });
 
  try {
    
    const label = domain.labels.PlatformLabel || "Format";
  
    if (link) {
      const linkText = platform || "link";
      return `<br><b>${label}:</b> <a href="${link}" target="_blank">${linkText}</a> ${getPlatformIcons(platform)}`;
    } else if (platform) {
      return `<br><b>${label}:</b> ${platform} ${getPlatformIcons(platform)}`;
    } else {
      return `<br><b>${label}:</b>`;
    }
  } catch (error) {
    errorHandler(error, "renderPlatformField");
  }     
}


function toggleText(iconElement, targetId) {
  logActivity("info", "toggleText", { iconElement, targetId });
 
  try {
    
    const dots = document.getElementById(targetId + "-dots");
    const moreText = document.getElementById(targetId + "-more");
  
    const isCollapsed = moreText.style.display === "none";
  
    dots.style.display = isCollapsed ? "none" : "inline";
    moreText.style.display = isCollapsed ? "inline" : "none";
    iconElement.textContent = isCollapsed ? "📕" : "📖";

  } catch (error) {
    errorHandler(error, "toggleText");
  }      
}

/**
 * Attaches event listeners to the event card for interaction (pinning and notes).
 * @param {HTMLElement} card - The event card DOM element.
 * @param {object} event - The event data object.
 */
function attachEventCardListeners(card, event) {
  logActivity("info", "attachEventCardListeners", { card, event });
 
  try {  
    const pinSpan = card.querySelector(".pin-icon");
    // Now querying the notes div which is a direct child of 'card' again
    
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
    const notesDiv = card.querySelector(".notes");
    const titleDiv = card.querySelector(".event-title");
  
    if (notesDiv && titleDiv) {
      titleDiv.addEventListener("click", () => {
        notesDiv.classList.toggle("show");
      });
    }
    
    // Description toggle listener
    card.querySelectorAll(".description-toggle-icon").forEach((icon) => {
      icon.addEventListener("click", () => {
        const targetId = icon.dataset.targetId;
        toggleText(icon, targetId);
      });
    });
  
  } catch (error) {
    errorHandler(error, "attachEventCardListeners");
  }   
}
