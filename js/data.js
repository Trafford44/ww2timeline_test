import { populateDropdowns } from './filters.js';
import { applyFilters } from './filters.js';
import { updateStats } from './stats.js';

export let data = [];

export async function fetchAndRenderData() {
  const initialPrompt = document.getElementById("initialPrompt");
  initialPrompt.textContent = "Loading data via Web App...";
  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbwuMhkWNZI71HWbZr18pe56ekjCVrn0SCliiFHOzIW60odC3CsOstRgUeMIEbg03xbeNA/exec");
    data = await response.json();
    populateDropdowns(data);
    toggleControls(true);
    applyFilters();
    updateStats(data);
  } catch (error) {
    console.error("Fetch error:", error);
    initialPrompt.textContent = `ERROR: Failed to load data. ${error.message}`;
    toggleControls(false);
  }
}
