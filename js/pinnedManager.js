// pinnedManager.js

// Internal variable to store the domain-specific key. Default is used before initialization.
let _globalPinnedKey = "default_domain_pinnedEvents";

/**
 * Initializes the Pinned Manager with a domain-specific key based on the subject.
 * This function MUST be called once on application load from main.js.
 * * @param {object} domain - The configuration object containing the 'subject'.
 */
export function initPinnedManager(domain) {
  // Use the domain subject (e.g., "WWII Films") to create a unique, URL-friendly prefix.
  const domainPrefix = (domain?.subject || 'default_domain').toLowerCase().replace(/\s/g, '_');
  _globalPinnedKey = `${domainPrefix}_pinnedEvents`;
  console.log(`📌 Pinned Manager initialized with key: ${_globalPinnedKey}`);
}

/**
 * Saves the current array of pinned record IDs to localStorage using the domain-specific key.
 * @param {Array<string>} pinnedIds - The IDs of pinned records.
 */
function savePinned(pinnedIds) {
  localStorage.setItem(_globalPinnedKey, JSON.stringify(pinnedIds));
}

/**
 * Loads the array of pinned record IDs from localStorage using the domain-specific key.
 * @returns {Array<string>} The list of pinned IDs, or an empty array if none are found.
 */
export function loadPinned() {
  const stored = localStorage.getItem(_globalPinnedKey);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Checks if a given record ID is currently in the list of pinned events.
 * @param {string} id - The RecordID to check.
 * @returns {boolean} True if the record is pinned.
 */
export function isPinned(id) {
  return loadPinned().includes(id);
}

/**
 * Adds or removes a record ID from the list of pinned events.
 * Updates localStorage immediately.
 * @param {string} id - The RecordID to toggle.
 */
export function togglePinned(id) {
  const pinned = new Set(loadPinned());
  pinned.has(id) ? pinned.delete(id) : pinned.add(id);
  savePinned([...pinned]);
  console.log("Pinned events now:", [...pinned]); // ✅ Debug output
}
