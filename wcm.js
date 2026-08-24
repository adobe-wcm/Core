that.on("init setPosition breakpoint", function () {
    that.find(".slick-slide .teaser").matchHeight({ byRow: false });
    fixCarouselSlideAccessibility(that);
    fixCarouselDotsAccessibility(that);
});
