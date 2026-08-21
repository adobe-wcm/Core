const $p = $('#tabs-100a56e058-item-f408fb6881-tabpanel');
const $s = $p.closest('.slick-slider');
const $sl = $s.find('.slick-slide').first();
console.log({
  panel: $p.length,
  slider: $s.length,
  sliderW: $s.width(),
  listW: $s.find('.slick-list').width(),
  slideInline: $sl[0].style.width,
  trackLeft: $s.find('.slick-track')[0].style.left
});
