export async function loadOptions(domainKey = "ww2infilm") {
  const [featuresRes, themeRes, domainRes, settingsRes] = await Promise.all([
    fetch(`config/features_${domainKey}.json`),
    fetch(`config/theme_${domainKey}.json`),
    fetch(`config/domain_${domainKey}.json`),
    fetch(`config/settings_${domainKey}.json`)
  ]);

  const features = await featuresRes.json();
  const theme = await themeRes.json();
  const domain = await domainRes.json();
  const settings = await settingsRes.json();

  return { features, theme, domain, settings };
}
