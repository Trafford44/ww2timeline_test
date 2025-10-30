import { logActivity } from './alerts/logger.js';
import { isPinned } from "./pinnedManager.js";

// updateStats()
// Generates and displays summary statistics for the currently filtered dataset.
// Purpose:
// Provides users with a quick breakdown of the current selection
//   Highlights watched/pinned counts, classification distribution, and top platforms
// Inputs:
//   filteredEvents: array of events that passed current filters
//   totalEvents: total number of events before filtering (used for context)
// Process:
//   If no events match, displays a fallback message
//   Iterates through filteredEvents to:
//     Count watched and pinned items
//     Aggregate counts by Classification (defaulting to "Unclassified")
//     Normalize and count platform entries (split, trim, deduplicate)
//   Sorts and selects the top 5 platforms by frequency
//   Constructs a formatted HTML summary including:
//     Total selected
//     Watched and pinned counts with percentages
//     Classification breakdown
//     Top platforms list
// Output:
//   Injects the summary into the #statsContent element
// Logging:
//   Uses console.log() to trace invocation and filtered count


/**
 * Calculates and updates summary statistics for the current filtered event set.
 * * @param {Array<Object>} filteredEvents - The array of events currently visible.
 * @param {number} totalEvents - The total number of records in the full dataset.
 */
export function updateStats(filteredEvents, totalEvents) {
    logActivity("info", "updateStats initiated", { filteredCount: filteredEvents?.length, totalEvents });

    // R1: Robustness Check & Element Lookup (Synchronous: no try/catch needed)
    const statsContent = document.getElementById("statsContent");
    if (!statsContent) {
        logActivity("warning", "updateStats", { reason: "Stats content element not found." });
        return;
    }

    // Ensure the input is a valid array
    if (!Array.isArray(filteredEvents)) filteredEvents = [];

    const totalFiltered = filteredEvents.length;

    // R2: Handle zero results
    if (totalFiltered === 0) {
        statsContent.innerHTML = `<i>No matching records to summarize. (Total in dataset: ${totalEvents})</i>`;
        return;
    }

    // --- Data Aggregation ---
    let watchedCount = 0;
    let pinnedCount = 0;
    const byClassification = {};
    const topPlatforms = {};

    filteredEvents.forEach(event => {
        // Watch Status
        if ((event.Watched || "").toLowerCase() === "yes") watchedCount++;

        // Pinned Status (assuming a boolean/truthy property or check)
        if (isPinned(event.RecordID)) pinnedCount++;

        // Classification
        const classification = event.Classification || "Unclassified";
        byClassification[classification] = (byClassification[classification] || 0) + 1;

        // Platforms (handle comma separation and normalization)
        (event.Platform || "")
            .split(",")
            .map(p => p.trim())
            .filter(p => p) // Filter empty strings resulting from split
            .forEach(platform => {
                topPlatforms[platform] = (topPlatforms[platform] || 0) + 1;
            });
    });

    // --- Presentation Logic ---
    
    // Helper to calculate percentage safely (avoids division by zero, although handled above)
    const safePercent = (count, total) => total > 0 ? Math.round((count / total) * 100) : 0;

    const watchedPercent = safePercent(watchedCount, totalFiltered);
    const pinnedPercent = safePercent(pinnedCount, totalFiltered);

    // Create the Classification breakdown list
    const classificationList = Object.entries(byClassification)
        .sort(([k1], [k2]) => k1.localeCompare(k2)) // Sort alphabetically
        .map(([k, v]) => `&nbsp;&nbsp;${k}: ${v}`)
        .join("<br>");

    // Create the Top Platforms list
    const topPlatformList = Object.entries(topPlatforms)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])) // Sort by count, then alphabetically
        .slice(0, 5)
        .map(([p, count]) => `${p} (${count})`)
        .join(", ");

    // --- DOM Update ---
    statsContent.innerHTML = `
        <i>Stats for current selection of total ${totalEvents} events:</i><br>
        <b>Current Selection:</b> ${totalFiltered}<br>
        <b>Watched:</b> ${watchedCount} (${watchedPercent}%)<br>
        <b>Pinned:</b> ${pinnedCount} (${pinnedPercent}%)<br>
        <b>By Classification:</b><br>
        ${classificationList}
        <br><b>Top Platforms:</b> ${topPlatformList}
    `;
}
