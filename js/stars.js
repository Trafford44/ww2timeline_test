// stars.js

import { logActivity } from './alerts/logger.js';

/**
 * Renders a star rating (e.g., "★★★☆☆") based on a value string like "3/5".
 * @param {string | number | null | undefined} value - The input rating value (e.g., "3/5").
 * @returns {string} The HTML string containing the rendered star icons, or an empty string if the value is invalid.
 */
export function renderStars(value) {
    // 1. Convert to string and handle null/empty data silently
    const valueString = String(value || '').trim();
    
    // If the value is genuinely missing (e.g., empty string after trim), 
    // we return an empty string without logging a warning.
    if (!valueString) {
        // We can keep the info log, but skip the warning/error logic
        logActivity("info", "renderStars complete (empty value)");
        return "";
    }
    
    // 2. Logging
    logActivity("info", "renderStars initiated", { value: valueString });
    
    // 3. Core Logic (Synchronous: no try/catch needed)
    
    // Now, we only proceed if valueString is a non-empty string.
    const match = valueString.match(/^([1-5])\/5$/);
    
    if (!match) {
        // If it was a non-empty string but in the wrong format (e.g., "3" or "6/5"), 
        // THEN we log a warning.
        logActivity("warning", "renderStars", { reason: "Invalid format", input: valueString });
        return "";
    }
    
    const score = parseInt(match[1], 10); // Ensure base 10
    
    // Render: score filled stars + (5 - score) empty stars
    return `<span class="rating-stars">${"★".repeat(score)}${"☆".repeat(5 - score)}</span>`;
}
