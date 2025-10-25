// data.js
// logs actions, if functionality enabled (calls throttledLogAction)

import { reportError } from './errorUtils.js';
import { logAction } from './logger.js';

export let dataset = [];

export async function fetchData(features, domain, settings) {
  const initialPrompt = document.getElementById("initialPrompt");
  initialPrompt.textContent = `Loading data for ${domain.subject}...`;

  logAction("fetchData", { features, domain, settings });

  try {
    const dataSource = settings?.dataSource || "localJSON";
    let data;

    if (dataSource === "localJSON") {

      data = await loadLocalJSON(domain);
    } else if (dataSource === "googleSheets") {
      data = await loadGoogleSheet();
    }

    dataset = Array.isArray(data) ? data : [];
    return dataset;
  } catch (error) {
    reportError("Failed to load data", error, { domain, settings }, () => {
      fetchData(features, domain, settings);
    });
    //dataset = [];
    return dataset;
  }
console.log("got to here also");
}

async function loadLocalJSON(domain) {

  //throttledLogAction("loadLocalJSON", { domain });
  // Use logAction() Directly for Low-Frequency Calls (was finding that the throttling was stopping this logging since < 1000ms)
  // another option:  Instead of sharing one throttled function, define distinct ones:
  //      const throttledFetchLog = throttle(logAction, 1000);
  //      const throttledLoadLog = throttle(logAction, 1000);

    logAction("loadLocalJSON", { domain });

  const datasetMap = {
    "WWII Films": "testdata/ww2_infilm.json",
    "Scientific Discoveries": "testdata/science.json"
  };

  const subject = domain?.subject?.trim();
  const url = datasetMap[subject || ""];

  if (!url) {
    throw new Error(`No dataset mapped for domain: ${subject || "[empty subject]"}`);
  }

    
  const response = await fetch(url);


  if (!response.ok) {
    throw new Error(`Fetch failed with status: ${response.status}`);
  }

  const json = await response.json();
  if (!json || typeof json !== "object") {
    throw new Error("Invalid JSON structure received");
  }


  return json;
}

async function loadGoogleSheet() {

  logAction("loadGoogleSheet");

  const response = await fetch("https://script.google.com/macros/s/AKfycbwuMhkWNZI71HWbZr18pe56ekjCVrn0SCliiFHOzIW60odC3CsOstRgUeMIEbg03xbeNA/exec");
  if (!response.ok) {
    throw new Error(`Fetch failed with status: ${response.status}`);
  }

  const json = await response.json();
  if (!json || typeof json !== "object") {
    throw new Error("Invalid JSON structure received from Google Sheets");
  }

  return json;
}
