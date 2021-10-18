const SVG_NAMESPACE_URI = "http://www.w3.org/2000/svg";
const LEGEND_ID = "legend";
const SVG_ID = "sliderSVG";
const BACKGROUND_CIRCLE_CLASS = "background-circle";
const FOREGROUND_CIRCLE_CLASS = "foreground-circle";
const CLICKABLE_CIRCLE_CLASS = "clickable-circle";
const SLIDER_HANDLE_CLASS = "slider-handle";
const HANDLE_SIZE = 8;
const CURRENCY_SYMBOL = "$";

export default class CircularSlider {
    defaultOptions = {
        container: "slider-container",
        color: "#5e437a",
        min: 0,
        max: 100,
        step: 1,
        radius: 37,
        name: "Example"
    };

    constructor(options) {
        this.validateOptions(options);

        this.options = { ...this.defaultOptions, ...options };

        this.container = this.options.container;
        this.color = this.options.color;
        this.min = this.options.min;
        this.max = this.options.max;
        this.step = this.options.step;
        this.radius = this.options.radius;
        this.name = this.options.name;

        this.svgWidth = 500;
        this.svgHeight = 500;
        this.centerX = this.svgWidth / 2;
        this.centerY = this.svgHeight / 2;
        this.circumference = 2 * Math.PI * this.radius;

        this.dragging = false;
        this.handlePosition = [];

        this.foregroundCircleId = FOREGROUND_CIRCLE_CLASS + "-" + this.radius;
        this.clickableCircleId = CLICKABLE_CIRCLE_CLASS + "-" + this.radius;

        this.legendValueId = "value-" + this.radius;

        this.createSlider();
    }

    createSlider() {
        const sliderContainer = document.getElementById(this.container);

        let legend = document.getElementById(LEGEND_ID);
        let svg = document.getElementById(SVG_ID);

        // create the legend if it doesn't exist
        if (legend === null) {
            legend = document.createElementNS(LEGEND_ID, "table");
            legend.setAttributeNS(null, "id", LEGEND_ID);
        }

        // create the SVG if it doesn't exist
        if (svg === null) {
            svg = document.createElementNS(SVG_NAMESPACE_URI, "svg");
            svg.setAttributeNS(null, "id", SVG_ID);
        }

        legend.appendChild(this.addLegendListEntry());

        svg.setAttributeNS(null, "width", this.svgWidth);
        svg.setAttributeNS(null, "height", this.svgHeight);
        svg.appendChild(this.drawCircle(BACKGROUND_CIRCLE_CLASS));
        svg.appendChild(this.drawCircle(FOREGROUND_CIRCLE_CLASS));
        svg.appendChild(this.drawCircle(CLICKABLE_CIRCLE_CLASS));
        svg.appendChild(this.drawSliderHandle());

        sliderContainer.appendChild(legend);
        sliderContainer.appendChild(svg);

        sliderContainer.addEventListener("mouseup", () => { this.dragging = false; });
        sliderContainer.addEventListener("touchend", () => { this.dragging = false });
        sliderContainer.addEventListener("mousemove", e => this.handleDrag(e));
        sliderContainer.addEventListener("touchmove", e => this.handleDrag(e));
    }

    addLegendListEntry() {
        const entry = document.createElement("tr");

        const entryValue = document.createElement("td");
        entryValue.setAttribute("id", this.legendValueId);
        entryValue.setAttribute("class", "legend-value");
        entryValue.textContent = "$" + this.min;

        const entryColorAndName = document.createElement("td");

        const entryColor = document.createElement("span");
        entryColor.setAttribute("class", "legend-color");
        entryColor.style.backgroundColor = this.color;

        const entryName = document.createElement("p");
        entryName.textContent = this.name;

        entry.appendChild(entryValue);
        entryColorAndName.appendChild(entryColor);
        entryColorAndName.appendChild(entryName);
        
        entry.appendChild(entryColorAndName);

        return entry;
    }

    updateLegendValue() {
        const percentage = this.calculateArcDegrees() / 360 * 100;
        const value = (percentage * (this.max - this.min) / 100) + this.min;

        document.getElementById(this.legendValueId).textContent = CURRENCY_SYMBOL + this.moveToClosestStep(value);
    }

    drawCircle(circleClass) {
        const circle = document.createElementNS(SVG_NAMESPACE_URI, "circle");

        circle.setAttributeNS(null, "class", circleClass);
        circle.setAttributeNS(null, "cx", this.centerX);
        circle.setAttributeNS(null, "cy", this.centerY);
        circle.setAttributeNS(null, "r", this.radius);

        circle.setAttributeNS(null, "id", circleClass + "-" + this.radius);

        if (circleClass === FOREGROUND_CIRCLE_CLASS) {
            circle.setAttributeNS(null, "stroke-dasharray", this.circumference);
            circle.setAttributeNS(null, "stroke-dashoffset", this.circumference);
            circle.setAttributeNS(null, "stroke", this.color);
        }

        if (circleClass === CLICKABLE_CIRCLE_CLASS) {
            // add click event listener when creating clickable circle
            circle.addEventListener("click", e => this.handleCircleClick(e));
            circle.addEventListener("touchstart", e => this.handleCircleClick(e));
        }

        return circle;
    }

    drawSliderHandle() {
        const sliderHandle = document.createElementNS(SVG_NAMESPACE_URI, "circle");

        sliderHandle.setAttributeNS(null, "class", SLIDER_HANDLE_CLASS);
        sliderHandle.setAttributeNS(null, "cx", this.centerX);
        sliderHandle.setAttributeNS(null, "cy", this.centerY - this.radius);
        sliderHandle.setAttributeNS(null, "r", HANDLE_SIZE);
        sliderHandle.setAttributeNS(null, "id", SLIDER_HANDLE_CLASS + "-" + this.radius);

        sliderHandle.addEventListener("mousedown", e => { this.startDrag(e.target); });
        sliderHandle.addEventListener("touchstart", (e) => { this.startDrag(e.target); });

        return sliderHandle;
    }

    startDrag(target) {
        this.dragging = true;
        this.activeHandle = target;
    }

    handleDrag(e) {
        e.preventDefault();

        // we need to differentiate between touches and mouse clicks
        let offsetX = e.offsetX;
        let offsetY = e.offsetY;

        if (e.type === "touchmove") {
            const svgContainerRect = document.getElementById(SVG_ID).getBoundingClientRect();

            offsetX = e.touches[0].pageX - svgContainerRect.left;
            offsetY = e.touches[0].pageY - svgContainerRect.top;
        }
        
        this.handlePosition = this.findCircleIntersection(offsetX, offsetY);

        if (this.dragging) {
            this.activeHandle.setAttributeNS(null, "cx", this.handlePosition.x);
            this.activeHandle.setAttributeNS(null, "cy", this.handlePosition.y);

            this.drawColorOverlay();
            this.updateLegendValue();
        }
    }

    handleCircleClick(e) {
        e.preventDefault();

        this.activeHandle = document.getElementById(SLIDER_HANDLE_CLASS + "-" + this.radius);

        let offsetX = e.offsetX;
        let offsetY = e.offsetY;

        if (e.type === "touchstart") {           
            const svgContainerRect = document.getElementById(SVG_ID).getBoundingClientRect();

            offsetX = e.touches[0].pageX - svgContainerRect.x;
            offsetY = e.touches[0].pageY - svgContainerRect.y;
        }

        this.handlePosition = this.findCircleIntersection(offsetX, offsetY);

        this.activeHandle.setAttributeNS(null, "cx", this.handlePosition.x);
        this.activeHandle.setAttributeNS(null, "cy", this.handlePosition.y);

        this.updateLegendValue();
        this.drawColorOverlay();
    }

    findCircleIntersection(mouseX, mouseY) {
        // calculate distance from center to mouse.
        const xLength = mouseX - this.centerX;
        const yLength = mouseY - this.centerY;

        const lineLength = Math.sqrt(Math.pow(xLength, 2) + Math.pow(yLength, 2));

        const x = this.centerX + (xLength * this.radius / lineLength);
        const y = this.centerY + (yLength * this.radius / lineLength);

        return { x, y };
    }

    drawColorOverlay() {
        const colorOverlay = document.getElementById(this.foregroundCircleId);
        colorOverlay.setAttributeNS(null, "stroke-dasharray", this.circumference);
        colorOverlay.setAttributeNS(null, "stroke-dashoffset", this.circumference - this.calculateArcLength());
    }

    moveToClosestStep(value) {
        const low = value - value % this.step;
        const high = low + this.step;

        return value - low < high - value ? low : high;
    }

    calculateArcDegrees() {
        const deltaX = this.handlePosition.x - this.centerX;
        const deltaY = this.handlePosition.y - this.centerY;

        // degrees from the top
        return (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 450) % 360;
    }

    calculateArcLength() {
        return this.circumference / 360 * this.calculateArcDegrees();
    }

    validateOptions(options) {
        if (typeof options.container !== "string" || options.container === "") {
            throw new Error("Container must be a valid string");
        }
        if (options.step <= 0) {
            throw new Error("Step value must be greater than zero");
        }
        if (options.min > options.max) {
            throw new Error("Min value must be less than max");
        }
        if (options.radius <= 0) {
            throw new Error("Radius must be more than zero");
        }
    }
}