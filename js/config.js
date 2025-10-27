import { logActivity } from './alerts/logger.js';
import { errorHandler } from './alerts/errorUtils.js';


// loadConfig(domainKey)
// Fetches and assembles all configuration files for a given domain context.
// Purpose: Centralized loader for feature toggles, theme settings, domain metadata, and UI settings
// Input: domainKey (e.g. "ww2infilm", "science") used to dynamically construct file paths
// Process:
//   Uses Promise.all() to fetch four JSON files in parallel:
//     features_${domainKey}.json — toggles for UI panels and feature modules
//     theme_${domainKey}.json — theme-specific styles and overrides
//     domain_${domainKey}.json — metadata like subject, title, and domain-specific labels
//     settings_${domainKey}.json — UI text, placeholders, and app-level configuration
//   Parses each response into usable objects
//   Logs the action with logAction() for traceability
// Output: Returns a unified config object { features, theme, domain, settings }
// Error Handling: Catches fetch or parse failures and delegates to handleError() with context
export async function loadConfig(domainKey) {
  logActivity("loadConfig", { domainKey });
 
  try {
      const [featuresRes, themeRes, domainRes, settingsRes] = await Promise.all([
        fetch(`config/features_${domainKey}.json`),
        fetch(`config/theme_${domainKey}.json`),
        fetch(`config/domain_${domainKey}.json`),
        fetch(`config/settings_${domainKey}.json`)
      ]);
      //change above lines (features, theme, domain, settings) to new settings file when changing domain to, for example, science (settings_science.json)
      // was gettoing 404 when '../config/features_ww2infilm.json'
      // From co-pilot:
      // When you use: fetch('/config/features_ww2infilm.json')
      // …the browser interprets that as:  http://yourdomain.com/config/features_ww2infilm.json
      // But if your project is actually served from: http://yourdomain.com/ww2timeline_test/
      // Then the correct path is: fetch('config/features_ww2infilm.json')
      
      const features = await featuresRes.json();
      const theme = await themeRes.json();
      const domain = await domainRes.json();
      const settings = await settingsRes.json();
    
      return { features, theme, domain, settings };
    
  } catch (error) {
    errorHandler(error, "loadConfig - failed while loading configuration data");
  }        
}
