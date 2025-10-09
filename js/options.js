// options.js

export function setupOptions(applyFilters) {
  const hideWatchedToggle = document.getElementById("toggleHideWatched");
  const hidePinnedToggle = document.getElementById("toggleHidePinned");
  const challengeModeToggle = document.getElementById("toggleChallengeMode");

  if (hideWatchedToggle) {
    hideWatchedToggle.addEventListener("change", applyFilters);
  }

  if (hidePinnedToggle) {
    hidePinnedToggle.addEventListener("change", applyFilters);
  }

  if (challengeModeToggle) {
    challengeModeToggle.addEventListener("change", applyFilters);
  }

  console.log("🛠️ Options panel wired up");
}
