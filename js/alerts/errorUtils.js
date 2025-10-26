// errorUtils.js

/**
 * errorUtils.js
 *
 * Centralized error handling utilities for consistent diagnostics and graceful user feedback.
 *
 * Purpose:
 * - Capture and report errors with contextual metadata
 * - Provide developer-facing diagnostics and optional user-facing messages
 * - Support modular logging, tracing, and retry strategies
 *
 * Usage:
 * - Call `reportError(error, context)` to log and trace errors
 * - Optionally pass a `context` object with details like action name, parameters, or user state
 * - Extend with custom handlers (e.g. UI alerts, server-side reporting) as needed
 *
 * Example:
 *   try {
 *     await fetchData(...);
 *   } catch (err) {
 *     reportError(err, { action: "fetchData", domain });
 *   }
 *
 * This module is designed to be lightweight, extensible, and safe for both development and production environments.
 */



import { showAlert } from './alertUtils.js';
import { getRecentActions } from './logger.js';

export function reportError(userMessage, error, context = {}, retryCallback = null) {
  const recent = getRecentActions();
  const fullContext = {
    ...context,
    error: error.message,
    stack: error.stack,
    recentActions: recent
  };

  console.error("❌", userMessage, error, fullContext);

  showAlert(userMessage, "error", {
    retryCallback,
    dismissible: true,
    autoDismiss: false //10000
  });
}

