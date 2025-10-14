export async function loadWikipediaSummaries(events, domain) {
  console.log("✅ loadWikipediaSummaries() called");
  
  const fm = domain.fieldMap || {};
  // Assuming the field containing the Wikipedia page title is mapped as 'wikiTitle' 
  // or defaults to 'Wikipedia' based on the original code's implicit use.
  const wikiTitleKey = fm.wikiTitle || 'Wikipedia'; 

  const summaries = {};

  for (const event of events) {
    // 1. Use the dynamic key (wikiTitleKey) to check for the URL
    if (!event[wikiTitleKey]) continue;

    try {
      // 2. Use the dynamic key to encode the title
      const title = encodeURIComponent(event[wikiTitleKey]);
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
