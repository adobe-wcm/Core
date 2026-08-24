$('.carousel--hero .slick-slide').map((i,s)=>$(s).find('.teaser').attr('style')).get()

(() => {
  const $w = $('.carousel--hero .carousel__wrapper');
  const s = $w.slick('getSlick');
  return {
    trackWidth: $('.carousel--hero .slick-track').css('width'),
    infinite: s.options.infinite,
    slideCount: s.slideCount,
    domSlides: $('.carousel--hero .slick-slide').length,
    cloned: $('.carousel--hero .slick-cloned').length,
    dots: $('.carousel--hero .carousel__pagination__single').length,
    events: Object.keys($._data($w[0], 'events') || {}),
    wrappers: $('.carousel--hero .carousel__wrapper').length
  };
})()                               // duplicate IDs


that.on('init setPosition breakpoint', function () {
    that.find('.slick-slide .teaser').matchHeight({ byRow: false });
    fixCarouselSlideAccessibility(that);
    fixCarouselDotsAccessibility(that);
});
