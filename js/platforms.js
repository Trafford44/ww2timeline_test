// platforms.js
/**
 * Generates platform icon HTML based on the watch string, using the domain's configured platform map.
 * @param {string} watchOnText - The comma-separated string of platforms from the event record.
 * @param {object} domain - The configuration object.
 * @returns {string} HTML string containing platform icons.
 */
export function getPlatformIcons(watchOnText, domain) {
  if (!watchOnText || !domain || !domain.platformIconMap) return '';
  
  // Retrieve the platform mapping from the domain configuration
  const platformMap = domain.platformIconMap; 

  const seen = new Set();
  const icons = [];
  
  watchOnText.split(',').forEach(entry => {
    const clean = entry.trim().toLowerCase().replace(/[^a-z0-9+]/gi, '');
    for (const key in platformMap) {
      if (clean.includes(key) && !seen.has(key)) {
        seen.add(key);
        icons.push(`<span class="platform-icon icon-${platformMap[key]}" title="Available on ${platformMap[key]}"></span>`);
        break;
      }
    }
  });
  return icons.join('');
}
