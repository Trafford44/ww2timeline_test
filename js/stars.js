// stars.js

/**
 * Renders a star rating based on a string input (e.g., "4/5").
 * Uses full stars (★) and empty stars (☆) for display.
 * @param {string} value - The rating value (e.g., "3/5").
 * @returns {string} HTML string of stars, wrapped in a span for styling.
 */
export function renderStars(value) {
  // Matches strings in the format "N/5" where N is 1, 2, 3, 4, or 5.
  const match = String(value).match(/^([1-5])\/5$/);
  if (!match) return "";
  
  // Extract the score (1-5)
  const score = parseInt(match[1]);
  
  // Generate the star rating HTML
  return `<span class="rating-stars">${"★".repeat(score)}${"☆".repeat(5 - score)}</span>`;
}
