// js/wiki.js - Manages Wikipedia integration

// Global variable to store the wiki base URL or settings if needed later.
let wikiDomainConfig = {};

/**
 * Initializes the Wikipedia integration manager.
 * Stores the domain configuration and checks if the feature is enabled.
 * This function must be exported to be called by main.js.
 * @param {object} domain The configuration object.
 */
export function initWikiManager(domain) {
    wikiDomainConfig = domain;
    if (domain.externalSources?.wikipedia) {
        console.log("📚 Wikipedia integration enabled.");
    } else {
        console.log("📚 Wikipedia integration disabled.");
    }
}

/**
 * Asynchronously loads Wikipedia summaries for events that have a Wikipedia title defined.
 * @param {Array<object>} events - The list of event records.
 * @param {object} domain - The configuration object containing fieldMap.
 * @returns {Promise<object>} An object mapping RecordID to the Wikipedia summary extract.
 */
export async function loadWikipediaSummaries(events, domain) {
  console.log("✅ loadWikipediaSummaries() called");
  
  const fm = domain.fieldMap || {};
  // Use the mapped key for the Wikipedia page title
  const wikiTitleKey = fm.wikipedia || 'Wikipedia'; 

  // Check if the feature is globally enabled before fetching
  if (!domain.externalSources?.wikipedia) {
      console.log("Skipping Wikipedia load: feature is disabled in config.");
      return {};
  }

  const summaries = {};

  for (const event of events) {
    // 1. Use the dynamic key (wikiTitleKey) to check for the title
    if (!event[wikiTitleKey]) continue;

    try {
      // 2. Use the dynamic key to encode the title
      const title = encodeURIComponent(event[wikiTitleKey]);
      // The API endpoint is always the same for simple summaries
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
      const data = await response.json();
      
      // 3. Use the canonical event ID (RecordID) as the storage key
      summaries[event.RecordID] = data.extract || "No summary available.";
    } catch (error) {
      console.warn(`Failed to fetch summary for ${event[wikiTitleKey]}:`, error);
      summaries[event.RecordID] = "Error loading summary.";
    }
  }

  return summaries;
}
