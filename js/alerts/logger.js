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

import { throttle, debounce } from './utils.js';
import { getLocalTimestamp } from './utils.js';

let tracingEnabled = false;

const throttleConfig = {
  fetchData: 1000,
  loadLocalJSON: 0,
  submitForm: 2000
};
const throttleMap = new Map();
const recentActions = [];


export function enableTracing() {
  tracingEnabled = true;
  console.log("🔍 Tracing enabled");
}

export function disableTracing() {
  tracingEnabled = false;
  console.log("🔕 Tracing disabled");
}


function innerLog(entry) {
  console.log("🧭 Action logged:", entry);
  recentActions.push(entry);
  if (recentActions.length > 100) recentActions.shift(); // cap at 100
}

export function logAction(action, params = {}, result = null, options = {}) {
  const force = options.force || false;
  if (!tracingEnabled && !force) return;
  const throttleMs = throttleConfig[action] || 0;

  const entry = {
    timestampUTC: new Date().toISOString(),
    timestampLocal: new Date().toLocaleString("en-NZ", {
      timeZone: "Pacific/Auckland",
      hour12: false
    }),
    action,
    params,
    result
  };

  if (throttleMs > 0 && !force) {
    if (!throttleMap.has(action)) {
      throttleMap.set(action, throttle(innerLog, throttleMs));
    }
    throttleMap.get(action)(entry);
  } else {
    innerLog(entry);
  }
}


export const debouncedLogAction = debounce(logAction, 500);  // after 500ms idle

export function getRecentActions(count = 10) {
  return recentActions.slice(-count);
}
