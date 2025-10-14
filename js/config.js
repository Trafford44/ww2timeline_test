// --- Configuration & Utility Functions ---

/**
 * Gets the value of a URL query parameter.
 * @param {string} key The key of the parameter (e.g., 'domain').
 * @returns {string | null} The value of the parameter or null if not found.
 */
export function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

/**
 * Loads the configuration data (features, domain, settings) based on the domain key.
 * This is the generic loader for your application's domain files.
 * @param {string} domainKey The key used to find the configuration file.
 * @returns {Promise<object | null>} The full configuration object or null on failure.
 */
export async function loadConfig(domainKey) {
    // This path is used by the generic app structure (e.g., domain_ww2infilm_enhanced.json)
    const configPath = `./domain_${domainKey}.json`;
    console.log(`📡 Attempting to load configuration from: ${configPath}`);
    
    try {
        const response = await fetch(configPath);
        
        if (!response.ok) {
            // If the requested config fails, fall back to the default
            if (domainKey !== 'ww2infilm') {
                 console.warn(`⚠️ Configuration for '${domainKey}' not found. Falling back to default 'ww2infilm'.`);
                 return await loadConfig('ww2infilm');
            }
            console.error(`❌ Critical: Default domain config failed to load: ${response.status} ${response.statusText}`);
            return null; // Stop if the default also failed
        }

        const domainConfig = await response.json();
        
        // Features and Settings are constructed here, as they are not separate files anymore
        const features = {
            canPin: true,
            canWatch: true
        };
        
        const settings = {
            title: domainConfig.subject || "Domain Timeline Application",
            searchPlaceholder: `Search ${domainConfig.subject || 'Records'}...`,
            noDataMessage: `No data available for the ${domainConfig.subject || 'current domain'}.`
        };


        console.log(`✅ Configuration loaded successfully for: ${domainConfig.subject}`);
        
        return {
            features,
            domain: domainConfig,
            settings
        };

    } catch (error) {
        console.error("Critical error during config loading:", error);
        return null;
    }
}
