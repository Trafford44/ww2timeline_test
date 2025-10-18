// data.js

export let dataset = [];

export async function fetchAndRenderData(features, domain, settings) {
  const initialPrompt = document.getElementById("initialPrompt");
  initialPrompt.textContent = `Loading data for ${domain.subject}...`;
  let data;
  
  try {
    const subject = settings?.dataSource || "googleSheets";
    if (subject == "localJSON") {
      const datasetMap = {
        "WWII Films": "testdata/ww2_infilm.json",
        "Scientific Discoveries": "testdata/science.json"
      };
      const subject = domain?.subject || "WWII Films";
      if (!datasetMap[subject]) {
        throw new Error(`No dataset mapped for domain: ${subject}`);
      }
      const datasetURL = datasetMap[subject];
      //fetch is a built-in browser API
      const response = await fetch(datasetURL);
      //parse to JSON
      data = await response.json();
    }
    else if (subject == "googleSheets") {
      const response = await fetch("https://script.google.com/macros/s/AKfycbwuMhkWNZI71HWbZr18pe56ekjCVrn0SCliiFHOzIW60odC3CsOstRgUeMIEbg03xbeNA/exec");
      const sheetData = await response.json();
      data = sheetData;
    }
    console.log("📦 Loaded dataset:", data);
    dataset = Array.isArray(data) ? data : [];
    //dataset = data; // ✅ store globally
    
    return data;
  } catch (error) {
    console.error("❌ Fetch error:", error);
    initialPrompt.textContent = `ERROR: Failed to load data. ${error.message}`;
    dataset = [];
    return [];
  }
}
