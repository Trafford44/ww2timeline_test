// pinnedManager.js
const PINNED_KEY = "pinnedFilms";

export function savePinned(pinnedIds) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedIds));
}

export function loadPinned() {
  const stored = localStorage.getItem(PINNED_KEY);
  return stored ? JSON.parse(stored) : [];
}
