// options.js

export function setupOptions(applyFilters) {
  const hideWatchedToggle = document.getElementById("hideWatchedToggle");
  const hidePinnedToggle = document.getElementById("hidePinnedToggle");
  const challengeModeToggle = document.getElementById("challengeModeToggle");

  if (hideWatchedToggle) {
    hideWatchedToggle.addEventListener("change", () => {
      console.log("🔄 Hide Watched toggled");
      applyFilters();
    });
  }

  if (hidePinnedToggle) {
    hidePinnedToggle.addEventListener("change", () => {
      console.log("🔄 Hide Pinned toggled");
      applyFilters();
    });
  }

  if (challengeModeToggle) {
    challengeModeToggle.addEventListener("change", () => {
      console.log("🔄 Challenge Mode toggled");
      applyFilters();
    });
  }

  console.log("🛠️ Options panel wired up");
}
