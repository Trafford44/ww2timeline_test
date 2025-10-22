// stats.js

export function updateStats(filteredEvents) {
  console.log("✅ updateStats called with", filteredEvents.length, "events");

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
    <b>Total Events:</b> ${total}<br>
    <b>Watched:</b> ${watchedCount} (${Math.round((watchedCount / total) * 100)}%)<br>
    <b>Pinned:</b> ${pinnedCount} (${Math.round((pinnedCount / total) * 100)}%)<br>
    <b>By Classification:</b><br>
    ${Object.entries(byClassification).map(([k, v]) => `&nbsp;&nbsp;${k}: ${v}`).join("<br>")}
    <br><b>Top Platforms:</b> ${topPlatformList}
  `;
}
