// utils.js - WE'LL USE THROTTLE NOW AND DEBOUNCE IS READY FOR WHEN IT'S NEEDED

/**
 * utils.js
 *
 * General-purpose utility functions used across the application for timing control and functional composition.
 *
 * ✅ Purpose:
 * - Provide reusable helpers for throttling and debouncing high-frequency actions
 * - Improve performance and responsiveness by limiting how often functions are executed
 * - Support modular event handling, logging, and UI responsiveness strategies
 *
 * 🛠️ Included Utilities:
 * - `throttle(fn, delay)`: ensures `fn` is called at most once per `delay` milliseconds
 * - `debounce(fn, delay)`: ensures `fn` is called only after `delay` milliseconds of inactivity
 *
 * 📦 Usage:
 * - Wrap any function that may be triggered rapidly (e.g. scroll, resize, input, logging)
 * - Use `throttle()` for regular pacing (e.g. log every 1s, suppress noise)
 * - Use `debounce()` for idle detection (e.g. wait until user stops typing)
 *
 * 🧩 Example:
 *   const throttledLog = throttle(logAction, 1000);
 *   const debouncedResize = debounce(() => adjustLayout(), 300);
 *
 * These utilities are designed to be lightweight, side-effect-free, and safe for use in both UI and data layers.
 */



// Throttling and Debouncing are techniques to control how often logging occurs, especially when user actions happen rapidly (like typing, dragging, or clicking repeatedly). They help prevent:
// - Excessive memory usage
// - Console spam
// - Performance degradation

// Throttling ensures that logging happens at most once every X milliseconds, no matter how often the action is triggered.  For actions like scrolling, dragging, or rapid clicking

// Debouncing waits until the user stops triggering the action for X milliseconds before logging. It’s perfect for things like search input or resize events. For input fields, filters, or resize events
// Raw logging: For discrete actions like “Load Timeline” or “Submit Form”

// A resize event is triggered when the size of the browser window or a specific HTML element changes. It’s most commonly used to detect when a user resizes their browser window — which can affect layout, 
// visibility, or responsiveness of your UI.

// Example: Listening for Window Resize
// window.addEventListener("resize", () => {
//   console.log("📐 Window resized:", window.innerWidth, window.innerHeight);
// });
// This fires every time the user drags the window edge or rotates a device (like a tablet or phone).

// Why It Matters:
// Responsive Layouts: You might want to reflow or reposition elements when the screen size changes.
// Performance Optimization: If you’re recalculating layout or fetching data on resize, you’ll want to debounce the handler to avoid flooding your app with events.


// Debounced Resize Example:
// import { debounce } from './utils.js';

// const handleResize = debounce(() => {
//   console.log("📐 Debounced resize:", window.innerWidth, window.innerHeight);
// }, 300);

// This ensures the handler only fires once the user stops resizing for 300ms — much smoother and more efficient.

// window.addEventListener("resize", handleResize);

// const debouncedResizeHandler = debounce(() => {
//   const input = document.querySelector("#searchInput");
//   if (window.innerWidth > 800) {
//     input.style.maxWidth = "600px";
//   } else {
//     input.style.maxWidth = "100%";
//   }
// }, 300);

// This ensures the input doesn’t stretch too wide on landscape or large screens.


// Common Use Cases for Resize Listeners
// - Responsive UI adjustments: Manually recalculating layout, font sizes, or element positions when screen size changes
// - Canvas or chart resizing: Redrawing visual elements (e.g. charts, maps, games) to fit the new dimensions
// - Conditional rendering: Switching between mobile and desktop components based on width
// - Performance tuning: Debouncing layout recalculations or logging viewport changes

// When Resize Listeners Are Not Needed
// - If you're using CSS media queries or flex/grid layouts, many responsive behaviors happen automatically
// - If your app doesn’t rely on pixel-perfect layout or dynamic rendering, you might not need them


// How to use:
// Expose them in main.js
// import { getRecentActions, throttledLogAction, debouncedLogAction } from './logger.js';

// window.throttledLogAction = throttledLogAction;
// window.debouncedLogAction = debouncedLogAction;



export function throttle(fn, limit = 1000) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

export function debounce(fn, delay = 500) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

