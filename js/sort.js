// sort.js

import { errorHandler } from './alerts/errorUtils.js';
import { logActivity } from './alerts/logger.js';

export function applySort(events, sortOrder) {
  logActivity("info", "applySort", { events, sortOrder });
  try {
    if (!Array.isArray(events)) return [];
  
    switch (sortOrder) {
      case "title":
        return [...events].sort((a, b) => a.Title.localeCompare(b.Title));
      case "year":
        return [...events].sort((a, b) => a.Year - b.Year);
      default:
        return events;
    }
  } catch (error) {
    errorHandler(error, "applySort");
  }     
}
