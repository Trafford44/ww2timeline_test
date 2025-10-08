export function saveToLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

export function loadFromLocal(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
    return null;
  }
}

export function syncLocalState(records) {
  console.log("💾 syncLocalState() called");

  // Example usage — replace with your actual keys
  const filters = loadFromLocal("timelineFilters");
  const sortOrder = loadFromLocal("timelineSort");

  if (filters) {
    console.log("Loaded filters from localStorage:", filters);
    import('./filters.js').then(({ applyFilters }) => {
      applyFilters(records, filters); // ✅ apply filters to data
    });
  }

  if (sortOrder) {
    console.log("Loaded sort order from localStorage:", sortOrder);
    import('./sort.js').then(({ applySort }) => {
      applySort(records, sortOrder); // ✅ apply sort to data
  }
}
