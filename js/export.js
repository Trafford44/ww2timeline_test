export function setupExport(records) {
  console.log("📤 setupExport() called");

  if (!Array.isArray(records) || records.length === 0) {
    console.warn("⚠️ No records to export.");
    alert("No data available to export.");
    return;
  }

  console.log("Records received for export:", records);
  
  const headers = Object.keys(records[0]);
  const rows = records.map(r => headers.map(h => `"${r[h] || ''}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'timeline_export.csv';
  link.click();

  URL.revokeObjectURL(url);
}
