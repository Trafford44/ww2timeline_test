// logger.js

/**
 * logger.js
 * ----------
 * Centralized logging utility for capturing diagnostic actions across the app.
 *
 * ✅ Purpose:
 * - Logs structured action entries with UTC and NZDT timestamps
 * - Supports optional throttling per action to suppress noisy logs
 * - Stores recent logs in memory for inspection or UI exposure
 *
 * 🛠️ Usage:
 * Call `logAction(actionName, params, result)` from anywhere in the app.
 * Throttling is automatically applied based on the `throttleConfig` map.
 *
 * Example:
 *   logAction("fetchData", { domain: "example.com" });
 *
 * Optional override:
 *   logAction("submitForm", { values }, null, { force: true }); // bypass throttle
 *
 * 🔁 Throttling:
 * - Defined per action in `throttleConfig` (below)
 * - If an action is not listed, it logs immediately (no throttle)
 * - If listed with a non-zero value, logs are throttled to that interval (in ms)
 *
 * Example throttleConfig:
 *   const throttleConfig = {
 *     fetchData: 1000,        // throttle to once per second
 *     submitForm: 2000,       // throttle to once every 2 seconds
 *     loadLocalJSON: 0        // no throttling
 *   };
 *
 * 📦 Exports:
 * - logAction(action, params, result, options)
 * - getRecentActions(count) → returns latest N logs
 *
 * 🧱 Dependencies:
 * - `throttle(fn, ms)` utility from utils.js
 *
 * 🧼 Notes:
 * - Logs are capped at 100 entries in memory
 * - Timestamps include both UTC and NZDT for clarity
 * - Designed to be declarative and frictionless for developers
 */



// Expose them in main.js
// import { getRecentActions, throttledLogAction, debouncedLogAction } from './logger.js';

// DO NOT Expose to global scope for console access, unless for manual testing only e.g. getRecentActions() in dev window.  It is a security risk
// Expose in Admin-only UI panels: Let trusted users toggle tracing or view logs via authenticated controls

// IN Production, use Scoped modules: Keep functions private unless explicitly needed
// Dev-only toggles: Use environment flags to expose globals only in dev mode:
// if (process.env.NODE_ENV === "development") {
//   window.getRecentActions = getRecentActions;
// }

// window.loadTimeline = loadTimeline;
// window.enableTracing = enableTracing;
// window.disableTracing = disableTracing;
// window.getRecentActions = getRecentActions;


// Use in js files for functions like:
// import { debouncedLogAction } from './logger.js';
// ..
// debouncedLogAction("fetchData", { features, domain, settings });

// and for input fields:
// import { debouncedLogAction } from './logger.js';
// 
// function onUserSearchInput(value) {
//   debouncedLogAction("searchInput", { query: value });
// }


// Re throttleConfig:  Move to a config file?
// Advantages of Moving throttleConfig to JSON
// 1. Separation of concerns
// Keeps logic (logger.js) and configuration (throttleConfig.json) cleanly separated.
// Easier to audit or update throttle rules without touching code.

// 2. Dynamic loading
// You could load config at runtime, allowing environment-specific throttling (e.g. dev vs prod).
// Could support hot-reloading or admin overrides in future.

// 3. Scalability
// If throttle rules grow or become user-configurable, JSON is easier to manage and parse.


// Tradeoffs / Overhead
// 1. Extra layer
// You now need to fetch() or import the JSON, handle errors, and possibly wait for it to load.
// Slightly more cognitive overhead for contributors unfamiliar with the config structure.

// 2. No real gain for static config
// If the throttle rules are stable and only edited by developers, a JS object is just as effective.
// You still have to edit and save — just in a different file format.


// I'll keep it here for now'


// Also, re submitForm: 2000:
// Prevent duplicate submissions: If a user double-clicks or rapidly triggers a form submit, throttling can suppress the second call.
// Avoid backend strain: If the form triggers expensive operations (e.g. file uploads, database writes), throttling can help.
// UI debounce: If the submit button is wired to multiple handlers or async chains, throttling can reduce noise.

// ❌ Why 2000ms Might Be Too Long
// It could suppress legitimate retries or feedback logging
// It might hide issues during rapid testing or debugging
// It assumes a user might double-submit within 2 seconds — which may or may not be true

// ✅ What You Could Do Instead
// Lower it to something like 500 or 1000 if you still want protection
// Remove it entirely if your form already has built-in safeguards (e.g. disabling the button after submit)
// Use deduplication instead of throttling if you want to log every attempt but collapse identical entries


// Gemini provided teh latest version.
// Scenario,            Call (Conceptual),New Call
// User Clicks Export,   "logActivity('action', 'submitForm', { type: 'export' });"
// Filtered Data Empty,   "logActivity('information', 'noEventsForExport', { reason: 'filtered out' });"
// Throttled Data Fetch,   "logActivity('action', 'fetchData', { url });"
// Config Error,   "logActivity('bug', 'configLoadFailed', error);"

/*
🐞 When to Use "debug" in logActivity()
Here are some precise, modular examples:

1. Unexpected but non-breaking data
js
logActivity("debug", { rawEvent }, "Event missing expected fields");
Use when an event lacks Title, EventYear, or other expected fields — not an error, but worth tracking.

2. Intermediate state inspection
js
logActivity("debug", { filters, keywords }, "Parsed search query");
Use when you want to confirm how a query was interpreted before filtering.

3. Conditional logic branches
js
logActivity("debug", { platform }, "Platform filter set to '__none__'");
Use when a special-case value triggers alternate logic.

4. Module loading or dynamic imports
js
logActivity("debug", { module: "wiki.js" }, "Loading Wikipedia summaries module");
Use when confirming that a feature module is being loaded dynamically.

5. Retry or fallback triggers
js
logActivity("debug", { attempt: 2 }, "Retrying fetchData after transient failure");
Use when retry logic kicks in, especially for diagnostics.

6. User tracing or opt-in diagnostics
js
logActivity("debug", { userId, sessionId }, "User toggled challenge mode");
Use when tracing opt-in user actions for support or telemetry.
*/

/*
🧠 Usage Examples
js
logActivity("setupExport", "information", { filteredCount: 0 }, null);
logActivity("applyFilters", "action", { filters }, filteredEvents);
logActivity("parseSearchQuery", "debug", { query }, parsedResult);
logActivity("populateDropdowns", "warning", { missing: "Platform" }, null);
*/

// logger.js

import { throttle, debounce } from './utils.js';

let tracingEnabled = true;

const LOG_CONFIG = {
  // Configuration for console display, based on activity type
  action:      { icon: '🚀', style: 'color: #3f72af; font-weight: bold;' },
  information: { icon: 'ℹ️', style: 'color: #198754;' },
  warning:     { icon: '⚠️', style: 'color: #ffc107;' },
  bug:         { icon: '🕷️', style: 'color: #dc3545; font-weight: bold;' }
};

const throttleConfig = {
  fetchData: 1000,
  loadLocalJSON: 0,
  submitForm: 2000
};
const throttleMap = new Map();
const recentActions = []; // Note: This now stores a mix of 'activities', but the name is retained for simplicity

// --- Tracing Management ---

export function enableTracing() {
  tracingEnabled = true;
  console.log("🔍 Tracing enabled");
}

export function disableTracing() {
  tracingEnabled = false;
  console.log("🔕 Tracing disabled");
}

// --- Core Logging Function ---

/**
 * Processes a single activity entry, applies contextual console formatting (icon/style), 
 * logs the formatted message to the appropriate console method (log, warn, error), 
 * and stores the structured entry in the recent history buffer.
 *
 * This function handles the final output and persistence of the logging mechanism. 
 * It is called by logActivity() either directly or via a throttling mechanism.
 * * @param {Object} entry - The complete activity entry object.
 * @param {string} entry.type - The category of the activity ('action', 'information', 'warning', or 'bug').
 * @param {string} entry.activity - The descriptive name of the activity (used as the throttling key).
 * @param {Object} entry.params - The parameters/context associated with the activity.
 * @param {any} entry.result - The result or output of the activity.
 * @param {string} entry.timestampUTC - The UTC timestamp of the log.
 * @param {string} entry.timestampLocal - The local timestamp of the log.
 */
function innerLog(entry) {
  const { type, activity, params, result } = entry;
  const config = LOG_CONFIG[type] || LOG_CONFIG['information'];

  // Use the appropriate console method for better filtering in DevTools
  let logMethod = console.log;
  if (type === 'warning') {
    logMethod = console.warn;
  } else if (type === 'bug') {
    logMethod = console.error;
  }
  
  // Format the console message with icon and style
  const formattedMessage = `%c${config.icon} ${type.toUpperCase()}: %c${activity}`;

  // Log the formatted message (icon/type styled, message text default)
  logMethod(formattedMessage, config.style, '');

  // Log the structured data separately, preserving the original semantics
  if (params || result) {
      logMethod("   Details:", { params, result });
  }

  // Preserve the internal history tracking
  recentActions.push(entry);
  if (recentActions.length > 100) recentActions.shift(); // cap at 100
}

// --- Exported Activity Logging Function ---

/**
 * Logs an application activity (Action, Information, Warning, or Bug) to the console,
 * applying an appropriate icon, while respecting tracing and throttling rules.
 * * @param {('action'|'information'|'warning'|'bug')} type - The category of the activity.
 * @param {string} activity - The main description of the activity (previously 'action').
 * @param {Object} [params={}] - Optional parameters related to the activity.
 * @param {any} [result=null] - Optional result of the activity.
 * @param {Object} [options={}] - Options, e.g., { force: true }.
 */
export function logActivity(type, activity, params = {}, result = null, options = {}) {
  const force = options.force || false;
  
  // Note: We check against the THROTTLE CONFIGURATION KEY, which is still the 'activity' string
  const throttleMs = throttleConfig[activity] || 0; 
  
  if (!tracingEnabled && !force) return;

  const entry = {
    timestampUTC: new Date().toISOString(),
    timestampLocal: new Date().toLocaleString("en-NZ", {
      timeZone: "Pacific/Auckland",
      hour12: false
    }),
    type,       // NEW: The category of the log
    activity,   // RENAMED: The descriptive string (previously 'action')
    params,
    result
  };

  if (throttleMs > 0 && !force) {
    if (!throttleMap.has(activity)) {
      // Use the activity string as the throttling key
      throttleMap.set(activity, throttle(innerLog, throttleMs)); 
    }
    throttleMap.get(activity)(entry);
  } else {
    innerLog(entry);
  }
}

// --- Debounced/History Exports ---

// NOTE: Renamed for clarity, and updated to call the new function
export const debouncedLogActivity = debounce(logActivity, 500); 

export function getRecentActions(count = 10) {
  // The name is kept 'getRecentActions' as it implies historical actions/events
  return recentActions.slice(-count);
}
