export function updateStats(filteredData) {
  console.log("✅ updateStats called with", filteredData.length, "items");

  const statsContent = document.getElementById("statsContent");
  const total = filteredData.length;
  const byClassification = {};
  const watchedCount = filteredData.filter(f => f.Watched === "Yes").length;
  const pinnedCount = filteredData.filter(f => f.Pinned).length;

  filteredData.forEach(f => {
    const key = f.Classification || "Unclassified";
    byClassification[key] = (byClassification[key] || 0) + 1;
  });

  const topPlatforms = {};
  filteredData.forEach(f => {
    (f.WatchOn || "").split(",").forEach(p => {
      const key = p.trim();
      if (key) topPlatforms[key] = (topPlatforms[key] || 0) + 1;
    });
  });

  const topPlatformList = Object.entries(topPlatforms)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p, count]) => `${p} (${count})`)
    .join(", ");

  statsContent.innerHTML = `
    <b>Total Films:</b> ${total}<br>
    <b>Watched:</b> ${watchedCount}<br>
    <b>Pinned:</b> ${pinnedCount}<br>
    <b>By Classification:</b><br>
    ${Object.entries(byClassification).map(([k, v]) => `&nbsp;&nbsp;${k}: ${v}`).join("<br>")}
    <br><b>Top Platforms:</b> ${topPlatformList}
  `;
}
