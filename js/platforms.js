// platforms.js
/**
 * Generates platform icon HTML based on the watch string, using the domain's configured platform map.
 * @param {string} watchOnText - The comma-separated string of platforms from the event record.
 * @param {object} domain - The configuration object.
 * @returns {string} HTML string containing platform icons.
 */
export function getPlatformIcons(watchOnText, domain) {
    // Return early if we have no text, no domain config, or no platform map defined in the config
    if (!watchOnText || !domain || !domain.platformIconMap) return '';
    
    // Retrieve the platform mapping from the domain configuration
    const platformMap = domain.platformIconMap; 

    const seen = new Set();
    const icons = [];
    
    watchOnText.split(',').forEach(entry => {
        // Clean the entry (e.g., "Netflix (free)" -> "netflixfree") for reliable lookup
        const clean = entry.trim().toLowerCase().replace(/[^a-z0-9+]/gi, '');
        
        // Iterate over the keys defined in the domain configuration
        for (const key in platformMap) {
            // Check if the clean data entry contains the platform key AND we haven't processed it yet
            if (clean.includes(key) && !seen.has(key)) {
                seen.add(key);
                // The class name uses the Display Name (e.g., icon-Netflix) for CSS styling
                icons.push(`<span class="platform-icon icon-${platformMap[key]}" title="Available on ${platformMap[key]}"></span>`);
                break;
            }
        }
    });
    return icons.join('');
}
