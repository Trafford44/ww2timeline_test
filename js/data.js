// data.js

// Global variable to hold the entire dataset after loading.
export let dataset = [];

/**
 * Fetches the domain-specific dataset and stores it globally.
 * It determines the data URL based on the provided settings configuration.
 *
 * @param {object} features - Application feature flags.
 * @param {object} domain - Domain-specific configuration (field maps, labels).
 * @param {object} settings - Application settings, including the data URL.
 * @returns {Promise<Array<object>>} The loaded dataset array, or an empty array on failure.
 */
export async function fetchAndRenderData(features, domain, settings) {
  const initialPrompt = document.getElementById("initialPrompt");
  initialPrompt.textContent = `Loading data for ${domain.subject}...`;

    if (!settings) {
      throw new Error(`settings is empty`);
    }
  
  try {
    // Get the data URL directly from the settings file, which is loaded via config.js.
    const datasetURL = settings.dataURL;
    
    if (!datasetURL) {
      throw new Error(`Data URL is missing from the settings configuration for ${domain.subject}.`);
    }

    const response = await fetch(datasetURL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("📦 Loaded dataset:", data);

    dataset = data; // ✅ store globally for use by modules like filters.js
    return data;
  } catch (error) {
    console.error("❌ Fetch error:", error);
    initialPrompt.textContent = `ERROR: Failed to load data. ${error.message}`;
    dataset = [];
    return [];
  }
}
