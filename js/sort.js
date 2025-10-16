// sort.js
export function applySort(events, sortOrder) {
  console.log("🔀 applySort() called with:", sortOrder);

  if (!Array.isArray(events)) return [];

  switch (sortOrder) {
    case "title":
      return [...events].sort((a, b) => a.Title.localeCompare(b.Title));
    case "year":
      return [...events].sort((a, b) => a.Year - b.Year);
    default:
      return events;
  }
}
