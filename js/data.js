export async function fetchAndRenderData(features, domain, settings) {
  const initialPrompt = document.getElementById("initialPrompt");
  initialPrompt.textContent = `Loading data for ${domain.subject}...`;

  try {
    const datasetMap = {
      "WWII Films": "testdata/ww2_infilm.json",
      "Scientific Discoveries": "testdata/science.json"
    };
    const subject = domain?.subject || "Scientific Discoveries";
    if (!datasetMap[subject]) {
      throw new Error(`No dataset mapped for domain: ${subject}`);
    }
    const datasetURL = datasetMap[subject];

    const response = await fetch(datasetURL);
    const data = await response.json(); // ✅ use local variable

    const [{ populateDropdowns, applyFilters, toggleControls }, { updateStats }] = await Promise.all([
      import('./filters.js'),
      import('./stats.js')
    ]);

    populateDropdowns(data);
    toggleControls(true);
    applyFilters();
    updateStats(data);

    return data; // ✅ return the dataset
  } catch (error) {
    console.error("Fetch error:", error);
    initialPrompt.textContent = `ERROR: Failed to load data. ${error.message}`;
    return []; // ✅ return empty array on failure
  }
}
