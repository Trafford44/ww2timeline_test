// local-storage.js

/**
 * Safely saves a key/value pair to the browser's localStorage.
 * @param {string} key - The unique storage key.
 * @param {any} value - The value to store.
 */
export function saveToLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

/**
 * Safely retrieves and parses a value from the browser's localStorage.
 * @param {string} key - The unique storage key.
 * @returns {any | null} The parsed value, or null if not found or an error occurs.
 */
export function loadFromLocal(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
    return null;
  }
}

/**
 * Synchronizes the application state (filters, sort) with browser localStorage,
 * ensuring unique keys for each domain to prevent conflicts.
 * * @param {Array<object>} records - The full dataset.
 * @param {object} domain - The current domain configuration.
 */
export function syncLocalState(records, domain) {
  console.log("💾 syncLocalState() called");

  // Create a unique prefix based on the domain subject.
  const domainPrefix = (domain?.subject || 'default_domain').toLowerCase().replace(/\s/g, '_');
  
  // Define unique, domain-specific keys for state storage
  const filterKey = `${domainPrefix}_timelineFilters`;
  const sortKey = `${domainPrefix}_timelineSort`;


  // Load and apply filters
  const filters = loadFromLocal(filterKey);
  if (filters) {
    console.log(`Loaded filters from localStorage (${filterKey}):`, filters);
    import('./filters.js').then(({ applyFilters }) => {
      // NOTE: Assuming applyFilters can handle applying a saved filters object.
      applyFilters(records, filters); 
    });
  }

  // Load and apply sort order
  const sortOrder = loadFromLocal(sortKey);
  if (sortOrder) {
    console.log(`Loaded sort order from localStorage (${sortKey}):`, sortOrder);
    import('./sort.js').then(({ applySort }) => {
      applySort(records, sortOrder); // ✅ apply sort to data
    });      
  }
}
