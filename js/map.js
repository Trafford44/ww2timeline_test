// map.js
export function enableMapThumb(records) {
  console.log("🗺️ renderMapThumbs() called");
  return records
    .filter(r => r.Location)
    .map(r => ({
      id: r.ID,
      title: r.Title,
      location: r.Location
    }));
}
