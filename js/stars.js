// stars.js

import { logActivity } from './alerts/logger.js';

/**
 * Renders a star rating (e.g., "★★★☆☆") based on a value string like "3/5".
 * * @param {string | number | null | undefined} value - The input rating value (e.g., "3/5").
 * @returns {string} The HTML string containing the rendered star icons, or an empty string if the value is invalid.
 */
export function renderStars(value) {
    logActivity("info", "renderStars initiated", { value });
    
    // Safely convert to string and use a regular expression to extract the score.
    const match = String(value || '').match(/^([1-5])\/5$/);
    
    // 1. Input Validation Check
    if (!match) {
        logActivity("warning", "renderStars", { reason: "Invalid format", input: value });
        return "";
    }
    
    // 2. Core Logic (Synchronous: no try/catch needed)
    const score = parseInt(match[1], 10); // Ensure base 10
    
    // Render: score filled stars + (5 - score) empty stars
    return `<span class="rating-stars">${"★".repeat(score)}${"☆".repeat(5 - score)}</span>`;
}
