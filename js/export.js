import { errorHandler } from './alerts/errorUtils.js';
import { logActivity } from './alerts/logger.js';
import { showAlert } from './alerts/alertUtils.js';

export function setupExport(events) {
  logActivity("info", "setupExport", { events });
  try {
    if (!Array.isArray(events) || events.length === 0) {
      logActivity("information", "setupExport", { filteredCount: 0 });
      showAlert(`No events available to export`, "warning", { autoDismiss: false });
      return;
    }
  
    console.log("Events received for export:", events);
    
    const headers = Object.keys(events[0]);
    const rows = events.map(event => headers.map(h => `"${event[h] || ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
  
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.download = 'event_timeline_export.csv';
    link.click();
  
    URL.revokeObjectURL(url);

  } catch (error) {
    errorHandler(error, "setupExport");
  }       
}
