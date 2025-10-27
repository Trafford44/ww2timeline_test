import { errorHandler } from './alerts/errorUtils.js';
import { logActivity } from './alerts/logger.js';

export function getPlatformIcons(PlatformText) {
  logActivity("info", "getPlatformIcons", { PlatformText });
  try {  
    if (!PlatformText) return '';
    const platformMap = {
      netflix: 'Netflix', prime: 'Prime', youtube: 'YouTube', apple: 'Apple',
      tvnz: 'TVNZ', tvnzplus: 'TVNZ', neon: 'Neon', beamafilm: 'Beamafilm',
      arovision: 'AroVision', plex: 'Plex', mubi: 'MUBI', disney: 'Disney',
      microsoft: 'Microsoft', google: 'Google', archive: 'Archive', dvd: 'DVD'
    };
    const seen = new Set();
    const icons = [];
    PlatformText.split(',').forEach(entry => {
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
  } catch (error) {
    errorHandler(error, "getPlatformIcons - Failed to get platform icons from config.");
  }       
}
