// sort.js

import { logActivity } from './alerts/logger.js';

/**
 * Sorts an array of events based on the specified sort order (Title or Year).
 * Returns a new sorted array, leaving the original array untouched.
 * * @param {Array<Object>} events - The array of event records.
 * @param {string} sortOrder - The field to sort by ('title', 'year', or default).
 * @returns {Array<Object>} The sorted array, or the original array if sortOrder is default or invalid.
 */
export function applySort(events, sortOrder) {
    logActivity("information", "applySort initiated", { sortOrder, eventCount: events?.length });
    
    // Safety check: ensure 'events' is an array.
    if (!Array.isArray(events)) {
        logActivity("warning", "applySort", { reason: "Input is not an array." });
        return [];
    }

    // Create a shallow copy of the array before sorting to maintain immutability.
    const sortedEvents = [...events];
    
    // Core Logic (Synchronous: no try/catch needed)
    switch (sortOrder) {
        case "title":
            // Use localeCompare for correct alphabetical/string sorting.
            return sortedEvents.sort((a, b) => (a.Title || '').localeCompare(b.Title || ''));
        case "year":
            // Direct subtraction for numeric sorting (assuming Year is a number or convertible).
            // Safely handle null/undefined years by treating them as 0 or a placeholder.
            return sortedEvents.sort((a, b) => (a.Year || 0) - (b.Year || 0));
        default:
            // Return the original copy if no valid sort order is specified.
            return events; 
    }
}
