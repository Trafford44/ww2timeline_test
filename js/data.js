// data.js

export let dataset = [];

export async function fetchData(features, domain, settings) {
  const initialPrompt = document.getElementById("initialPrompt");
  initialPrompt.textContent = `Loading data for ${domain.subject}...`;
  let data;
  
  try {
    const dataSource = settings?.dataSource || "googleSheets";
    if (dataSource == "localJSON") {
      console.log("📦 Data source is localJSON");
      const datasetMap = {
        "WWII Films": "testdata/ww2_infilm.json",
        "Scientific Discoveries": "testdata/science.json"
      };

      try {
        const domainSubject = domain?.subject?.trim();
        const datasetURL = datasetMap[domainSubject || ""];
      
        if (!datasetURL) {
          throw new Error(`No dataset mapped for domain: ${domainSubject || "[empty subject]"}`);
        }
        // fetch is a built-in browser API
        const response = await fetch(datasetURL);      
        if (!response.ok) {
          throw new Error(`Fetch failed with status: ${response.status}`);
        }
        // parse to JSON
        const sheetData = await response.json();      
        if (!sheetData || typeof sheetData !== "object") {
          throw new Error("Invalid JSON structure received");
        }
      
        data = sheetData;
        
      } catch (error) {
        console.error("Error loading dataset:", error);
        // Optionally: show fallback UI, log to telemetry, or notify user
      }


      
    }
    else if (dataSource == "googleSheets") {
      console.log("📦 Data source is googleSheets");
      try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbwuMhkWNZI71HWbZr18pe56ekjCVrn0SCliiFHOzIW60odC3CsOstRgUeMIEbg03xbeNA/exec");
      
        if (!response.ok) {
          throw new Error(`Fetch failed with status: ${response.status}`);
        }
      
        const sheetData = await response.json();
      
        if (!sheetData || typeof sheetData !== "object") {
          throw new Error("Invalid JSON structure received from Google Sheets");
        }
      
        data = sheetData;
      } catch (error) {
        console.error("Error loading sheet data:", error);
        // Optionally: show fallback UI, retry, or notify user
      }

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
