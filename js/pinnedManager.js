// pinnedManager.js
import { errorHandler } from './alerts/errorUtils.js';
import { logActivity } from './alerts/logger.js';

const PINNED_KEY = "pinnedEvents";

export function savePinned(pinnedIds) {
  logActivity("info", "savePinned", { pinnedIds });
  try {  
    localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedIds));
  } catch (error) {
    errorHandler(error, "savePinned - Failed to save to pinned events.");
  }     
}

export function loadPinned() {
  logActivity("info", "loadPinned");
  try {    
    const stored = localStorage.getItem(PINNED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    errorHandler(error, "loadPinned - Failed to load pinned events.");
  }       
}

export function isPinned(id) {
  logActivity("info", "isPinned");
  try {      
    return loadPinned().includes(id);
  } catch (error) {
    errorHandler(error, "isPinned");
  }     
}

export function togglePinned(id) {
  logActivity("info", "togglePinned", { id });
  try {    
    const pinned = new Set(loadPinned());
    pinned.has(id) ? pinned.delete(id) : pinned.add(id);
    savePinned([...pinned]);
    console.log("Pinned events now:", [...pinned]); // ✅ Debug output
  } catch (error) {
    errorHandler(error, "togglePinned");
  }     
}
