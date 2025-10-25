// logger.js

/**
 * logger.js
 *
 * Modular logging and tracing utility for capturing user actions and diagnostics across the application.
 *
 * Purpose:
 * - Record meaningful user and system actions with contextual metadata
 * - Support tracing for debugging, auditing, and performance analysis
 * - Provide throttled and debounced variants for high-frequency logging
 *
 * Usage:
 * - Call `logAction(actionName, params, result)` to record an action
 * - Use `enableTracing()` and `disableTracing()` to toggle logging
 * - Use `getRecentActions(count)` to retrieve the latest log entries
 * - Use `throttledLogAction` or `debouncedLogAction` for controlled logging of frequent events
 *
 * Example:
 *   logAction("submitForm", { formId: "signup" });
 *   throttledLogAction("fetchData", { domain, features });
 *
 * Notes:
 * - Tracing must be enabled via `enableTracing()` before logs are recorded
 * - Logs are stored in memory and capped at 100 entries
 * - Designed for modular integration with error reporting, retry logic, and UI diagnostics
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
// import { throttledLogAction } from './logger.js';
// ..
// throttledLogAction("fetchData", { features, domain, settings });

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

export function enableTracing() {
  tracingEnabled = true;
  console.log("🔍 Tracing enabled");
}

export function disableTracing() {
  tracingEnabled = false;
  console.log("🔕 Tracing disabled");
}

export function logAction(actionName, params = {}, result = null) {
  if (!tracingEnabled) return;

  const entry = {
    timestamp: getLocalTimestamp(),
    action: actionName,
    params,
    result
  };

  actionLog.push(entry);
  if (actionLog.length > 100) actionLog.shift();

  console.log("📝 Action logged:", entry);
}

export const throttledLogAction = throttle(logAction, 1000); // once per second
export const debouncedLogAction = debounce(logAction, 500);  // after 500ms idle

export function getRecentActions(count = 10) {
  return actionLog.slice(-count);
}

