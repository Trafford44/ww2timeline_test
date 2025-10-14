// js/options.js - Manages the Options panel interactions.

/**
 * Attaches event listeners to all options controls (toggles and theme selector).
 * Note: The logic for loading and applying options on startup is now handled
 * by local-storage.js. This file focuses only on the UI wiring and saving state.
 * * @param {object} domain - The configuration object used for local storage key generation.
 * @param {function} updateApp - The main application update function (from main.js).
 */
export function setOptionsUIListeners(domain, updateApp) {
  const fm = domain.fieldMap; // Alias for fieldMap
  const hideWatchedToggle = document.getElementById("hideWatchedToggle");
  const hidePinnedToggle = document.getElementById("hidePinnedToggle");
  const challengeModeToggle = document.getElementById("challengeModeToggle");
  const themeSelect = document.getElementById("themeSelect");
  
  // Use a generic key that includes the domain's subject for better scoping
  const optionsKey = `timelineOptions_${domain.subject.replace(/\s/g, "")}`;
  
  /**
   * Saves the current state of all options to local storage.
   */
  function saveOptions() {
    const options = {
      theme: themeSelect?.value || "light",
      // Use the actual field name from the data to save the unique state
      [`hide_${fm.watched}`]: hideWatchedToggle?.checked || false,
      [`hide_${fm.pinned}`]: hidePinnedToggle?.checked || false,
      challengeMode: challengeModeToggle?.checked || false
    };
    localStorage.setItem(optionsKey, JSON.stringify(options));
  }

  // === Event Listeners ===
  
  // Toggles: Save options and then trigger the main application update 
  if (hideWatchedToggle) {
    hideWatchedToggle.addEventListener("change", () => {
      saveOptions();
      updateApp(); // Triggers re-filtering and re-rendering
    });
  }

  if (hidePinnedToggle) {
    hidePinnedToggle.addEventListener("change", () => {
      saveOptions();
      updateApp(); // Triggers re-filtering and re-rendering
    });
  }

  if (challengeModeToggle) {
    challengeModeToggle.addEventListener("change", () => {
      saveOptions();
      updateApp(); // Triggers re-filtering and re-rendering
    });
  }

  // Theme Select: Applies theme immediately and saves the option
  if (themeSelect) {    
    themeSelect.addEventListener("change", () => {
      // Remove both classes to ensure clean switch
      document.body.classList.remove("light", "dark");
      document.body.classList.add(themeSelect.value);
      saveOptions();
    });
  }

  console.log("🛠️ Options panel UI listeners wired up.");
}
