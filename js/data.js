// data.js

export let dataset = [];

export async function fetchAndRenderData(features, domain, settings) {
  const initialPrompt = document.getElementById("initialPrompt");
  initialPrompt.textContent = `Loading data for ${domain.subject}...`;

  try {
    const datasetMap = {
      "WWII Films": "testdata/ww2_infilm.json",
      "Scientific Discoveries": "testdata/science.json"
    };
    const subject = domain?.subject || "WWII Films";
    if (!datasetMap[subject]) {
      throw new Error(`No dataset mapped for domain: ${subject}`);
    }
    const datasetURL = datasetMap[subject];
    const response = await fetch(datasetURL);
    const data = await response.json();
    console.log("📦 Loaded dataset:", data);

    dataset = data; // ✅ store globally
    return data;
  } catch (error) {
    console.error("❌ Fetch error:", error);
    initialPrompt.textContent = `ERROR: Failed to load data. ${error.message}`;
    dataset = [];
    return [];
  }
}
