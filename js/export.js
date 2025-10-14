export function setupExport(events) {
  console.log("Exporting", events.length, "events");

  if (!Array.isArray(events) || events.length === 0) {
    console.warn("⚠️ No events available to export.");
    // NOTE: Replacing alert() with a console warning as per development guidelines.
    // If a user-facing message is required, a custom modal UI should be used.
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
}
