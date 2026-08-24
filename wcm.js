(() => {
  const $s = $('.carousel--hero .slick-slide[data-slick-index="4"]');
  const t  = $s.find('.teaser')[0];
  const cs = getComputedStyle(t);
  const row = t.querySelector('.row');
  const iw  = t.querySelector('.teaser__img-wrap');
  const tw  = t.querySelector('.teaser__text-wrap');
  return {
    // where does 535 come from?
    inlineStyle : t.getAttribute('style'),
    teaserH     : cs.height,
    teaserMinH  : cs.minHeight,
    teaserDisplay: cs.display,
    teaserAlign : cs.alignItems,
    // the boxes inside
    rowH        : getComputedStyle(row).height,
    rowDisplay  : getComputedStyle(row).display,
    imgWrapH    : getComputedStyle(iw).height,
    textWrapH   : getComputedStyle(tw).height,
    textWrapPos : getComputedStyle(tw).position,
    // the boxes outside
    slideH      : $s.height(),
    trackH      : $('.carousel--hero .slick-track').height(),
    listH       : $('.carousel--hero .slick-list').height(),
    // is 535 identical on a slide that renders fine?
    slide0Inline: $('.carousel--hero .slick-slide[data-slick-index="0"] .teaser').attr('style'),
    slide0RowH  : getComputedStyle($('.carousel--hero .slick-slide[data-slick-index="0"] .teaser .row')[0]).height,
    // who wrote it — does it survive removal?
    afterUnset  : (t.style.height = '', getComputedStyle(t).height)
  };
})()
