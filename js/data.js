// data.js
import { logActivity } from './alerts/logger.js';
import { showAlert } from './alerts/alertUtils.js';
import { errorHandler } from './alerts/errorUtils.js';
import { normaliseEventDate, convertToLocalDate } from "./dateUtils.js";

export let dataset = [];

export async function fetchData(features, domain, settings) {
  const dataSource = settings?.dataSource || "localJSON";
  logActivity("information", "fetchData starting", { dataSource, domain: domain?.subject });
  
  let data;
  const initialPrompt = document.getElementById("initialPrompt");
  
  // 1. Show UI status
  const loadingMessage = `Loading data for ${domain?.subject || 'application'} from ${dataSource}...`;
  if (initialPrompt) initialPrompt.textContent = loadingMessage;
  // Store the alert instance so we can dismiss it later
  // const loadingAlert = showAlert(loadingMessage, "info", { autoDismiss: false });

  try {
      if (dataSource === "localJSON") {
          data = await loadLocalJSON(domain);
      } else if (dataSource === "googleSheets") {
          data = await loadGoogleSheet();
      } else {
          // Handle unrecognized data source explicitly
          throw new Error(`Unrecognized data source specified: ${dataSource}`);
      }

      // Final check on data (should be an array of event objects)
      if (!Array.isArray(data)) {
          throw new Error(`Data source (${dataSource}) did not return a valid array.`);
      }
   
      const enriched = enrichData(data); 
      dataset = enriched;

      logActivity("action", "fetchData successful", { count: dataset.length, dataSource });
      return dataset;
      
  } catch (error) {
      // 2. Error Logging and UI
      errorHandler(error, "populateDropdowns");
      showAlert(`Data loading failed: ${error.message}`, "error", { autoDismiss: false });
      // Return an empty array on failure
      return []; 
      
  } finally {
      // 3. UI Cleanup (Crucial!)
      // if (loadingAlert) loadingAlert.dismiss(); // Dismiss the persistent loading alert
      if (initialPrompt) initialPrompt.textContent = ''; // Clear the initial prompt
  }
}

export function enrichData(data) {
  return data.map(event => {
    const normalisedDate = normaliseEventDate(event.EventDate || event.EventYear);
    const eventYear = normalisedDate?.getFullYear?.() || event.EventYear || "Unknown";

    return {
      ...event,
      normalisedDate,
      eventYear,
      formattedLocalDate: normalisedDate
        ? convertToLocalDate(normalisedDate)
        : "Unknown"
    };
  });
}


async function loadLocalJSON(domain) {
  const datasetMap = {
      "WWII Films": "testdata/ww2_infilm.json",
      "Scientific Discoveries": "testdata/science.json"
  };

  const subject = domain?.subject?.trim();
  const url = datasetMap[subject || ""];

  if (!url) {
      // Throw an explicit error if the domain key is missing
      throw new Error(`No dataset mapped for domain subject: ${subject || "[empty subject]"}`);
  }
  
  logActivity("information", "loadLocalJSON fetching", { url }); // Log the URL

  const response = await fetch(url);  

  if (!response.ok) {
      // Log the status code clearly
      throw new Error(`Fetch failed with status: ${response.status} for URL: ${url}`);
  }

  const json = await response.json();
  
  if (!json || typeof json !== "object") {
      throw new Error("Invalid JSON structure received (not object/array).");
  }
  
  // Check 1: Ensure the expected format is an array (the dataset)
  if (!Array.isArray(json)) {
      // A successful fetch/parse, but wrong data type. Treat as a bug/bad config.
      throw new Error("Received JSON object, but expected an Array of events.");
  }

  return json;
}

async function loadGoogleSheet() {
  const url = "https://script.google.com/macros/s/AKfycbwuMhkWNZI71HWbZr18pe56ekjCVrn0SCliiFHOzIW60odC3CsOstRgUeMIEbg03xbeNA/exec";
  logActivity("information", "loadGoogleSheet fetching", { url });
  
  const response = await fetch(url);
  
  if (!response.ok) {
      throw new Error(`Google Sheet fetch failed with status: ${response.status}`);
  }

  const json = await response.json();
  
  if (!json || typeof json !== "object") {
      throw new Error("Invalid JSON structure received from Google Sheets (not object/array).");
  }

  // Check 1: Ensure the expected format is an array (the dataset)
  if (!Array.isArray(json)) {
      throw new Error("Received JSON object from Google Sheets, but expected an Array of events.");
  }

  return json;
}
