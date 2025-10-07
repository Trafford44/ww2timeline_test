async function initApp() {
  await loadConfigs();
  applyTheme();

  const { fetchAndRenderData } = await import('./data.js');
  fetchAndRenderData(features, domain);

  if (features.enableWikipedia) {
    import('./wiki.js').then(({ loadWikipediaSummaries }) => {
      loadWikipediaSummaries();
    });
  }

  if (features.enableMapThumb) {
    import('./map.js').then(({ renderMapThumbs }) => {
      renderMapThumbs();
    });
  }

  if (features.enableExport) {
    import('./export.js').then(({ setupExport }) => {
      setupExport();
    });
  }

  if (features.enableLocalStorage) {
    import('./storage.js').then(({ syncLocalState }) => {
      syncLocalState();
    });
  }
}
