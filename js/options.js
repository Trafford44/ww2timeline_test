import { logAction } from './alerts/logger.js';

// setupOptions()
// Initializes and wires up the options panel, restoring saved toggle states and enabling persistent user preferences.
// Purpose:
//   Loads previously saved UI preferences from localStorage
//   Applies theme and toggle states on startup
//   Sets up listeners to persist changes and reapply filters dynamically
// Input:
//   applyFilters: callback function invoked whenever a toggle changes
// Process:
//   Retrieves saved options from localStorage under the key "timelineOptions"
//   Safely parses boolean values using isEnabled() to handle both true and "true"
//   Applies the saved theme (light or dark) and updates the theme toggle button label
//   Sets the initial state of toggles: hideWatched, hidePinned, and challengeMode
//   Defines saveOptions() to persist current toggle and theme states
//   Attaches change listeners to each toggle:
//     On change, saves the new state and re-applies filters
//   Attaches a click listener to the theme toggle:
//     Toggles the theme class on <body>
//     Updates the button label and persists the theme
// Output:
//   Fully initialized options panel with persistent state and reactive filtering
// Logging:
//   Uses console.log() for setup tracing and toggle changes
export function setupOptions(applyFilters) {
  logAction("setupOptions", { applyFilters });
 
  try {
    const hideWatchedToggle = document.getElementById("hideWatchedToggle");
    const hidePinnedToggle = document.getElementById("hidePinnedToggle");
    const challengeModeToggle = document.getElementById("challengeModeToggle");
    const themeSelect = document.getElementById("themeToggleButton");
    
    console.log("Theme select:", themeSelect);
    console.log("🔧 setupOptions() is running");
    
    // === Load saved options ===
    // localStorage is a browser API that lets you store key/value pairs persistently in the user’s browser.
    const saved = JSON.parse(localStorage.getItem("timelineOptions") || "{}");
  
    // --- CRITICAL FIX FOR BOOLEAN LOADING ---
    /**
     * Helper function to safely convert the loaded state to a boolean.
     * It handles both boolean `true/false` and stored string `"true"/"false"` values.
     */
    const isEnabled = (value) => {
      // Check if the value is the boolean true OR the string "true"
      return value === true || value === "true";
    };
    
    // Apply theme
    const theme = saved.theme || "light";
    document.body.classList.add(theme);
    if (themeSelect) themeSelect.textContent = theme === 'dark' ? '☀️ Toggle Light Mode' : '🌙 Toggle Dark Mode';
  
    // Apply toggles using the safe isEnabled check
    if (hideWatchedToggle) hideWatchedToggle.checked = isEnabled(saved.hideWatched);
    if (hidePinnedToggle) hidePinnedToggle.checked = isEnabled(saved.hidePinned);
    if (challengeModeToggle) challengeModeToggle.checked = isEnabled(saved.challengeMode);
    
    // === Save options to localStorage ===
    function saveOptions() {
      const options = {
        theme: document.body.classList.contains('dark') ? 'dark' : 'light',
        
        // Save actual JavaScript boolean values
        hideWatched: hideWatchedToggle?.checked || false,
        hidePinned: hidePinnedToggle?.checked || false,
        challengeMode: challengeModeToggle?.checked || false
      };
      localStorage.setItem("timelineOptions", JSON.stringify(options));
    }
  
    // === Event Listeners ===
    // Listeners are correct, they call saveOptions() and applyFilters()
    if (hideWatchedToggle) {
      hideWatchedToggle.addEventListener("change", () => {
        console.log("🔄 Hide Watched toggled");
        saveOptions();
        applyFilters();
      });
    }
  
    if (hidePinnedToggle) {
      hidePinnedToggle.addEventListener("change", () => {
        console.log("🔄 Hide Pinned toggled");
        saveOptions();
        applyFilters();
      });
    }
  
    if (challengeModeToggle) {
      challengeModeToggle.addEventListener("change", () => {
        console.log("🔄 Challenge Mode toggled");
        saveOptions();
        applyFilters();
      });
    }
  
    if (themeSelect) {    
      themeSelect.addEventListener("click", () => {
        document.body.classList.toggle('dark');
        const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
        
        localStorage.setItem('theme', theme);
        themeSelect.textContent = theme === 'dark' ? '☀️ Toggle Light Mode' : '🌙 Toggle Dark Mode';
        
        console.log(`🎨 Theme changed to ${theme}`);
        
        saveOptions();
      });
    }
  } catch (error) {
    handleError(error, "setupOptions");
  } 
}
