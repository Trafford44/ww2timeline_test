import { isPinned, togglePinned } from './pinnedManager.js';
import { updateApp } from './main.js'; // To trigger re-render after interaction

// --- Global DOM References ---
const timelineContainer = document.getElementById("timeline");
const statsContent = document.getElementById("statsContent");

// --- 1. Event Card Creation (Generic) ---

/**
 * Creates the HTML string for a single event card.
 * @param {object} event The event data object.
 * @param {object} domain The domain configuration.
 * @returns {string} The HTML string for the event card.
 */
function createEventCard(event, domain) {
    const fm = domain.fieldMap;
    const labels = domain.labels;
    const isWatched = (event[fm.watched] || "").toLowerCase() === 'yes';
    const pinned = isPinned(event.RecordID);

    const accuracyStars = (rating) => {
        const fullStars = parseInt(rating, 10);
        const emptyStars = 5 - fullStars;
        return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
    };
    
    // Determine card classes, using classification for color
    let cardClasses = `timeline-card classification-${(event[fm.classification] || '').replace(/\s+/g, '-')}`;
    if (isWatched) cardClasses += ' watched';
    if (pinned) cardClasses += ' pinned';
    
    // Notes/Synopsis content management
    const synopsis = event[fm.notes] || 'No synopsis available.';
    const hasNotes = !!event[fm.notes];

    // Card structure using dynamic field names and labels
    return `
        <div class="${cardClasses}" data-id="${event.RecordID}" data-date="${event[fm.year]}" data-classification="${event[fm.classification]}">
            <div class="card-header">
                <span class="card-title">${event[fm.title] || 'Untitled'}</span>
                <span class="card-date">${event[fm.year] || 'N/A'}</span>
            </div>
            
            <div class="card-details">
                <p><strong>${labels.classificationLabel || 'Classification'}:</strong> ${event[fm.classification] || 'N/A'}</p>
                <p><strong>${labels.accuracyLabel || 'Accuracy'}:</strong> <span class="rating-stars">${accuracyStars(event[fm.accuracy] || 0)}</span> (${event[fm.accuracy] || 'N/A'} / 5)</p>
                <p><strong>${labels.periodLabel || 'Period'}:</strong> ${event[fm.period] || 'N/A'}</p>
                <p><strong>${labels.platformLabel || 'Platform/s'}:</strong> ${event[fm.platform] || 'N/A'}</p>
                ${event[fm.location] ? `<p><strong>${labels.locationLabel || 'Location'}:</strong> ${event[fm.location]}</p>` : ''}
            </div>

            <div class="card-notes ${hasNotes ? '' : 'no-notes'}" id="notes-${event.RecordID}">
                <p><strong>${labels.notesLabel || 'Notes'}:</strong> ${synopsis}</p>
            </div>

            <div class="card-actions">
                <button class="toggle-pin-btn" data-id="${event.RecordID}">
                    ${pinned ? '📌 Unpin' : '📍 Pin'}
                </button>
                <button class="toggle-watched-btn" data-id="${event.RecordID}" data-watched="${isWatched}">
                    ${isWatched ? '✔ Watched' : '☐ Unwatched'}
                </button>
                ${hasNotes ? '<span class="notes-indicator">&#9999; Notes</span>' : ''}
            </div>
        </div>
    `;
}

// --- 2. Timeline Rendering & Event Wiring (Generic) ---

/**
 * Attaches event listeners for Pinned/Watched toggles.
 * @param {object} domain The domain configuration.
 */
function wireEvents(domain) {
    // Only set up event listener once
    if (timelineContainer.dataset.listenersAttached === 'true') return;
    timelineContainer.dataset.listenersAttached = 'true';

    timelineContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-pin-btn');
        if (btn) {
            const id = btn.dataset.id;
            togglePinned(id, domain); // Generic: Pass domain to pinnedManager
            updateApp();
            return;
        }

        const watchedBtn = e.target.closest('.toggle-watched-btn');
        if (watchedBtn) {
            // NOTE: Toggle watched status (must be handled by a function in data.js or local-storage.js)
            // Since we don't have that file, we just trigger the full update cycle.
            // If you later implement a toggleWatched(id, domain) function, it would go here.
            
            // For now, assume a toggleWatched function exists in local-storage.js and we dynamically import it
            import('./local-storage.js').then(({ toggleWatchedStatus }) => {
                toggleWatchedStatus(watchedBtn.dataset.id, domain);
                updateApp();
            });
            return;
        }
    });
}


/**
 * Renders the initial timeline structure. Only called once on app startup.
 * @param {Array<object>} data The full dataset.
 * @param {object} domain The domain configuration.
 */
export function renderTimeline(data, domain) {
    if (!timelineContainer) return;
    console.log("⏳ Initial timeline render...");
    
    // Render all cards initially
    const cardsHtml = data.map(event => createEventCard(event, domain)).join('');
    timelineContainer.innerHTML = cardsHtml;
    
    // Wire up event listeners only once
    wireEvents(domain);
}

/**
 * Updates the timeline display based on filtered and sorted data.
 * @param {Array<object>} filteredData The data after filters have been applied.
 * @param {object} domain The domain configuration.
 * @returns {Array<object>} The final, visible data after sorting.
 */
export function updateTimeline(filteredData, domain) {
    // 1. Sort the data (Placeholder: sort by Release Year descending)
    const sortKey = domain.fieldMap.year || 'ReleaseYear';
    const sortedData = filteredData.sort((a, b) => b[sortKey] - a[sortKey]);

    // 2. Clear and Re-render only the filtered/sorted cards
    if (!timelineContainer) return sortedData;
    
    timelineContainer.innerHTML = sortedData.map(event => createEventCard(event, domain)).join('');

    console.log(`✅ Timeline updated with ${sortedData.length} visible events.`);
    return sortedData;
}


// --- 3. Stats Panel Creation (Generic) ---

/**
 * Renders the statistics panel content.
 * NOTE: This function is required to be EXPORTED by main.js.
 * @param {Array<object>} data The dataset (typically the filtered set).
 * @param {object} domain The domain configuration.
 */
export function createStatsPanel(data, domain) {
    if (!statsContent) return;

    const totalCount = data.length;
    const watchedKey = domain.fieldMap.watched || 'Watched';
    const classificationKey = domain.fieldMap.classification || 'Classification';

    const watchedCount = data.filter(e => (e[watchedKey] || '').toLowerCase() === 'yes').length;
    const unwatchedCount = totalCount - watchedCount;
    const pinnedCount = data.filter(e => isPinned(e.RecordID)).length;

    // Tally classifications
    const classificationTallies = data.reduce((acc, e) => {
        const key = e[classificationKey] || 'Unclassified';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    let statsHTML = `
        <h4 style="margin-bottom: 5px;">Overall Summary (${totalCount} Records)</h4>
        <p><strong>Watched:</strong> ${watchedCount} (${(watchedCount / (totalCount || 1) * 100).toFixed(1)}%)</p>
        <p><strong>Unwatched:</strong> ${unwatchedCount} (${(unwatchedCount / (totalCount || 1) * 100).toFixed(1)}%)</p>
        <p><strong>Pinned:</strong> ${pinnedCount}</p>
        
        <h4 style="margin-top: 15px; margin-bottom: 5px;">By ${domain.labels.classificationLabel || 'Classification'}</h4>
        <ul>
            ${Object.entries(classificationTallies).map(([name, count]) => 
                `<li>${name}: ${count}</li>`
            ).join('')}
        </ul>
    `;

    statsContent.innerHTML = statsHTML;
}
