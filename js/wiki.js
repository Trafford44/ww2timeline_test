import { errorHandler } from './alerts/errorUtils.js';
import { logActivity } from './alerts/logger.js';

/**
 * Fetches Wikipedia summaries for a list of events that have a Wikipedia title.
 * * @param {Array<Object>} events - The array of event records.
 * @returns {Promise<Object>} A promise that resolves to an object mapping Event ID to its summary text.
 */
export async function loadWikipediaSummaries(events) {
    logActivity("info", "loadWikipediaSummaries initiated", { eventCount: events?.length });
    
    // R1: Robustness check
    if (!Array.isArray(events) || events.length === 0) {
        return {};
    }

    const summaries = {};
    
    // R2: Core Logic with Essential Internal Error Handling
    for (const event of events) {
        // Skip if no Wikipedia title is provided
        if (!event.Wikipedia) continue;
        
        const eventId = event.ID;
        const wikipediaTitle = event.Wikipedia;

        try {
            const title = encodeURIComponent(wikipediaTitle);
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
            
            // Note: If you have many events, consider using Promise.allSettled
            // outside the loop for concurrent requests. For now, sequential is safer.
            const response = await fetch(url);
            
            if (!response.ok) {
                // Check HTTP status explicitly
                throw new Error(`Fetch failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Store the summary, defaulting to a custom message if extract is missing
            summaries[eventId] = data.extract || `Summary not found for "${wikipediaTitle}".`;
            
        } catch (error) {
            // CATCH: This is correct. Handle individual network/parse failure gracefully.
            console.warn(`Failed to fetch Wikipedia summary for "${wikipediaTitle}":`, error.message);
            logActivity("warning", "Wikipedia fetch failed", { title: wikipediaTitle, error: error.message });
            summaries[eventId] = "Error loading summary.";
        }
    }
    
    // R3: Removed the external try/catch. If an error occurs outside the loop 
    // (e.g., event listener failure), it will naturally reject the Promise and be
    // caught by the caller, which is the desired behavior for an async function.
    
    logActivity("info", "loadWikipediaSummaries complete", { summariesCount: Object.keys(summaries).length });
    return summaries;
}
