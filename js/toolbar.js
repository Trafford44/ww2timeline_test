/**
 * js/toolbar.js
 * Handles the opening and closing logic for all toolbar panels (Legend, Stats, Options, Filters)
 * and the Minimap, ensuring only one main panel is open at a time.
 */

// Global state tracking which main toolbar button is currently active
let activeToolbarButton = null;

// --- DOM ELEMENTS ---
const elements = {
    // Top Bar Buttons
    legendToggle: document.getElementById('legendToggle'),
    statsToggle: document.getElementById('statsToggle'),
    optionsToggle: document.getElementById('optionsToggle'),
    filtersToggle: document.getElementById('filtersToggle'),
    hamburgerToggle: document.getElementById('hamburgerToggle'),
    
    // Top Bar Panels (Details elements)
    legendPanel: document.querySelector('.timeline-legend'),
    statsPanel: document.querySelector('.stats-panel'),
    optionsPanel: document.querySelector('.options-panel'),
    filterPanel: document.querySelector('.filter-panel'),
    
    // Minimap Panel
    minimapHandle: document.getElementById('minimapHandle'),
    minimapPanel: document.getElementById('timelineMinimap'),
    minimapClose: document.getElementById('minimapClose'),
    minimapContent: document.getElementById('minimapContent'),
    minimapIcon: document.getElementById('minimapIcon'), // <-- NEW: Reference to the icon
    
    // Hamburger Panel (New Elements)
    hamburgerPanel: document.getElementById('hamburgerPanel'),
    hamburgerClose: document.getElementById('hamburgerClose'), // Added new close button
    
    // Other elements
    timelineContainer: document.getElementById('timelineContainer'),
    toolbarTop: document.querySelector('.toolbar-top'),
    appBody: document.getElementById('appBody'), // Reference to the body element for margin shifts
};


/**
 * Closes all currently open toolbar panels (Legend, Stats, Options, Filters).
 */
function closeAllPanels() {
    [elements.legendPanel, elements.statsPanel, elements.optionsPanel, elements.filterPanel].forEach(panel => {
        if (panel) {
            panel.open = false;
        }
    });
    
    // Deactivate all toolbar buttons
    [elements.legendToggle, elements.statsToggle, elements.optionsToggle, elements.filtersToggle].forEach(button => {
        if (button) {
            button.classList.remove('active');
        }
    });

    activeToolbarButton = null;
}

/**
 * Toggles a specific toolbar panel (Legend, Stats, Options, Filters).
 * @param {HTMLElement} panel - The <details> element of the panel to toggle.
 * @param {HTMLElement} toggleButton - The button that controls the panel.
 */
function togglePanel(panel, toggleButton) {
    if (!panel || !toggleButton) return;

    // Check if the panel is currently open
    const isOpen = panel.open;
    
    // Close all panels first
    closeAllPanels();

    // If the panel was closed, open it now and set the active state
    if (!isOpen) {
        panel.open = true;
        toggleButton.classList.add('active');
        activeToolbarButton = toggleButton;
    }
}

/**
 * Toggles the visibility of the Minimap panel (slides from the right).
 * @param {boolean} [forceState] - If provided, forces open (true) or closed (false).
 */
function toggleMinimap(forceState) {
    if (!elements.minimapPanel || !elements.minimapHandle || !elements.appBody) return;

    const isMinimapOpen = elements.minimapPanel.classList.contains('open');
    let shouldOpen = forceState === undefined ? !isMinimapOpen : forceState;
    
    if (shouldOpen) {
        elements.minimapPanel.classList.add('open');
        // Add class to body to shift main content left
        elements.appBody.classList.add('minimap-open'); 
        elements.minimapHandle.classList.add('active');
        
        // ICON ROTATION: Rotate 180 degrees when opening
        if (elements.minimapIcon) {
            elements.minimapIcon.style.transform = 'rotate(180deg)';
        }

    } else {
        elements.minimapPanel.classList.remove('open');
        elements.appBody.classList.remove('minimap-open');
        elements.minimapHandle.classList.remove('active');

        // ICON ROTATION: Reset rotation when closing
        if (elements.minimapIcon) {
            elements.minimapIcon.style.transform = 'rotate(0deg)';
        }
    }
}

/**
 * Toggles the visibility of the Hamburger/Settings panel (slides from the left).
 * @param {boolean} [forceState] - If provided, forces open (true) or closed (false).
 */
function toggleHamburgerPanel(forceState) {
    if (!elements.hamburgerPanel || !elements.appBody) return;

    const isPanelOpen = elements.hamburgerPanel.classList.contains('active');
    let shouldOpen = forceState === undefined ? !isPanelOpen : forceState;

    if (shouldOpen) {
        elements.hamburgerPanel.classList.add('active');
        // Add class to body to shift main content right
        elements.appBody.classList.add('hamburger-open'); 
    } else {
        elements.hamburgerPanel.classList.remove('active');
        elements.appBody.classList.remove('hamburger-open');
    }
}


/**
 * Renders the contents of the Minimap based on the current timeline data.
 * @param {Array} timelineData - The filtered timeline data.
 */
function renderMinimap(timelineData) {
    if (!elements.minimapContent) {
        console.error("Minimap content container not found.");
        return;
    }

    // Clear previous content
    elements.minimapContent.innerHTML = '';

    // Collect unique years
    const yearSet = new Set();
    if (timelineData && timelineData.length) {
        timelineData.forEach(item => {
            if (item.eventYear) yearSet.add(item.eventYear);
        });
    } else {
        // Fallback: scrape from DOM cards
        const cards = document.querySelectorAll(".card[data-event-year]");
        cards.forEach(card => yearSet.add(card.getAttribute("data-event-year")));
    }

    // Show placeholder if no years
    if (yearSet.size === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'minimap-placeholder p-4 text-center text-gray-500';
        placeholder.textContent = 'No years available';
        elements.minimapContent.appendChild(placeholder);
        return;
    }

    // Render sorted year list
    [...yearSet].sort().forEach(year => {
        const yearEl = document.createElement("div");
        yearEl.className = "minimap-year";
        yearEl.textContent = year;

        yearEl.addEventListener("click", () => {
        const year = yearEl.textContent.trim();

        // Scroll to the matching year marker
        const markers = document.querySelectorAll(".year-marker .year-label");
        for (const label of markers) {
            if (label.textContent.trim() === year) {
            (label.closest(".year-marker") || label)
                .scrollIntoView({ behavior: "smooth", block: "center" });
            break;
            }
        }

        // Force highlight override in minimap
        document.querySelectorAll(".minimap-year").forEach(el => {
            el.classList.toggle("active-year", el.textContent.trim() === year);
        });
        });

        elements.minimapContent.appendChild(yearEl);
    });
    
    requestAnimationFrame(() => {
        highlightActiveMinimapYear();
    });

    setViewportHeight();
}

/**
 * setViewportHeight()
 * 
 * Fixes mobile viewport height issues caused by browser chrome (URL bar).
 * - Reads window.innerHeight and converts it to 1% units.
 * - Stores the value in the CSS variable --vh.
 * - Use in CSS: height: calc(var(--vh) * 100);
 * 
 * Ensures consistent full-height panels across devices.
 */
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function highlightActiveMinimapYear() {
  const minimapYears = document.querySelectorAll(".minimap-year");
  const yearMarkers = document.querySelectorAll(".year-marker");

  if (yearMarkers.length === 0 || minimapYears.length === 0) {
    //console.warn("No year markers or minimap years found.");
    return; // nothing to observe yet
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const label = entry.target.querySelector(".year-label");
        if (!label) return;

        const visibleYear = label.textContent.trim();

        minimapYears.forEach(el => {
          el.classList.toggle("active-year", el.textContent.trim() === visibleYear);
        });
      }
    });
  }, { threshold: 0.5 });

  yearMarkers.forEach(marker => observer.observe(marker));
}




/**
 * Initializes all event listeners for the toolbar buttons and panels.
 */
function initializeToolbarListeners() {
    // Main toolbar buttons (Top Bar Panels)
    if (elements.legendToggle) elements.legendToggle.addEventListener('click', () => togglePanel(elements.legendPanel, elements.legendToggle));
    if (elements.statsToggle) elements.statsToggle.addEventListener('click', () => togglePanel(elements.statsPanel, elements.statsToggle));
    if (elements.optionsToggle) elements.optionsToggle.addEventListener('click', () => togglePanel(elements.optionsPanel, elements.optionsToggle));
    if (elements.filtersToggle) elements.filtersToggle.addEventListener('click', () => togglePanel(elements.filterPanel, elements.filtersToggle));
    
    // Minimap buttons (Slide Right)
    if (elements.minimapHandle) elements.minimapHandle.addEventListener('click', () => toggleMinimap());
    if (elements.minimapClose) elements.minimapClose.addEventListener('click', () => toggleMinimap(false));

    // Hamburger buttons (Slide Left)
    // NOTE: hamburgerToggle is now the main button element on the far left.
    if (elements.hamburgerToggle) elements.hamburgerToggle.addEventListener('click', () => toggleHamburgerPanel());
    if (elements.hamburgerClose) elements.hamburgerClose.addEventListener('click', () => toggleHamburgerPanel(false));


    // Close panels when clicking outside (on the body/window)
    window.addEventListener('click', (event) => {
        // Only close if a main panel is active and the click is outside the toolbar area
        if (activeToolbarButton) {
            const clickIsInsideToolbar = event.target.closest('.toolbar-top') || 
                                         event.target.closest('.timeline-legend, .stats-panel, .options-panel, .filter-panel');
            
            if (!clickIsInsideToolbar) {
                closeAllPanels();
            }
        }
    });

    // for viewport height. See setViewportHeight() function above
    window.addEventListener('resize', setViewportHeight);
}

// Ensure functions are exposed globally or exported for use in main.js
export { 
    initializeToolbarListeners, 
    toggleMinimap,
    renderMinimap 
};

// Export element references (useful for main.js and later modules)
export const toolbarElements = elements;