// wiki.js
export async function loadWikipediaSummaries(records) {
  const summaries = {};

  for (const record of records) {
    if (!record.Wikipedia) continue;

    try {
      const title = encodeURIComponent(record.Wikipedia);
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
      const data = await response.json();
      summaries[record.ID] = data.extract || "No summary available.";
    } catch (error) {
      console.warn(`Failed to fetch summary for ${record.Wikipedia}:`, error);
      summaries[record.ID] = "Error loading summary.";
    }
  }

  return summaries;
}
