export async function loadOptions(domainKey = "ww2infilm") {
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
}
