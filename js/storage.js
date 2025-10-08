// storage.js
export function saveToLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

export function loadFromLocal(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
    return null;
  }
}
