// pinnedManager.js
const PINNED_KEY = "pinnedItems";

function savePinned(pinnedIds) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedIds));
}

function loadPinned() {
  const stored = localStorage.getItem(PINNED_KEY);
  return stored ? JSON.parse(stored) : [];
}
