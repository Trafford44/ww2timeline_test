import { errorHandler } from './alerts/errorUtils.js';
import { logActivity } from './alerts/logger.js';

export function saveToLocal(key, value) {
  logActivity("info", "saveToLocal", { key, value });
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    errorHandler(error, "applySettings - Failed to save to localStorage.");
  }   
}

export function loadFromLocal(key) {
  logActivity("info", "loadFromLocal", { key });  
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    errorHandler(error, "loadFromLocal - Failed to load from localStorage.");
  }   
}

export function syncLocalState(records) {
  logActivity("info", "syncLocalState", { records });  
  try {
    // Example usage — replace with your actual keys
    const filters = loadFromLocal("timelineFilters");
    const sortOrder = loadFromLocal("timelineSort");
  
    if (filters) {
      import('./filters.js').then(({ applyFilters }) => {
        applyFilters(records, filters); // ✅ apply filters to data
      });    
    }
  
    if (sortOrder) {
      console.log("Loaded sort order from localStorage:", sortOrder);
      import('./sort.js').then(({ applySort }) => {
        applySort(records, sortOrder); // ✅ apply sort to data
      });      
    }
  } catch (error) {
    errorHandler(error, "syncLocalState - Failed to sync localStorage.");
  }     
}
