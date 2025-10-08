export let data = [];

export async function fetchAndRenderData(features, domain, settings) {
  const initialPrompt = document.getElementById("initialPrompt");
  initialPrompt.textContent = `Loading data for ${domain.subject}...`;

  try {
    const domain = {
      subject: "WWII Films"
    };

    // Load dataset based on domain
    const datasetMap = {
      "WWII Films": "../testdata/ww2_infilm.json",
      "Scientific Discoveries": "../testdata/science.json"
    };
    const subject = domain?.subject || "WWII Films";
    if (!datasetMap[subject]) {
      throw new Error(`No dataset mapped for domain: ${subject}`);
    }
    const datasetURL = datasetMap[subject];

    if (!datasetMap[domain.subject]) {
      throw new Error(`No dataset mapped for domain: ${domain.subject}`);
    }
    //const datasetURL = datasetMap[domain.subject];

    const response = await fetch(datasetURL);
    data = await response.json();

    // Lazy-load filters and stats modules
    const [{ populateDropdowns, applyFilters, toggleControls }, { updateStats }] = await Promise.all([
      import('./filters.js'),
      import('./stats.js')
    ]);

    populateDropdowns(data);
    toggleControls(true);
    applyFilters();
    updateStats(data);
  } catch (error) {
    console.error("Fetch error:", error);
    initialPrompt.textContent = `ERROR: Failed to load data. ${error.message}`;
  }
}
