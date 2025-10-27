// map.js

import { errorHandler } from './alerts/errorUtils.js';
import { logActivity } from './alerts/logger.js';

export function renderMapThumbs(events) {
  logActivity("info", "renderMapThumbs", { events });
  try {  
    return events
      .filter(event => event.Location)
      .map(event => ({
        id: event.ID,
        title: event.Title,
        location: event.Location
      }));
  } catch (error) {
    errorHandler(error, "applySettings - Failed to save to localStorage.");
  }       
}
