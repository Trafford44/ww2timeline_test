import { errorHandler } from './alerts/errorUtils.js';
import { logActivity } from './alerts/logger.js';

/**
 * Safely saves data to local storage, handling potential QuotaExceededError.
 * @param {string} key - The key under which to store the value.
 * @param {any} value - The data to store.
 */
export function saveToLocal(key, value) {
    // Log the initiation of the save, but use the debounced logger if this is called frequently
    logActivity("info", "saveToLocal", { key });
    
    try {
        localStorage.setItem(key, JSON.stringify(value));
        logActivity("action", "saveToLocal success", { key });
    } catch (error) {
        // Essential catch: Handles QuotaExceededError or SecurityError
        errorHandler(error, `Failed to save item '${key}' to localStorage. Storage limits exceeded or security restriction.`);
    }
}

/**
 * Safely loads data from local storage, handling potential JSON parsing errors.
 * @param {string} key - The key to load the value from.
 * @returns {any | null} The parsed value or null if not found or corrupted.
 */
export function loadFromLocal(key) {
    logActivity("info", "loadFromLocal", { key });
    
    try {
        const value = localStorage.getItem(key);
        
        if (value === null) {
            logActivity("info", "loadFromLocal", { key, status: "Not found" });
            return null;
        }

        // Essential catch: Handles JSON SyntaxError if data is corrupted
        const parsedValue = JSON.parse(value);
        logActivity("action", "loadFromLocal success", { key });
        return parsedValue;

    } catch (error) {
        // Catches JSON.parse SyntaxError (corrupted data) or other unexpected read errors
        errorHandler(error, `Failed to parse data for key '${key}'. Data may be corrupted.`);
        return null; // Return null on failure to prevent app using bad data
    }
}

/**
 * Synchronizes application state (filters, sort) from local storage and applies them.
 * * @param {Array} records - The current dataset to apply state to.
 */
export function syncLocalState(records) {
    logActivity("info", "syncLocalState initiated", { recordsCount: records.length });
    
    // loadFromLocal is now robust and will log errors internally, so no catch needed here.
    const filters = loadFromLocal("timelineFilters");
    const sortOrder = loadFromLocal("timelineSort");

    if (filters) {
        // Use .catch() to handle potential errors from the dynamic import or the execution of applyFilters
        import('./filters.js').then(({ applyFilters }) => {
            // Apply the filters to the data
            applyFilters(); // Assumed applyFilters now uses the global dataset and reads filters from DOM/local
        })
        .catch(error => {
            errorHandler(error, "Failed to apply saved filter state.");
        });
    }

    if (sortOrder) {
        // Use .catch() to handle potential errors from the dynamic import or the execution of applySort
        import('./sort.js').then(({ applySort }) => {
            console.log("Loaded sort order from localStorage:", sortOrder);
            applySort(records, sortOrder);
        })
        .catch(error => {
            errorHandler(error, "Failed to apply saved sort state.");
        });
    }
}
