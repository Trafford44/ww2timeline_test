export function setupOptions(applyFilters) {
  const hideWatchedToggle = document.getElementById("hideWatchedToggle");
  const hidePinnedToggle = document.getElementById("hidePinnedToggle");
  const challengeModeToggle = document.getElementById("challengeModeToggle");
  const themeSelect = document.getElementById("themeSelect");
console.log("Theme select:", themeSelect);
  // === Load saved options ===
  const saved = JSON.parse(localStorage.getItem("optionsPanel") || "{}");

  // Apply theme
  const theme = saved.theme || "light";
  document.body.classList.add(theme);
  if (themeSelect) themeSelect.value = theme;

  // Apply toggles
  if (hideWatchedToggle) hideWatchedToggle.checked = !!saved.hideWatched;
  if (hidePinnedToggle) hidePinnedToggle.checked = !!saved.hidePinned;
  if (challengeModeToggle) challengeModeToggle.checked = !!saved.challengeMode;

  // === Save options to localStorage ===
  function saveOptions() {
    const options = {
      theme: themeSelect?.value || "light",
      hideWatched: hideWatchedToggle?.checked || false,
      hidePinned: hidePinnedToggle?.checked || false,
      challengeMode: challengeModeToggle?.checked || false
    };
    localStorage.setItem("optionsPanel", JSON.stringify(options));
  }

  // === Event Listeners ===
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
console.log("Theme select:", themeSelect);
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
