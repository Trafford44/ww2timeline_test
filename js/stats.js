import { logAction } from './alerts/logger.js';

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
export function updateStats(filteredEvents, totalEvents) {
  logAction("updateStats", { filteredEvents, totalEvents });
 
  try {
      const statsContent = document.getElementById("statsContent");
      const total = filteredEvents.length;
    
      if (total === 0) {
        statsContent.innerHTML = `<i>No matching records to summarize.</i>`;
        return;
      }
    
      let watchedCount = 0;
      let pinnedCount = 0;
      const byClassification = {};
      const topPlatforms = {};
    
      filteredEvents.forEach(event => {
        if (event.Watched === "Yes") watchedCount++;
        if (event.Pinned) pinnedCount++;
    
        const classification = event.Classification || "Unclassified";
        byClassification[classification] = (byClassification[classification] || 0) + 1;
    
        (event.Platform || "").split(",").forEach(p => {
          const platform = p.trim();
          if (platform) topPlatforms[platform] = (topPlatforms[platform] || 0) + 1;
        });
      });
    
      const topPlatformList = Object.entries(topPlatforms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([p, count]) => `${p} (${count})`)
        .join(", ");
    
      statsContent.innerHTML = `
        <i>Stats for current selection of total ${totalEvents} events:</i><br>
        <b>Current Selection:</b> ${total}<br>
        <b>Watched:</b> ${watchedCount} (${Math.round((watchedCount / total) * 100)}%)<br>
        <b>Pinned:</b> ${pinnedCount} (${Math.round((pinnedCount / total) * 100)}%)<br>
        <b>By Classification:</b><br>
        ${Object.entries(byClassification).map(([k, v]) => `&nbsp;&nbsp;${k}: ${v}`).join("<br>")}
        <br><b>Top Platforms:</b> ${topPlatformList}
      `;
  } catch (error) {
    handleError(error, "updateStats");
  }       
}
