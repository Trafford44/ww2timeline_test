import { logActivity } from './alerts/logger.js';
// Import the robust storage utilities
import { saveToLocal, loadFromLocal } from './local-storage.js'; 

// Key for the options object in local storage
const OPTIONS_KEY = "timelineOptions";

// --- DOM Element References ---
// Note: These must be accessed after the DOM is ready, so we keep them inside setupOptions
const getToggle = (id) => document.getElementById(id);

// --- State Management ---

/**
 * Saves the current state of all UI options to local storage.
 */
function saveOptions() {
    const themeSelect = getToggle("themeToggleButton");
    const hideWatchedToggle = getToggle("hideWatchedToggle");
    const hidePinnedToggle = getToggle("hidePinnedToggle");
    const challengeModeToggle = getToggle("challengeModeToggle");

    const options = {
        // Determine theme based on body class
        theme: document.body.classList.contains('dark') ? 'dark' : 'light',
        
        // Save actual JavaScript boolean values
        hideWatched: hideWatchedToggle?.checked || false,
        hidePinned: hidePinnedToggle?.checked || false,
        challengeMode: challengeModeToggle?.checked || false
    };
    
    saveToLocal(OPTIONS_KEY, options);
}

// --- Main Setup Function ---

/**
 * Initializes options panel: loads saved state, applies theme, and attaches listeners.
 * @param {function} applyFilters - Function to call when a filter-related option changes.
 */
export function setupOptions(applyFilters) {
    logActivity("information", "setupOptions initiated");
    
    // Look up DOM elements (needs to be inside this function as it runs during initApp)
    const hideWatchedToggle = getToggle("hideWatchedToggle");
    const hidePinnedToggle = getToggle("hidePinnedToggle");
    const challengeModeToggle = getToggle("challengeModeToggle");
    const themeSelect = getToggle("themeToggleButton");
    
    // === Load saved options ===
    const saved = loadFromLocal(OPTIONS_KEY) || {};
    
    // --- Apply Theme ---
    const theme = saved.theme || "light";
    document.body.classList.remove('light', 'dark'); // Clean up any existing theme
    document.body.classList.add(theme);
    if (themeSelect) {
        themeSelect.textContent = theme === 'dark' ? '☀️ Toggle Light Mode' : '🌙 Toggle Dark Mode';
    }
    
    // --- Apply Toggles ---
    // Safely check if the loaded value is explicitly true (handling both true/false and string representations if they exist)
    const isChecked = (value) => value === true || value === 'true';

    if (hideWatchedToggle) hideWatchedToggle.checked = isChecked(saved.hideWatched);
    if (hidePinnedToggle) hidePinnedToggle.checked = isChecked(saved.hidePinned);
    if (challengeModeToggle) challengeModeToggle.checked = isChecked(saved.challengeMode);
    
    // === Event Listeners ===
    
    // Helper for applying changes to filter-dependent toggles
    const setupToggleListener = (el) => {
        if (el) {
            el.addEventListener("change", () => {
                saveOptions();
                applyFilters(); // Trigger re-filtering based on new toggle state
            });
        }
    };

    setupToggleListener(hideWatchedToggle);
    setupToggleListener(hidePinnedToggle);
    setupToggleListener(challengeModeToggle);
    
    // Theme Listener (does not trigger applyFilters)
    if (themeSelect) {    
        themeSelect.addEventListener("click", () => {
            document.body.classList.toggle('dark');
            const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
            themeSelect.textContent = theme === 'dark' ? '☀️ Toggle Light Mode' : '🌙 Toggle Dark Mode';
            
            saveOptions(); // Saves the new theme along with other toggles
        });
    }
}
