import { logActivity } from './alerts/logger.js';

/**
 * Maps a comma-separated string of platforms to a string of HTML icon spans.
 * * @param {string | null | undefined} PlatformText - The raw string of platforms from the data.
 * @returns {string} The concatenated HTML string of platform icon spans.
 */
export function getPlatformIcons(PlatformText) {
    // 1. Logging and Safety Check
    logActivity("info", "getPlatformIcons initiated");
    
    // Safely handle null/undefined/empty string input
    if (!PlatformText) return '';
    
    // 2. Core Logic (Synchronous: no try/catch needed)
    
    const platformMap = {
        // Lowercase keys for matching, TitleCase values for display/class names
        netflix: 'Netflix', prime: 'Prime', youtube: 'YouTube', apple: 'Apple',
        tvnz: 'TVNZ', tvnzplus: 'TVNZ', neon: 'Neon', beamafilm: 'Beamafilm',
        arovision: 'AroVision', plex: 'Plex', mubi: 'MUBI', disney: 'Disney',
        microsoft: 'Microsoft', google: 'Google', archive: 'Archive', dvd: 'DVD'
    };
    
    const seen = new Set();
    const icons = [];
    
    // Process the input string
    PlatformText.split(',')
        .forEach(entry => {
            // Clean the entry: trim, lowercase, remove non-alphanumeric chars (except '+' if needed)
            const clean = entry.trim().toLowerCase().replace(/[^a-z0-9+]/gi, '');
            
            // Iterate through the platform map keys for matching
            for (const key in platformMap) {
                // Check if the cleaned entry includes the key AND if we haven't already added this icon
                if (clean.includes(key) && !seen.has(key)) {
                    seen.add(key);
                    const displayName = platformMap[key];
                    const iconClass = platformMap[key]; // Use the capitalized name for the class lookup
                    
                    icons.push(`<span class="platform-icon icon-${iconClass}" title="Available on ${displayName}"></span>`);
                    
                    // Stop checking for other matches in this single entry once a match is found
                    break;
                }
            }
        });
        
    return icons.join('');
}
