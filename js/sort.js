// sort.js
/**
 * Sorts an array of events based on a specified field key from the domain configuration.
 * @param {Array<object>} events - The list of event records to sort.
 * @param {string} sortOrder - The key to sort by ("title" or "year").
 * @param {object} domain - The configuration object containing fieldMap.
 * @returns {Array<object>} A new, sorted array of events.
 */
export function applySort(events, sortOrder, domain) {
  console.log("🔀 applySort() called with:", sortOrder);

  if (!Array.isArray(events) || !domain?.fieldMap) return events;

  const fm = domain.fieldMap;
  const titleKey = fm.title || 'Title';
  const yearKey = fm.year || 'Year'; // Falls back to 'Year' if not mapped

  // Helper function to safely extract the primary year from complex strings (e.g., "1918–1920")
  const getNumericYear = (year) => {
    const rawYear = String(year || "").trim();
    // Extract the first part of a year range if present
    const firstYear = rawYear.split(/[–-]/)[0];
    return parseInt(firstYear) || 0; // Default to 0 if parsing fails
  };

  switch (sortOrder) {
    case "title":
      return [...events].sort((a, b) => (String(a[titleKey]) || '').localeCompare(String(b[titleKey]) || ''));
    case "year":
      return [...events].sort((a, b) => {
        const yearA = getNumericYear(a[yearKey]);
        const yearB = getNumericYear(b[yearKey]);
        return yearA - yearB;
      });
    default:
      return events;
  }
}
