export function setupOptions(applyFilters) {
  const hideWatchedToggle = document.getElementById("hideWatchedToggle");
  const hidePinnedToggle = document.getElementById("hidePinnedToggle");
  const challengeModeToggle = document.getElementById("challengeModeToggle");
  const themeSelect = document.getElementById("themeToggleButton");
  
  console.log("Theme select:", themeSelect);
  console.log("🔧 setupOptions() is running");
  
  // === Load saved options ===
  // localStorage is a browser API that lets you store key/value pairs persistently in the user’s browser.
  const saved = JSON.parse(localStorage.getItem("timelineOptions") || "{}");

  // --- CRITICAL FIX FOR BOOLEAN LOADING ---
  /**
   * Helper function to safely convert the loaded state to a boolean.
   * It handles both boolean `true/false` and stored string `"true"/"false"` values.
   */
  const isEnabled = (value) => {
    // Check if the value is the boolean true OR the string "true"
    return value === true || value === "true";
  };
  
  // Apply theme
  const theme = saved.theme || "light";
  document.body.classList.add(theme);
  //if (themeSelect) themeSelect.value = theme;
  if (themeSelect) themeSelect.textContent = theme === 'dark' ? '☀️ Toggle Light Mode' : '🌙 Toggle Dark Mode';

  // Apply toggles using the safe isEnabled check
  if (hideWatchedToggle) hideWatchedToggle.checked = isEnabled(saved.hideWatched);
  if (hidePinnedToggle) hidePinnedToggle.checked = isEnabled(saved.hidePinned);
  if (challengeModeToggle) challengeModeToggle.checked = isEnabled(saved.challengeMode);
  
  // === Save options to localStorage ===
  function saveOptions() {
    const options = {
      //theme: themeSelect?.value || "light",
      theme: document.body.classList.contains('dark') ? 'dark' : 'light',
      
      // Save actual JavaScript boolean values
      hideWatched: hideWatchedToggle?.checked || false,
      hidePinned: hidePinnedToggle?.checked || false,
      challengeMode: challengeModeToggle?.checked || false
    };
    localStorage.setItem("timelineOptions", JSON.stringify(options));
  }

  // === Event Listeners ===
  // Listeners are correct, they call saveOptions() and applyFilters()
  if (hideWatchedToggle) {
    hideWatchedToggle.addEventListener("change", () => {
      console.log("🔄 Hide Watched toggled");
      saveOptions();
      applyFilters();
    });
  }

  if (hidePinnedToggle) {
    hidePinnedToggle.addEventListener("change", () => {
      console.log("🔄 Hide Pinned toggled");
      saveOptions();
      applyFilters();
    });
  }

  if (challengeModeToggle) {
    challengeModeToggle.addEventListener("change", () => {
      console.log("🔄 Challenge Mode toggled");
      saveOptions();
      applyFilters();
    });
  }

  if (themeSelect) {    
    themeSelect.addEventListener("click", () => {
      //document.body.classList.remove("light", "dark");
      //document.body.classList.add(themeSelect.value);

      document.body.classList.toggle('dark');
      const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
      //localStorage.setItem('theme', theme);
      //toggleButton.textContent = theme === 'dark' ? '☀️ Toggle Light Mode' : '🌙 Toggle Dark Mode';
      console.log(`🎨 Theme changed to ${themeSelect.value}`);
      
      saveOptions();
    });
  }

  console.log("🛠️ Options panel wired up");
}
