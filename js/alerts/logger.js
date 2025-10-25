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



import { throttle, debounce } from './utils.js';
import { getLocalTimestamp } from './utils.js';

const actionLog = [];
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
  return actionLog.slice(-count);
}
