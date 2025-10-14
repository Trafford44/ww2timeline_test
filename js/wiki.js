export async function loadWikipediaSummaries(events) {
  console.log("✅ loadWikipediaSummaries() called");
  
  const summaries = {};

  for (const event of events) {
    if (!event.Wikipedia) continue;

    try {
      const title = encodeURIComponent(event.Wikipedia);
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
      const data = await response.json();
      summaries[event.ID] = data.extract || "No summary available.";
    } catch (error) {
      console.warn(`Failed to fetch summary for ${event.Wikipedia}:`, error);
      summaries[event.ID] = "Error loading summary.";
    }
  }

  return summaries;
}
