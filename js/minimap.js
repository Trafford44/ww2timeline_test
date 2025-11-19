/**
 * minimap.js - Contains D3 logic for initializing, drawing, and synchronizing the timeline minimap.
 *
 * This module exposes functions to:
 * 1. Setup the minimap SVG and scales.
 * 2. Draw the minimap elements (events and axis).
 * 3. Update the zoom selection rectangle based on the main timeline's zoom/pan state.
 * 4. Handle minimap clicks to adjust the main timeline's view.
 */

// Global variables for the minimap, intended to be managed by this module
let minimapSvg, minimapGroup, zoomRect, minimapXAxisGroup;
let xMini, yMini;
let currentK = 1.0; // Track current zoom scale from main timeline
let currentX = 0; // Track current x translation from main timeline
let innerWidth, miniHeight, miniInnerHeight;

// Expose a public API object
const Minimap = {};

/**
 * Initializes the minimap scales and structure.
 * @param {object} config - Configuration object from the main script.
 * @param {Array<object>} data - The full timeline data array.
 * @param {function} xDomain - The domain of the main timeline's X scale.
 * @param {function} mainZoomHandler - The function to call on the main D3 zoom behavior.
 */
Minimap.initialize = (config, data, xDomain, mainZoomHandler) => {
    // Adopt configurations
    innerWidth = config.innerWidth;
    miniHeight = config.miniHeight;
    miniInnerHeight = config.miniInnerHeight;
    const margin = config.margin;

    // Minimap X Scale - uses the same domain as main chart
    xMini = d3.scaleTime()
        .domain(xDomain)
        .range([0, innerWidth]);

    // Minimap Y Scale
    yMini = d3.scaleBand()
        .domain([1, 2, 3])
        .range([0, miniInnerHeight])
        .paddingInner(0.5);

    // --- Minimap SVG Setup ---
    minimapSvg = d3.select("#minimap-container")
        .append("svg")
        .attr("viewBox", `0 0 ${config.width} ${miniHeight + 20}`)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("width", "100%")
        .attr("height", miniHeight + 20)
        .attr("class", "minimap-chart");

    minimapGroup = minimapSvg.append("g")
        .attr("transform", `translate(${margin.left}, 10)`);

    minimapXAxisGroup = minimapSvg.append("g")
        .attr("class", "minimap-x-axis")
        .attr("transform", `translate(${margin.left}, ${miniHeight + 10})`);

    // Minimap click/drag handler to control the main zoom
    minimapSvg.on("click", function(event) {
        const clickX = d3.pointer(event, minimapGroup.node())[0];

        // This prevents the minimap from trying to adjust the view when the chart is not zoomed
        if (currentK <= 1.01) return;

        // Visible width on the main chart in screen pixels
        const visibleWidth = innerWidth / currentK;

        // Calculate the necessary translation (currentX is negative for translation)
        // newX is the start position of the zoom rectangle on the minimap
        let newX = clickX - visibleWidth / 2;

        // Clamp newX to keep the zoom window within the minimap bounds
        newX = Math.max(0, Math.min(innerWidth - visibleWidth, newX));

        // The required translation for the D3 transform is -k * newX
        const transformX = -currentK * newX;

        // Apply the new transform to the main chart using the handler provided by the main script
        d3.select("#timeline-container svg .zoom-overlay").transition().duration(300).call(
            mainZoomHandler.transform,
            d3.zoomIdentity.translate(transformX, 0).scale(currentK)
        );
    });
};

/**
 * Draws the static elements of the minimap (events and axis).
 * @param {Array<object>} timelineData - The filtered data to draw.
 */
Minimap.draw = (timelineData) => {
    if (!minimapGroup || !xMini || !yMini) return; // Ensure initialization occurred

    // Minimap X-Axis
    const miniXAxis = d3.axisBottom(xMini)
        .ticks(d3.timeYear.every(5))
        .tickSizeOuter(0)
        .tickFormat(d3.timeFormat("%Y"));

    minimapXAxisGroup.call(miniXAxis);

    // Minimap Events (simple rectangles)
    minimapGroup.selectAll(".mini-event")
        .data(timelineData, d => d.name)
        .join("rect")
        .attr("class", "mini-event")
        .attr("x", d => xMini(d.date))
        .attr("y", d => yMini(d.level))
        .attr("width", 3)
        .attr("height", yMini.bandwidth())
        .attr("fill", d => d.color)
        .attr("opacity", 0.7);

    // Initialize or reset the zoom rectangle on the minimap
    if (!zoomRect) {
        zoomRect = minimapGroup.append("rect")
            .attr("class", "zoom-rect")
            .attr("y", 0)
            .attr("height", miniInnerHeight)
            .attr("x", 0)
            .attr("width", innerWidth); // Initially full width
    }
};

/**
 * Updates the minimap's zoom rectangle based on the main chart's current D3 transform.
 * @param {d3.ZoomTransform} transform - The current zoom/pan transformation object.
 */
Minimap.updateRect = (transform) => {
    if (!zoomRect) return; // Ensure the rectangle exists

    // Calculate the visible range and size
    const visibleRange = transform.rescaleX(xMini).range();

    // The width of the rectangle corresponds to the visible fraction of the domain
    const rectWidth = (visibleRange[1] - visibleRange[0]) / transform.k;
    // The position of the rectangle corresponds to the x translation
    const rectX = -transform.x / transform.k;

    // Update global state trackers
    currentK = transform.k;
    currentX = transform.x;

    zoomRect
        .attr("x", rectX)
        .attr("width", rectWidth);
};

export default Minimap;