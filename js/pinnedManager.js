// pinnedManager.js
const PINNED_KEY = "pinnedItems";

export function savePinned(pinnedIds) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedIds));
}

export function loadPinned() {
  const stored = localStorage.getItem(PINNED_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function isPinned(id) {
  return loadPinned().includes(id);
}

export function togglePinned(id) {
  const pinned = new Set(loadPinned());
  pinned.has(id) ? pinned.delete(id) : pinned.add(id);
  savePinned([...pinned]);
}
