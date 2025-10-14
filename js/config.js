/**
 * Asynchronously loads all configuration files (features, theme, domain, settings)
 * for a specified domain key.
 * * @param {string} domainKey - The unique identifier for the domain (e.g., "ww2infilm" or "science").
 * @returns {Promise<object>} An object containing the loaded configurations.
 */
export async function loadConfig(domainKey = "ww2infilm") {
  
  console.log(`Attempting to load configuration for domain: ${domainKey}`);
  
  // Fetch all configuration files in parallel using the provided domain key.
  // The fetch paths are intentionally relative to the application root.
  const [featuresRes, themeRes, domainRes, settingsRes] = await Promise.all([
    fetch(`config/features_${domainKey}.json`),
    fetch(`config/theme_${domainKey}.json`),
    fetch(`config/domain_${domainKey}.json`),
    fetch(`config/settings_${domainKey}.json`)
  ]);
  
  // Parse the JSON responses.
  const features = await featuresRes.json();
  const theme = await themeRes.json();
  const domain = await domainRes.json();
  const settings = await settingsRes.json();

  return { features, theme, domain, settings };
}
