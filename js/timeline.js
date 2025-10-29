import { renderStars } from './stars.js';
import { getPlatformIcons } from './platforms.js';
import { applyFilters } from './filters.js';
import { dataset } from './data.js';
import { isPinned, togglePinned } from './pinnedManager.js'; 
import { loadConfig } from './config.js';
import { domainKey } from './domain.js';
import { hideAlert } from './alerts/alertUtils.js';
import { showAlert } from './alerts/alertUtils.js';
import { errorHandler } from './alerts/errorUtils.js'; // KEPT for main async function
import { logActivity } from './alerts/logger.js';

let domain = {};

/**
 * Groups event data by its event year for timeline rendering.
 * @param {Array<object>} filteredData - The list of event records to group.
 * @returns {object} An object where keys are years (string) and values are arrays of events.
 */
function groupEventsByYear(filteredData) {
    logActivity("info", "groupEventsByYear initiated", { count: filteredData?.length });

    if (!Array.isArray(filteredData)) return {};

    const grouped = {};
    
    // Core Logic (No try/catch)
    filteredData.forEach(event => {
        let year = "Unknown Year";
        const rawYear = String(event.EventYear || "").trim();
        
        // Use more specific parsing for ranges and single years
        if (/^\d{4}$/.test(rawYear)) {
            year = rawYear;
        } else if (rawYear.includes('–') || rawYear.includes('-')) {
            // Take the first year in a range (e.g., 1999–2000 -> 1999)
            year = rawYear.split(/[–-]/)[0].trim();
        } else if (rawYear) {
            // Take the first part of a messy string
            year = rawYear.split(' ')[0];
        }
        
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(event);
    });
    
    return grouped;
}

/**
 * Creates the base HTML structure for an event card.
 * @param {object} event - The event data object.
 * @param {number} index - Index for left/right positioning.
 * @returns {HTMLElement} The event card DOM element without listeners.
 */
function createEventCard(event, index) {
    logActivity("info", "createEventCard initiated", { id: event.RecordID, title: event.Title });
    
    // Core Logic (No try/catch)
    const card = document.createElement("div");
    
    card.className = `timeline-event ${index % 2 === 0 ? "left" : "right"}`;
    
    // Add classification class, safely handling missing or compound values
    if (event.Classification) {
        const baseClass = String(event.Classification).split('/')[0].trim().replace(/\s/g, '-');
        card.classList.add(`classification-${baseClass}`);
    }
    
    // Initialize Pinned status based on stored state
    if (isPinned(event.RecordID)) {
        event.Pinned = true; // Update event object state for local rendering
        card.classList.add("pinned");
    }
    
    card.dataset.id = event.RecordID;
    
    
    const watchedStatus = (event.Watched && String(event.Watched).toLowerCase() === 'yes')
        ? `Yes <span class="watched-status-icon" title="You have watched this event.">✔</span>`
        : (event.Watched || "No");
    
    const notesIndicator = event.Notes ? `<span class="notes-indicator" title="Click to view notes!">📝</span>` : '';
    const imageHTML = event.ImageURL
        ? `<img src="${event.ImageURL}" alt="Poster for ${event.Title || 'Untitled Event'}" class="event-image">`
        : '';

    const title = document.createElement("div");
    title.className = "event-title";
    title.innerHTML = `${imageHTML}${event.Title || "Untitled Event"}${event.YearOfIssue ? ` <span class="release-year">(${event.YearOfIssue})</span>` : ""}${notesIndicator}`;
    card.appendChild(title);


    
    // --- TESTING: Simulate an error at the lowest layer (Rendering) ---
    throw new Error("Simulated error for testing in applyFilters()");
    // --- END TESTING ---
    
    const details = document.createElement("div");
    details.className = "event-details";
    
    // Use optional chaining for safer access to domain labels
    details.innerHTML = `
        <b>${domain.labels?.PeriodLabel || "Period"}:</b> ${event.Period || ""}
        <br><b>${domain.labels?.FormatLabel || "Format"}:</b> ${event.Format || ""}
        <br><b>${domain.labels?.ClassificationLabel || "Classification"}:</b> ${event.Classification || ""}
        <br><b>${domain.labels?.RunningTimeLabel || "Running Time"}:</b> ${event.RunningTime || ""}
        <br><b>${domain.labels?.HistoricalAccuracyLabel || "Historical Accuracy"}:</b> ${renderStars(event.HistoricalAccuracy || '')}
        ${createToggleDescription(event.ShortDescription)}
        ${renderPlatformField(event.Platform, event.PlatformLink)}
        <br><b>${domain.labels?.WikipediaLabel || "Wikipedia"}:</b> ${event.Wikipedia ? `<a href="${event.Wikipedia}" target="_blank">see details..</a>` : ""}
        <br><b>${domain.labels?.WatchedLabel || "Watched"}:</b> ${watchedStatus}
        <br><b>${domain.labels?.RatingLabel || "Rating"}:</b> ${renderStars(event.Rating || '')}
        <span class="pin-icon" title="Click to pin/unpin this event">
            ${isPinned(event.RecordID) ? "📌" : "📍"}
        </span>
    `;
    
    card.appendChild(details);
    
    // Add notes after the detail in its own div
    if (event.Notes) {
        const notes = document.createElement("div");
        notes.className = "notes";
        notes.textContent = `Notes: ${event.Notes}`;
        card.appendChild(notes);
    }
    
    return card;
}

function createToggleDescription(description) {
    // Note: Removed logActivity call for high-frequency helper function
    
    // Core Logic (No try/catch)
    const MAX_LENGTH = 70;
    const descriptionText = description || "";
    
    // The unique ID will be used to link the button to the dots/hidden text.
    // Using a reliable unique ID based on a random number.
    const uniqueId = `desc-toggle-${Math.random().toString(36).substring(2, 9)}`;
    
    if (descriptionText.length <= MAX_LENGTH) {
        // If text is short, return the standard line.
        return `<br><b>${domain.labels?.ShortDescription || "Description"}:</b> ${descriptionText}`;
    }
    
    // 1. Split the text
    const shortText = descriptionText.substring(0, MAX_LENGTH);
    const hiddenText = descriptionText.substring(MAX_LENGTH);
    
    // 2. Build the HTML structure
    // NOTE: toggleText is defined below and must be globally accessible (i.e., defined outside modules or attached to window) 
    // or referenced differently if you want to avoid inline 'onclick'.
    return `
        <br><b>${domain.labels?.ShortDescription || "Description"}:</b> 
        <span 
            class="description-toggle-icon"
            data-target-id="${uniqueId}"
            title="Click to expand/collapse description"
        >
            📖
        </span>
        ${shortText}
        <span id="${uniqueId}-dots">...</span>
        <span id="${uniqueId}-more" style="display: none;">${hiddenText}</span>
    `;
}

function renderPlatformField(platform, link) {
    // Note: Removed logActivity call for high-frequency helper function

    // Core Logic (No try/catch)
    const label = domain.labels?.PlatformLabel || "Platform"; // Defaulted to 'Platform'
    
    if (link) {
        const linkText = platform || "link";
        // NOTE: getPlatformIcons(platform) ensures consistent icons regardless of link presence
        return `<br><b>${label}:</b> <a href="${link}" target="_blank">${linkText}</a> ${getPlatformIcons(platform)}`;
    } else if (platform) {
        return `<br><b>${label}:</b> ${platform} ${getPlatformIcons(platform)}`;
    } else {
        // Only return the label if both platform and link are null/empty, otherwise return nothing.
        // Returning just the label with an empty string might be confusing in the UI.
        return ''; 
    }
}


// RETAINING this function, but it MUST be attached to the window object 
// for the inline 'onclick' in createToggleDescription to work.
// Alternatively, remove the inline 'onclick' and rely on the DOM listener below.
function toggleText(iconElement, targetId) {
    // Note: Removed logActivity call for high-frequency helper function

    // Core Logic (No try/catch)
    const dots = document.getElementById(targetId + "-dots");
    const moreText = document.getElementById(targetId + "-more");
    
    if (!dots || !moreText) return;

    const isCollapsed = moreText.style.display === "none";
    
    dots.style.display = isCollapsed ? "none" : "inline";
    moreText.style.display = isCollapsed ? "inline" : "none";
    iconElement.textContent = isCollapsed ? "📕" : "📖";
}


/**
 * Attaches event listeners to the event card for interaction (pinning and notes).
 * @param {HTMLElement} card - The event card DOM element.
 * @param {object} event - The event data object.
 */
function attachEventCardListeners(card, event) {
    logActivity("info", "attachEventCardListeners initiated", { id: event.RecordID });
    
    // Core Logic (No try/catch)
    const pinSpan = card.querySelector(".pin-icon");
    const notesDiv = card.querySelector(".notes");
    const titleDiv = card.querySelector(".event-title");
    
    // --- Pinning Listener ---
    if (pinSpan) {
        pinSpan.addEventListener("click", (e) => {
            e.stopPropagation();
            
            // Toggle in local storage and get the new status
            const isNowPinned = togglePinned(event.RecordID); 
            event.Pinned = isNowPinned; // Update local JS object state
            
            card.classList.toggle("pinned", isNowPinned); // Update visual class
            pinSpan.innerHTML = isNowPinned ? "📌" : "📍"; // Update pin emoji
            
            // Re-render/Update view based on new pin state (calls applyFilters with no args now!)
            applyFilters(); 
        });
    }
    
    // --- Notes Toggle Listener (Clicking the Title) ---
    if (notesDiv && titleDiv) {
        titleDiv.addEventListener("click", () => {
            notesDiv.classList.toggle("show");
        });
    }
    
    // --- Description Toggle Listener (DOM-based) ---
    card.querySelectorAll(".description-toggle-icon").forEach((icon) => {
        icon.addEventListener("click", () => {
            const targetId = icon.dataset.targetId;
            // Call the shared toggle logic
            toggleText(icon, targetId); 
        });
    });
}


// Main Rendering Function (Asynchronous, Retains `try/catch`)


export async function renderTimeline(filteredData) {
    logActivity("action", "renderTimeline initiated", { filteredCount: filteredData?.length });
    
    try {
        const timelineContainer = document.getElementById("timeline");
        const initialPrompt = document.getElementById("initialPrompt");
        
        // Load configuration and set the domain labels
        const config = await loadConfig(domainKey);
        domain = config.domain || {}; // Ensure domain is an object, even if config fails
        
        if (!timelineContainer || !initialPrompt) {
            throw new Error("Timeline or initial prompt container not found.");
        }

        timelineContainer.innerHTML = "";
        
        if (!Array.isArray(filteredData) || filteredData.length === 0) {
            initialPrompt.style.display = 'block';
            initialPrompt.textContent = "No data found or all records filtered out.";
            return;
        }
        
        initialPrompt.style.display = 'none';
        //hideAlert();
        
        const grouped = groupEventsByYear(filteredData); 
        
        const sortedYears = Object.keys(grouped).sort((a, b) => {
            // Ensure "Unknown Year" always appears last
            if (a === "Unknown Year") return 1;
            if (b === "Unknown Year") return -1;
            // Convert to number for proper sorting
            return parseInt(a) - parseInt(b);
        });

        const failedItems = [];
        
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
            
            // Collapse listener for the whole year group
            yearMarker.addEventListener("click", () => {
                yearGroup.classList.toggle("collapsed");
            });
            
            yearGroup.appendChild(yearMarker);

            //  putting a try catch here since all errors from createEventCard are lost in the forEach
            // since a separate stack.  This code captures all the errors (since the tr/catch is within 
            // the forEach and shows as a single alert
            
            
            sortedYears.forEach(year => {
              const eventsInYear = grouped[year];
              const yearGroup = document.createElement("div");
              // ... setup yearGroup ...
            
              eventsInYear.forEach((event, index) => {
                try {
                  const card = createEventCard(event, index);
                  attachEventCardListeners(card, event);
                  yearGroup.appendChild(card);
                } catch (err) {
                  failedItems.push(event.id || event.name || `Event ${index}`);
                  logger.error("createEventCard failed", { event, err });
                }
              });
            
              timelineContainer.appendChild(yearGroup);
            });
            
            // ✅ After all years processed
            if (failedItems.length > 0) {
              const summary = failedItems.length === 1
                ? `1 event failed to render: ${failedItems[0]}`
                : `${failedItems.length} events failed to render.`;
            
              setTimeout(() => {
                showAlert(summary, "error", {
                  dismissible: true,
                  retryCallback: () => retryFailedItems(failedItems)
                });
              }, 0);
            }
        

    } catch (error) {
        // CATCH: This catches loadConfig failures or fatal DOM rendering bugs.
        errorHandler(error, "renderTimeline failed.");
        throw error; //bubble it up to initApp
    }
}
