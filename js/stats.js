// stats.js

/**
 * Updates the statistics panel with summary data for the filtered events.
 * @param {Array<object>} filteredEvents - The list of events currently displayed.
 * @param {object} domain - The configuration object containing fieldMap and labels.
 */
export function updateStats(filteredEvents, domain) {
  console.log("✅ updateStats called with", filteredEvents.length, "events");

  const statsContent = document.getElementById("statsContent");
  const total = filteredEvents.length;

  const fm = domain.fieldMap || {};
  const labels = domain.labels || {};
  
  // Use mapped keys for data attributes
  const watchedKey = fm.watched || 'Watched';
  const pinnedKey = fm.pinned || 'Pinned';
  const classificationKey = fm.classification || 'Classification';
  const platformKey = fm.platform || 'WatchOn';
  
  // Use mapped labels for display text
  const watchedLabel = labels.watchedLabel || 'Watched';
  const pinnedLabel = labels.pinnedLabel || 'Pinned';
  const classificationLabel = labels.classificationLabel || 'Classification';
  const platformLabel = labels.platformLabel || 'Platforms';

  if (total === 0) {
    statsContent.innerHTML = `<i>No matching records to summarize.</i>`;
    return;
  }

  let watchedCount = 0;
  let pinnedCount = 0;
  const byClassification = {};
  const topPlatforms = {};

  filteredEvents.forEach(event => {
    // Use mapped key and normalized check for Watched
    if (event[watchedKey] && String(event[watchedKey]).toLowerCase() === "yes") watchedCount++;
    
    // Use mapped key for Pinned check
    if (event[pinnedKey]) pinnedCount++;

    // Use mapped key for Classification grouping
    const classification = event[classificationKey] || "Unclassified";
    byClassification[classification] = (byClassification[classification] || 0) + 1;

    // Use mapped key for Platform grouping and splitting
    (event[platformKey] || "").split(",").forEach(p => {
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
    <b>Total Events:</b> ${total}<br>
    <b>${watchedLabel}:</b> ${watchedCount} (${Math.round((watchedCount / total) * 100)}%)<br>
    <b>${pinnedLabel}:</b> ${pinnedCount} (${Math.round((pinnedCount / total) * 100)}%)<br>
    <b>By ${classificationLabel}:</b><br>
    ${Object.entries(byClassification).map(([k, v]) => `&nbsp;&nbsp;${k}: ${v}`).join("<br>")}
    <br><b>Top ${platformLabel}:</b> ${topPlatformList}
  `;
}
