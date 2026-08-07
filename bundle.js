/* Cat tooltip - Cat AI Assistant look; arrow flips with Popper. */

.cat-tooltip {
  position: absolute;
  z-index: 1070;
  display: block;
  padding: 8px 0;
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
  width: 10px;
  height: 10px;
  content: "";
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transform: translateX(-50%) rotate(45deg);
}

/* Below element (default): arrow at top edge */
.cat-tooltip[x-placement^="bottom"] .arrow { top: 0; }
.cat-tooltip[x-placement^="bottom"] .arrow::before { top: 3px; }

/* Above element (flipped): arrow at bottom edge */
.cat-tooltip[x-placement^="top"] .arrow { bottom: 0; }
.cat-tooltip[x-placement^="top"] .arrow::before { bottom: 3px; }
