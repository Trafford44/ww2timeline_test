import { logActivity } from './alerts/logger.js';
import { showAlert } from './alerts/alertUtils.js';

/**
 * Sanitizes a single data field for CSV output:
 * 1. Converts null/undefined to an empty string.
 * 2. Escapes internal double quotes by doubling them (" becomes "").
 * 3. Encloses the entire field in double quotes to handle commas and newlines.
 * @param {any} value - The cell value to sanitize.
 * @returns {string} The fully quoted and escaped string for the CSV.
 */
const sanitizeField = (value) => {
    // 1. Convert to string and handle null/undefined
    const s = String(value ?? ''); // Use nullish coalescing for cleaner handling
    
    // 2. Escape internal double quotes (CSV standard)
    const escapedValue = s.replace(/"/g, '""');
    
    // 3. Enclose the result in double quotes
    return `"${escapedValue}"`;
};

export function setupExport(events) {
    logActivity("information", "setupExport initiated", { eventsCount: events.length });

    if (!Array.isArray(events) || events.length === 0) {
        logActivity("information", "setupExport", { filteredCount: 0 });
        showAlert(`No events available to export.`, "warning", { autoDismiss: false });
        return;
    }
    
    // Safety check for valid data structure
    if (typeof events[0] !== 'object' || events[0] === null || Object.keys(events[0]).length === 0) {
        logActivity("warning", "setupExport", { reason: "First event object is empty or invalid." });
        showAlert(`Cannot export: Event data structure is invalid.`, "error", { autoDismiss: false });
        return;
    }

    // 1. Get headers (only need sanitization if headers could contain quotes/commas, but usually they don't)
    const headers = Object.keys(events[0]);
    const headerRow = headers.map(h => sanitizeField(h)).join(','); // Sanitize headers for safety
    
    // 2. Generate rows (Iterates through EVERY row and EVERY field)
    const rows = events.map(event => 
        // Iterate through all fields in the current event (row)
        headers.map(h => sanitizeField(event[h])).join(',')
    );
    
    // 3. Combine headers and rows
    const csv = [headerRow, ...rows].join('\n');

    // 4. Trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'event_timeline_export.csv';
    link.click();

    URL.revokeObjectURL(url);
    
    // Success feedback
    logActivity("action", "dataExported", { count: events.length }); 
    showAlert(`${events.length} events successfully exported.`, "success", { autoDismiss: true });
}
