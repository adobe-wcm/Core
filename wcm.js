$('.carousel--hero .slick-slide').map((i,s)=>$(s).find('.teaser').attr('style')).get()

const $w = $('.carousel--hero .carousel__wrapper');
$('.carousel--hero .slick-track').css('width');           // 4840 or 2200?
$w.slick('getSlick').options.infinite;                    // still true?
$w.slick('getSlick').slideCount;
$('.carousel--hero .carousel__pagination__single').length; // 5 or 10?
Object.keys($._data($w[0],'events') || {});                // duplicate afterChange?
$('[id="showhide"]').length;                               // duplicate IDs


that.on('init setPosition breakpoint', function () {
    that.find('.slick-slide .teaser').matchHeight({ byRow: false });
    fixCarouselSlideAccessibility(that);
    fixCarouselDotsAccessibility(that);
});
