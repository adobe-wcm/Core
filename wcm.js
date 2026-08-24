$('.carousel--hero .slick-slide').map((i,s)=>$(s).find('.teaser').attr('style')).get()

that.on('init setPosition breakpoint', function () {
    that.find('.slick-slide .teaser').matchHeight({ byRow: false });
    fixCarouselSlideAccessibility(that);
    fixCarouselDotsAccessibility(that);
});
