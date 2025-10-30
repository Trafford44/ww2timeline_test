import { logActivity } from './alerts/logger.js';
/*
This utility extracts a usable year from a wide variety of date formats found in historical event data. It handles:
  Exact years (e.g. "1945")
  Year ranges (e.g. "1939–1945" or "1923-1939" → returns first year)
  Full dates (e.g. "17/9/1939" or "1944-06-06" → extracts year)
  Messy strings (e.g. "Build up to war 1939" → extracts first 4-digit year)
  Fallbacks to "Unknown Year" if no valid year is found
This function ensures consistent year grouping for timeline rendering, even when input formats vary. 
It’s modular, safe, and ready for future extension to handle full date ranges or timeline filters.
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
