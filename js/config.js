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
 * This function loads the single domain file and constructs the necessary features/settings objects.
 * @param {string} domainKey The key used to find the configuration file.
 * @returns {Promise<object | null>} The full configuration object or null on failure.
 */
export async function loadConfig(domainKey = 'ww2infilm') {
    // CRITICAL FIX: Ensure the 'config/' directory prefix is included and the simple filename is used.
    // We are only fetching ONE file: domain_[key].json
    const configPath = `config/domain_${domainKey}.json`; 
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
            return null; 
        }

        const domainConfig = await response.json();
        
        // --- 1. Features are defined here (based on the config file's existence) ---
        // These are hardcoded features for the generic app, not loaded from separate files.
        const features = {
            canPin: domainConfig.fieldMap.pinned ? true : false, // Check if 'pinned' field is mapped
            canWatch: domainConfig.fieldMap.watched ? true : false // Check if 'watched' field is mapped
        };
        
        // --- 2. Settings are constructed here, extracting key values from domainConfig ---
        const settings = {
            title: domainConfig.subject || "Domain Timeline Application",
            searchPlaceholder: `Search ${domainConfig.subject || 'Records'}...`,
            noDataMessage: `No data available for the ${domainConfig.subject || 'current domain'}.`,
            // CRITICAL FIX: Extract dataUrl from the loaded configuration for data.js
            dataUrl: domainConfig.dataUrl 
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
