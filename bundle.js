const $el = jQuery('#utility_links_sites_apps');
$el.tooltip('show');

setTimeout(() => {
  const tip = document.querySelector('.cat-tooltip');
  const arrow = tip.querySelector('.arrow');
  const inner = tip.querySelector('.tooltip-inner');
  console.log({
    placement: tip.getAttribute('x-placement'),
    arrowStyle: arrow.getAttribute('style'),
    arrowRect: arrow.getBoundingClientRect(),
    innerRect: inner.getBoundingClientRect(),
    tipRect: tip.getBoundingClientRect()
  });
}, 300);
