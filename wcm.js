const $s = $('#tabs-100a56e058-item-f408fb6881-tabpanel').closest('.slick-slider');
console.table($s.find('.slick-slide').map(function(i, el) {
  const cs = getComputedStyle(el);
  return {
    idx: el.getAttribute('data-slick-index'),
    active: el.classList.contains('slick-active'),
    ariaHidden: el.getAttribute('aria-hidden'),
    opacity: cs.opacity,
    z: cs.zIndex,
    left: cs.left,
    h: Math.round(el.getBoundingClientRect().height),
    top: Math.round(el.getBoundingClientRect().top)
  };
}).get());
console.log('track h:', $s.find('.slick-track').height(), 'list h:', $s.find('.slick-list').height());
