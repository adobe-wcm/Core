/**
 * Cat tooltip - standalone, no framework dependency.
 * Works regardless of which Bootstrap version (or none) a page loads.
 * Hover + keyboard focus on desktop, tap on touch, Escape to dismiss.
 * Positioned below the trigger, flips above when the viewport is tight,
 * clamped horizontally so it never leaves the screen.
 *
 * Markup: <button data-cat-tooltip="Text" aria-label="Text">
 * Dynamic content: window.CatTooltips.init(container)
 */
(function (window, document) {
  'use strict';

  const OFFSET = 3;         // gap between trigger and tooltip
  const EDGE = 6;           // min distance from viewport edge
  const isTouch = window.matchMedia('(hover: none)').matches;

  let tip = null;
  let inner = null;
  let arrow = null;
  let currentTrigger = null;

  function build() {
    tip = document.createElement('div');
    tip.className = 'cat-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.id = 'cat-tooltip-' + Date.now();

    arrow = document.createElement('div');
    arrow.className = 'cat-tooltip__arrow';

    inner = document.createElement('div');
    inner.className = 'cat-tooltip__inner';

    tip.appendChild(arrow);
    tip.appendChild(inner);
    document.body.appendChild(tip);
  }

  function position(trigger) {
    const t = trigger.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;

    // Vertical: below by default, flip above when there is no room
    const roomBelow = window.innerHeight - t.bottom;
    const below = roomBelow >= h + OFFSET + EDGE;
    const top = below ? t.bottom + OFFSET : t.top - h - OFFSET;
    tip.setAttribute('data-placement', below ? 'bottom' : 'top');

    // Horizontal: centred on the trigger, clamped to the viewport
    const centre = t.left + (t.width / 2);
    const left = Math.min(
      Math.max(EDGE, centre - (w / 2)),
      window.innerWidth - w - EDGE
    );

    tip.style.top = (top + window.pageYOffset) + 'px';
    tip.style.left = (left + window.pageXOffset) + 'px';

    // Arrow follows the trigger's centre even when the box is clamped
    arrow.style.left = (centre - left) + 'px';
  }

  function show(trigger) {
    const text = trigger.getAttribute('data-cat-tooltip');
    if (!text) {
      return;
    }
    if (!tip) {
      build();
    }
    currentTrigger = trigger;
    inner.textContent = text;
    tip.classList.add('is-visible');
    trigger.setAttribute('aria-describedby', tip.id);
    position(trigger);
  }

  function hide() {
    if (!tip || !currentTrigger) {
      return;
    }
    tip.classList.remove('is-visible');
    currentTrigger.removeAttribute('aria-describedby');
    currentTrigger = null;
  }

  function reposition() {
    if (currentTrigger) {
      position(currentTrigger);
    }
  }

  function initTooltips(context) {
    const scope = context || document;
    const elements = scope.querySelectorAll('[data-cat-tooltip]');

    Array.prototype.forEach.call(elements, function (el) {
      if (el.getAttribute('data-cat-tooltip-init')) {
        return;
      }
      el.setAttribute('data-cat-tooltip-init', 'true');

      if (!isTouch) {
        el.addEventListener('mouseenter', function () { show(el); });
        el.addEventListener('mouseleave', hide);
      }
      el.addEventListener('focus', function () { show(el); });
      el.addEventListener('blur', hide);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { hide(); }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTooltips(document);
  });
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', reposition);

  window.CatTooltips = { init: initTooltips, hide: hide };
}(window, document));
