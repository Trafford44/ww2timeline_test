import { renderTimeline } from './timeline.js';
import { populateDropdowns } from './filters.js';
import { toggleControls } from './filters.js';
import { updateStats } from './stats.js';
import { domain, settings, features } from './main.js';
import { initPinnedManager, isPinned, saveWatched } from './pinnedManager.js';

/**
 * Stores the full, raw dataset after loading.
 * @type {Array<object>}
 */
export let dataset = [];

/**
 * Executes the data fetching and initial rendering of the application.
 */
export async function fetchAndRenderData() {
    console.log("🚀 fetchAndRenderData starting...");
    const initialPrompt = document.getElementById("initialPrompt");

    // CRITICAL CHECK: Ensure the necessary data URL is available from the loaded settings.
    if (!settings.dataUrl) {
        const errorMsg = `Data URL is missing from the settings configuration for ${settings.title}.`;
        console.error("❌ Fetch error:", new Error(errorMsg));
        initialPrompt.textContent = `CRITICAL ERROR: ${errorMsg}`;
        toggleControls(false); // Disable UI if data load fails
        return;
    }

    try {
        initialPrompt.textContent = "Fetching records...";
        
        // --- Generic Data Fetching (Assuming JSON format based on typical usage) ---
        const response = await fetch(settings.dataUrl);

        if (!response.ok) {
            throw new Error(`HTTP status ${response.status} when fetching ${settings.dataUrl}`);
        }

        // Parse as JSON, which is simpler and more robust than client-side CSV parsing.
        let rawData = await response.json(); 
        
        console.log("Data fetched:", rawData);

        // --- Data Normalization and Enrichment ---
        const fm = domain.fieldMap || {};
        const titleKey = fm.title || 'Title';
        const watchedKey = fm.watched || 'Watched';
        const pinnedKey = fm.pinned || 'Pinned'; 

        // 1. Convert watched field to boolean (optional)
        // 2. Add RecordID for stable tracking (crucial for pinning/watching)
        // 3. Mark Pinned status based on stored state
        dataset = rawData.map((record, index) => {
            record.RecordID = index + 1; // Simple, stable identifier
            // Normalize watched status (e.g., convert "Yes" to true/false)
            if (record[watchedKey]) {
                 record.isWatched = String(record[watchedKey]).toLowerCase() === 'yes';
            }
            // Add Pinned status from manager
            record.Pinned = isPinned(record.RecordID);
            return record;
        });

        // Initialize managers and UI components
        initPinnedManager(domain.subject);
        populateDropdowns(dataset, domain); // Populate filters based on data
        toggleControls(true); // Enable UI after data loads

        // Start with all data rendered
        renderTimeline(dataset, domain);
        updateStats(dataset, domain);
        
        console.log("✅ Application fully initialized and rendered.");

    } catch (error) {
        console.error("❌ Critical error during data processing:", error);
        initialPrompt.textContent = `CRITICAL ERROR: Failed to load or process data. Check console for details. (${error.message})`;
        toggleControls(false);
    }
}
