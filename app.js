const SVG_NAMESPACE_URI = "http://www.w3.org/2000/svg";
const SVG_ID = "sliderSVG";
const BACKGROUND_CIRCLE_CLASS = "background-circle";
const FOREGROUND_CIRCLE_CLASS = "foreground-circle";
const CLICKABLE_CIRCLE_CLASS = "clickable-circle";
const SLIDER_HANDLE_CLASS = "slider-handle";
const HANDLE_SIZE = 8;

export default class CircularSlider {
    defaultOptions = {
        container: "slider-container",
        color: "#5e437a",
        min: 0,
        max: 100,
        step: 1,
        radius: 37
    };

    constructor(options) {
        this.options = { ...this.defaultOptions, ...options };

        this.container = this.options.container;
        this.color = this.options.color;
        this.min = this.options.min;
        this.max = this.options.max;
        this.step = this.options.step;
        this.radius = this.options.radius;

        this.svgWidth = 500;
        this.svgHeight = 500;
        this.centerX = this.svgWidth / 2;
        this.centerY = this.svgHeight / 2;
        this.circumference = 2 * Math.PI * this.radius;

        this.dragging = false;
        this.handlePosition = [];

        this.foregroundCircleId = FOREGROUND_CIRCLE_CLASS + "-" + this.radius;
        this.clickableCircleId = CLICKABLE_CIRCLE_CLASS + "-" + this.radius;

        this.createSlider();
    }

    createSlider() {
        const sliderContainer = document.getElementById(this.container);

        let svg = document.getElementById(SVG_ID);

        // create the SVG if it doesn't exist
        if (svg == null) {
            svg = document.createElementNS(SVG_NAMESPACE_URI, "svg");
            svg.setAttributeNS(null, "id", SVG_ID);
        }

        svg.setAttributeNS(null, "width", this.svgWidth);
        svg.setAttributeNS(null, "height", this.svgHeight);
        svg.appendChild(this.drawCircle(BACKGROUND_CIRCLE_CLASS));
        svg.appendChild(this.drawCircle(FOREGROUND_CIRCLE_CLASS));
        svg.appendChild(this.drawCircle(CLICKABLE_CIRCLE_CLASS));
        svg.appendChild(this.drawSliderHandle());

        sliderContainer.appendChild(svg);

        sliderContainer.addEventListener("mouseup", () => { this.dragging = false; });
        sliderContainer.addEventListener("touchend", () => { this.dragging = false });
        sliderContainer.addEventListener("mousemove", e => this.handleDrag(e));
        sliderContainer.addEventListener("touchmove", e => this.handleDrag(e));
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
        let event = e;
        if (e.type === "touchmove") {
            event = e.touches[0];
        }

        const x = event.clientX;
        const y = event.clientY;
        
        this.handlePosition = this.findCircleIntersection(x, y);

        if (this.dragging) {
            this.activeHandle.setAttributeNS(null, "cx", this.handlePosition.x);
            this.activeHandle.setAttributeNS(null, "cy", this.handlePosition.y);

            this.drawColorOverlay();
        }
    }

    handleCircleClick(e) {
        e.preventDefault();

        this.activeHandle = document.getElementById(SLIDER_HANDLE_CLASS + "-" + this.radius);

        let event = e;
        if (e.type === "touchstart") {
            event = e.touches[0];
        }

        const x = event.clientX;
        const y = event.clientY;

        this.handlePosition = this.findCircleIntersection(x, y);

        this.activeHandle.setAttributeNS(null, "cx", this.handlePosition.x);
        this.activeHandle.setAttributeNS(null, "cy", this.handlePosition.y);

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

    calculateArcLength() {
        const deltaX = this.handlePosition.x - this.centerX;
        const deltaY = this.handlePosition.y - this.centerY;

        // degrees from the top
        const degrees = (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 450) % 360;
        return this.circumference / 360 * degrees;
    }
}