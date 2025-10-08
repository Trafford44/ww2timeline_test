// sort.js
export function applySort(data, sortOrder) {
  console.log("🔀 applySort() called with:", sortOrder);

  if (!Array.isArray(data)) return [];

  switch (sortOrder) {
    case "title":
      return [...data].sort((a, b) => a.Title.localeCompare(b.Title));
    case "year":
      return [...data].sort((a, b) => a.Year - b.Year);
    default:
      return data;
  }
}
