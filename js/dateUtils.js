import { logActivity } from './alerts/logger.js';

/*
This utility extracts a usable year from a wide variety of date formats found in historical event data. It handles:
  Exact years (e.g. "1945")
  Year ranges (e.g. "1939–1945" or "1923-1939" → returns first year)
  Full dates (e.g. "17/9/1939" or "1944-06-06" → extracts year)
  Messy strings (e.g. "Build up to war 1939" → extracts first 4-digit year)
  Fallbacks to "Unknown Year" if no valid year is found
This functioD(date, yn ensures consistent year grouping for timeline rendering, even when input formats vary. 
It’s modularD(date, y, safe, and ready for future extension to handle full date ranges or timeline filters.
*/


// Extracts a usable year from any date string or range
export function extractYear(rawDate) {
  if (!rawDate) {
    logActivity("warning", "extractYear:missing", { rawDate });
    return "Unknown Year";
  }

  const trimmed = rawDate.trim();

  if (/^\d{4}$/.test(trimmed)) return trimmed;

  const rangeMatch = trimmed.match(/^(\d{4})\s*[–-]\s*\d{4}$/);
  if (rangeMatch) return rangeMatch[1];

  const dateMatch = trimmed.match(/(\d{4})$/);
  if (dateMatch) return dateMatch[1];

  const fallbackMatch = trimmed.match(/\d{4}/);
  if (fallbackMatch) return fallbackMatch[0];

  // 🚨 Log unrecognized formats
  logActivity("warning", "extractYear:unrecognized", { rawDate });

  return "Unknown Year";
}


/*
Example Usage
const { startYear, endYear } = extractDateRange(event.EventDate);

if (endYear) {
  // It's a date range — apply range-specific logic
  renderDateRangeBadge(startYear, endYear);
} else {
  // Single year — use for grouping or display
  renderYearBadge(startYear);
}
*/
// for future use, at this stage
// It returns startYear, and endYear as null if not a range
export function extractDateRange(rawDate) {
  if (!rawDate) return { startYear: "Unknown Year", endYear: null };

  const trimmed = rawDate.trim();

  // Match full date range: e.g. 20/9/1929 - 29/9/1929
  const fullRangeMatch = trimmed.match(
    /(\d{1,2}\/\d{1,2}\/(\d{4}))\s*[-–]\s*(\d{1,2}\/\d{1,2}\/(\d{4}))/
  );

  if (fullRangeMatch) {
    return {
      startYear: fullRangeMatch[2],
      endYear: fullRangeMatch[4]
    };
  }

  // Fallback to single year
  const singleYear = extractYear(trimmed);
  return { startYear: singleYear, endYear: null };
}


export function getLocalTimestamp() {
  return new Date().toLocaleString("en-NZ", {
    timeZone: "Pacific/Auckland",
    hour12: false
  });
}

export function convertToLocalDate(date, year) {
  return new Date(date || year).toLocaleDateString("en-NZ", {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

