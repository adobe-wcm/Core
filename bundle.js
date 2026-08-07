/**
 * Cat tooltip: Bootstrap 4 + Popper (vendor). Hover/tap via
 * Bootstrap; focus, blur and Escape via native listeners.
 * Markup: <a data-cat-tooltip="Text" tabindex="0">
 * Dynamic content: window.CatTooltips.init(container)
 */
(function (window, document, $) {
  'use strict';

  var isTouch = window.matchMedia('(hover: none)').matches;

  function initTooltips(context) {
    $('[data-cat-tooltip]', context || document).each(function () {
      var $el = $(this);

      if ($el.data('catTooltip')) {
        return;
      }
      $el.data('catTooltip', true).tooltip({
        container: 'body',
        boundary: 'window',
        title: $el.attr('data-cat-tooltip'),
        template: '<div class="cat-tooltip" role="tooltip"><div class="tooltip-inner"></div></div>',
        trigger: isTouch ? 'focus' : 'hover'
      });

      this.addEventListener('focus', function () { $el.tooltip('show'); });
      this.addEventListener('blur', function () { $el.tooltip('hide'); });
      this.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { $el.tooltip('hide'); }
      });
    });
  }

  $(function () { initTooltips(document); });

  window.CatTooltips = { init: initTooltips };
}(window, document, window.jQuery));

/* Cat tooltip - native browser look.
   Namespaced under .cat-tooltip (custom Bootstrap template)
   so global .tooltip styles are neither applied nor overridden. */

.cat-tooltip {
  position: absolute;
  z-index: 1070; /* Bootstrap scale: above modal (1050) and popover (1060) */
  display: block;
  font-family: "Segoe UI", system-ui, sans-serif;
  opacity: 0;
}

.cat-tooltip.show {
  opacity: 1;
}

.cat-tooltip .tooltip-inner {
  max-width: 300px;
  padding: 3px 6px;
  font-size: 12px;
  color: #000;
  text-align: left;
  white-space: nowrap;
  background-color: #f9f9f9;
  border: 1px solid #b0b0b0;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
