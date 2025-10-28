import { logActivity } from './alerts/logger.js';

/**
 * Filters the list of events to those that have a location, and maps them
 * to a simplified object containing only the necessary data for map thumbnails.
 * * @param {Array<Object>} events - The array of event records.
 * @returns {Array<Object>} An array of simplified map thumbnail objects.
 */
export function renderMapThumbs(events) {
    // 1. Logging and Input Validation
    logActivity("info", "renderMapThumbs initiated", { eventCount: events?.length });
    
    // Safety check: ensure 'events' is an array before trying to filter/map
    if (!Array.isArray(events)) {
        logActivity("warning", "renderMapThumbs", { reason: "Input is not an array." });
        return [];
    }

    // 2. Core Logic (Synchronous: no try/catch needed)
    return events
        // Filter out events where the Location field is empty or falsy
        .filter(event => event.Location)
        // Map the remaining events to the required output format
        .map(event => ({
            id: event.ID,
            title: event.Title,
            location: event.Location
        }));
}
