import { logActivity } from './alerts/logger.js';
let generalSettings = null; // This will hold the settings object after it's loaded


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


/**
 * Initializes the date utility module with required settings.
 * This must be called once the configuration has been loaded.
 * @param {object} settings - The 'general' settings object loaded from settings_general.json.
 */
export function initializeDateUtils(settings) {
    if (!settings) {
        throw new Error("Date utilities must be initialized with settings.");
    }
    generalSettings = settings;
}


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


/**
 * Converts a date or year value into a localized date string.
 * @param {Date|string|number} date - The date object or string/timestamp.
 * @param {number} [year] - A fallback year if date is falsy.
 * @returns {string} The localized date string.
 */
export function convertToLocalDate(date, year) {
    if (!generalSettings) {
        // Essential check to ensure initialization happened
        throw new Error("Date utilities not initialized. Call initializeDateUtils first.");
    }
    return new Date(date || year).toLocaleDateString(generalSettings.locale, generalSettings.dateFormat);
}

/**
 * Gets the current localized timestamp, including the configured timezone.
 * @returns {string} The localized date and time string.
 */
export function getLocalTimestamp() {
    if (!generalSettings) {
        throw new Error("Date utilities not initialized. Call initializeDateUtils first.");
    }
    return new Date().toLocaleString(generalSettings.locale, {
        timeZone: generalSettings.timezone,
        ...generalSettings.timeFormat
    });
}



export function normaliseEventDate(rawDate) {
  if (!rawDate) return null;

  const trimmed = String(rawDate).trim(); // ← Coerce to string here

  // ISO format
  const iso = new Date(trimmed);
  if (!isNaN(iso)) return iso;

  // DD/MM/YYYY
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [_, day, month, year] = match;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }

  // YYYY range (e.g., "1939-1945") — use start year
  const range = trimmed.match(/^(\d{4})\s*[–-]\s*\d{4}$/);
  if (range) {
    return new Date(`${range[1]}-01-01`);
  }

  // Single year
  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) {
    return new Date(`${yearOnly[1]}-01-01`);
  }

  return null;
}


