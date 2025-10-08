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

export function syncLocalState() {
  console.log("💾 syncLocalState() called");

  // Example usage — replace with your actual keys
  const filters = loadFromLocal("timelineFilters");
  const sortOrder = loadFromLocal("timelineSort");

  if (filters) {
    console.log("Loaded filters from localStorage:", filters);
    // applyFilters(filters); // if you have a function for this
  }

  if (sortOrder) {
    console.log("Loaded sort order from localStorage:", sortOrder);
    // applySort(sortOrder); // if you have a function for this
  }
}
