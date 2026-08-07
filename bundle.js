/* Cat tooltip - styled to match Cat AI Assistant tooltips.
   Namespaced under .cat-tooltip; arrow flips with Popper placement. */

.cat-tooltip {
  position: absolute;
  z-index: 1070;
  display: block;
  font-family: "Segoe UI", system-ui, sans-serif;
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
}

.cat-tooltip.show {
  opacity: 1;
}

.cat-tooltip .tooltip-inner {
  max-width: 300px;
  padding: 8px 14px;
  font-size: 14px;
  color: #1a1a1a;
  text-align: center;
  white-space: nowrap;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

/* Arrow base */
.cat-tooltip .arrow {
  position: absolute;
  display: block;
  width: 16px;
  height: 8px;
  overflow: hidden;
}

.cat-tooltip .arrow::before {
  position: absolute;
  left: 50%;
  content: "";
  width: 10px;
  height: 10px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transform: translateX(-50%) rotate(45deg);
}

/* Tooltip below element (default) - arrow on top edge, pointing up */
.cat-tooltip.bs-tooltip-bottom,
.cat-tooltip.bs-tooltip-auto[x-placement^="bottom"] {
  padding: 8px 0;
}

.cat-tooltip.bs-tooltip-bottom .arrow,
.cat-tooltip.bs-tooltip-auto[x-placement^="bottom"] .arrow {
  top: 0;
}

.cat-tooltip.bs-tooltip-bottom .arrow::before,
.cat-tooltip.bs-tooltip-auto[x-placement^="bottom"] .arrow::before {
  top: 3px;
}

/* Tooltip above element (flipped) - arrow on bottom edge, pointing down */
.cat-tooltip.bs-tooltip-top,
.cat-tooltip.bs-tooltip-auto[x-placement^="top"] {
  padding: 8px 0;
}

.cat-tooltip.bs-tooltip-top .arrow,
.cat-tooltip.bs-tooltip-auto[x-placement^="top"] .arrow {
  bottom: 0;
}

.cat-tooltip.bs-tooltip-top .arrow::before,
.cat-tooltip.bs-tooltip-top .arrow::before,
.cat-tooltip.bs-tooltip-auto[x-placement^="top"] .arrow::before {
  bottom: 3px;
}


template: '<div class="cat-tooltip" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>',
