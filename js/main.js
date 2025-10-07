import { fetchAndRenderData } from './data.js';
import { applyFilters, toggleControls } from './filters.js';
import { renderTimeline } from './timeline.js';
import { updateStats } from './stats.js';

toggleControls(false);
renderTimeline([]);
fetchAndRenderData();
