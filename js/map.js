// map.js
export function renderMapThumbs(events) {
  console.log("🗺️ renderMapThumbs() called");
  return events
    .filter(event => event.Location)
    .map(event => ({
      id: event.ID,
      title: event.Title,
      location: event.Location
    }));
}
