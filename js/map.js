// map.js
export function mapLocations(records) {
  return records
    .filter(r => r.Location)
    .map(r => ({
      id: r.ID,
      title: r.Title,
      location: r.Location
    }));
}
