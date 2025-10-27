// alertUtils.js

/**
 * alertUtils.js
 *
 * Modular UI alert system for displaying user-facing messages across the app.
 *
 * Purpose:
 * - Show consistent alerts for errors, warnings, success, and info messages
 * - Support optional retry actions, dismiss buttons, and auto-dismiss behavior
 * - Decouple visual feedback from business logic (e.g. error reporting, form validation)
 *
 * Usage:
 * - Call `showAlert(message, type, options)` to display an alert
 * - `type` can be "error", "warning", "success", or "info"
 * - `options` may include:
 *     - `retryCallback`: function to run when "Retry" is clicked
 *     - `dismissible`: whether to show a close button
 *     - `autoDismiss`: time in ms before alert disappears
 *
 * Example:
 *   showAlert("Failed to load data.", "error", {
 *     retryCallback: () => fetchData(),
 *     dismissible: true,
 *     autoDismiss: 8000
 *   });
 *
 * Requirements:
 * - Include a container element with `id="alert-container"` in your HTML
 * - Style alert types via CSS classes: `.alert`, `.alert-error`,setTimeout(() => {
  console.log("Container after 5s:", container.innerHTML);
}, 5000); `.alert-success`, etc.
 *
 * This utility is designed for reuse across components and can be extended for stacking, animation, or scoped alerts.

 * What alertUtils.js Supports:
 * - Message display with type (error, warning, success, info)
 * - Retry button with callback
 * - Dismissible alerts via close button
 * - Auto-dismiss after a set timeout
 * - DOM injection into a container (#alert-container)
 * 
 * 
 * Optional Enhancements You Might Add Later:
 * - Stacking	Allow multiple alerts to appear simultaneously, rather than replacing each other
 * - Animations	Add fade-in/out or slide transitions via CSS
 * - Accessibility	Add ARIA roles (role="alert") for screen readers
 * - Custom icons	Show icons based on alert type (e.g. ⚠️ for warning)
 * - Scoped alerts	Target specific containers (e.g. sidebar vs main panel)
 * - Alert queue	Buffer alerts and show them one at a time if needed
 * - Global alert manager	Centralize alert state for SPA frameworks or component-based UIs
 * 
 * 
 * Reusable Alert Use Cases such as:
 * 1. Form Validation Feedback - When a user submits a form with missing or invalid fields:
 * showAlert("Please complete all required fields.", "warning", { dismissible: true });

 * 2. Success Confiif (options.autoDismiss === true) {
  const dismissDelay = 10000; // 10 seconds
  setTimeout(() => {
    console.log("Auto-dismissing alert after", dismissDelay, "ms");
    container.removeChild(alert);
  }, dismissDelay);
}
rmation
 * After a successful action like saving settings or uploading a file:
 * showAlert("Settings saved successfully.", "success", { autoDismiss: 5000 });
 * 
 * 3. Network or API Failures
 * If a fetch fails but isn’t critical enough for reportError():
 * showAlert("Unable to load data. Please try again later.", "error");
 * 
 * 4. User Guidance or Tips
 * To guide users through onboarding or feature discovery:
 * showAlert("Tip: You can drag cards to reorder them.", "info", { autoDismiss: 8000 });

 * 5. Retryable Actions Outside Error Context
 * For example, if a background sync fails and you want to offer a retry:
 * showAlert("Sync failed. Try again?", "error", {
 *   retryCallback: () => syncData(),
 *   dismissible: true
 * });

    showAlert("Tip: You can drag cards to reorder them.", "info", {
      autoDismiss: 8000
    });
    
    showAlert("Session expired", "error", {
      autoDismiss: true
    });
    
    showAlert("Retry failed", "error", {
      autoDismiss: false
    });

  6. Permission or Access Warnings
  If a user tries to access a restricted feature:
  showAlert("You don’t have permission to view this section.", "warning");


 */
import { logActivity } from './alerts/logger.js';

export function hideAlert() {
  const container = document.getElementById("alert-container");
  if (container) {
    console.log("hiding alert");
    container.style.opacity = "0";
    setTimeout(() => {
      container.innerHTML = "";
      container.style.opacity = "1";
    }, 300); // match your CSS transition duration
  }
}


export function showAlert(message, type = "error", options = {}) {

  console.log("🔔 showAlert triggered:", message);
  logActivity("info", "showAlert");
  
  const container = document.getElementById("alert-container");
  if (!container) return;

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;

  // Icon mapping
  const icons = {
    error: "❌",
    success: "✅",
    warning: "⚠️",
    info: "ℹ️"
  };

  const icon = icons[type] || "⚠️"; // fallback to warning if unknown type
  alert.innerHTML = `<span>${icon} ${message}</span>`;

  // Add Retry button if callback is provided
  if (options.retryCallback) {
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "Retry";
    retryBtn.onclick = () => {
      retryBtn.disabled = true;
      retryBtn.textContent = "Retrying...";
      options.retryCallback();
    };
    alert.appendChild(retryBtn);
  }

  // Add Dismiss button if enabled
  if (options.dismissible) {
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.onclick = () => container.removeChild(alert);
    alert.appendChild(closeBtn);
  }

  container.appendChild(alert);

  // Handle auto-dismiss
  if (options.autoDismiss) {
    const dismissDelay = typeof options.autoDismiss === "number"
      ? options.autoDismiss
      : 10000; // default to 10 seconds

    setTimeout(() => {
      console.log("Auto-dismissing alert after", dismissDelay, "ms");
      container.removeChild(alert);
    }, dismissDelay);
  }
}


