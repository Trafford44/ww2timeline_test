// map.js
/**
 * Processes events to extract data needed for map thumbnail generation.
 * @param {Array<object>} events - The event records to process.
 * @param {object} domain - The configuration object containing fieldMap.
 * @returns {Array<object>} An array of objects with id, title, and location keys.
 */
export function renderMapThumbs(events, domain) {
  console.log("🗺️ renderMapThumbs() called");

  const fm = domain.fieldMap || {};
  // Use mapped keys, falling back to original hardcoded names if missing from config
  const locationKey = fm.location || 'Location';
  const titleKey = fm.title || 'Title';
  // Use the canonical 'RecordID' key for consistent event identification
  const idKey = 'RecordID';

  return events
    // Filter by the configured location field
    .filter(event => event[locationKey]) 
    .map(event => ({
      // Map to generic keys using domain-specific data keys
      id: event[idKey],
      title: event[titleKey],
      location: event[locationKey]
    }));
}
