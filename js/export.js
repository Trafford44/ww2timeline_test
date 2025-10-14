// export.js
/**
 * Generates and downloads a CSV file containing the filtered event data.
 * The exported columns are defined by the domain configuration's labels and field map.
 * @param {Array<object>} events - The filtered list of events.
 * @param {object} domain - The configuration object.
 */
export function setupExport(events, domain) {
  console.log("Exporting", events.length, "events");

  if (!Array.isArray(events) || events.length === 0) {
    console.warn("⚠️ No events available to export.");
    // NOTE: Replacing alert() with a console warning as per development guidelines.
    // If a user-facing message is required, a custom modal UI should be used.
    return;
  }

  console.log("Events received for export:", events);
 
  const fm = domain.fieldMap || {};
  const lb = domain.labels || {};
  
  // 1. Define a comprehensive list of generic keys and filter it down to what is mapped.
  // This maintains a consistent order and ensures only mapped fields are exported.
  const allGenericKeys = [
      'title', 'year', 'classification', 'period', 'platform', 'accuracy',
      'notes', 'watched', 'pinned', 'location', 'wikiTitle'
  ];

  // Only export keys that are explicitly defined in the fieldMap
  const exportedGenericKeys = allGenericKeys.filter(key => fm[key]);

  // 2. Create CSV Headers using the domain labels (e.g., "Film Title", "Discovery Year")
  const headers = exportedGenericKeys.map(genericKey => lb[`${genericKey}Label`] || fm[genericKey]);
  
  // 3. Create CSV Rows by retrieving data using the domain-specific data key
  const rows = events.map(event =>
      exportedGenericKeys.map(genericKey => {
          const dataKey = fm[genericKey]; // e.g., 'FilmTitle'
          return `"${event[dataKey] || ''}"`; // Quote and provide fallback for empty values
      }).join(',')
  );

  // Combine headers and rows
  const csv = [headers.join(','), ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${domain.subject.toLowerCase().replace(/\s/g, '_')}_export.csv`; // Dynamic filename
  link.click();

  URL.revokeObjectURL(url);
}
