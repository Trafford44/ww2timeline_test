export function setupOptions(applyFilters, domain) {
  const fm = domain.fieldMap; // Alias for fieldMap
  const hideWatchedToggle = document.getElementById("hideWatchedToggle");
  const hidePinnedToggle = document.getElementById("hidePinnedToggle");
  const challengeModeToggle = document.getElementById("challengeModeToggle");
  const themeSelect = document.getElementById("themeSelect");
  
  console.log("Theme select:", themeSelect);
  console.log("🔧 setupOptions() is running");
  
  // === Load saved options ===
  // Use a generic key that includes the domain's subject for better scoping
  const optionsKey = `timelineOptions_${domain.subject.replace(/\s/g, "")}`;
  const saved = JSON.parse(localStorage.getItem(optionsKey) || "{}");

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
  if (themeSelect) themeSelect.value = theme;

  // Apply toggles using the safe isEnabled check and the fieldMap keys
  if (hideWatchedToggle) hideWatchedToggle.checked = isEnabled(saved[`hide_${fm.watched}`]);
  if (hidePinnedToggle) hidePinnedToggle.checked = isEnabled(saved[`hide_${fm.pinned}`]);
  if (challengeModeToggle) challengeModeToggle.checked = isEnabled(saved.challengeMode);
  
  // === Save options to localStorage ===
  function saveOptions() {
    const options = {
      theme: themeSelect?.value || "light",
      // Save actual JavaScript boolean values using the domain keys for unique storage
      [`hide_${fm.watched}`]: hideWatchedToggle?.checked || false,
      [`hide_${fm.pinned}`]: hidePinnedToggle?.checked || false,
      challengeMode: challengeModeToggle?.checked || false
    };
    localStorage.setItem(optionsKey, JSON.stringify(options));
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
    themeSelect.addEventListener("change", () => {
      document.body.classList.remove("light", "dark");
      document.body.classList.add(themeSelect.value);
      console.log(`🎨 Theme changed to ${themeSelect.value}`);
      saveOptions();
    });
  }

  console.log("🛠️ Options panel wired up");
}
