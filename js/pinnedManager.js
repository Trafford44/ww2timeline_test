// Import the robust storage utilities for persistence
import { saveToLocal, loadFromLocal } from './local-storage.js'; 
import { logActivity } from './alerts/logger.js';
// Removed: import { errorHandler } from './alerts/errorUtils.js'; // Not needed here

const PINNED_KEY = "pinnedRecordIDs"; // Renamed key for clarity (from 'pinnedEvents')

// --- Internal Storage Helpers (Leveraging local-storage.js) ---

/**
 * Saves the current array of pinned IDs back to local storage using the robust helper.
 * @param {Array<string>} pinnedIds - Array of IDs to save.
 */
export function savePinned(pinnedIds) {
    logActivity("information", "savePinned", { count: pinnedIds.length });
    // Uses the robust helper to handle QuotaExceededError
    saveToLocal(PINNED_KEY, pinnedIds);
}

/**
 * Loads the array of pinned IDs from local storage using the robust helper.
 * @returns {Array<string>} Array of pinned IDs, or [] on load failure/not found.
 */
export function loadPinned() {
    // Uses the robust helper to handle JSON parsing errors
    // Ensure it defaults to an array on failure, which loadFromLocal is expected to do (returning null, which we convert here)
    const stored = loadFromLocal(PINNED_KEY);
    return Array.isArray(stored) ? stored : [];
}

// ----------------------------------------------------------------------

/**
 * Checks if a specific ID is currently pinned.
 * * @param {string} id - The ID of the event to check.
 * @returns {boolean} True if the event is pinned.
 */
export function isPinned(id) {
    // R1: Removed try/catch. R2: Removed excessive logging inside this frequent check.
    if (!id) return false;
    
    // Convert array to Set temporarily for fast lookup and then check inclusion
    const pinnedSet = new Set(loadPinned());
    return pinnedSet.has(String(id));
}

/**
 * Toggles the pinned status of a record and updates the persistent storage.
 * @param {string} id - The ID of the event to toggle.
 * @returns {boolean} The new pinned status (true if now pinned, false if now unpinned).
 */
export function togglePinned(id) {
    // R1: Removed try/catch.
    if (!id) {
        logActivity("warning", "togglePinned", { reason: "No ID provided." });
        return false;
    }

    logActivity("action", "togglePinned", { id });
    
    const pinned = new Set(loadPinned());
    let newStatus;
    
    if (pinned.has(String(id))) {
        // Remove
        pinned.delete(String(id));
        newStatus = false;
    } else {
        // Add
        pinned.add(String(id));
        newStatus = true;
    }
    
    savePinned([...pinned]);
    console.log(`Record ${id} is now ${newStatus ? 'pinned' : 'unpinned'}.`);
    
    return newStatus;
}
