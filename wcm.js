that.on("init setPosition breakpoint afterChange", function () {
    that.find('.slick-cloned img[data-src]:not([src])').each(function () {
        if (window.lazySizes) {
            lazySizes.loader.unveil(this);
        } else {
            this.src = this.getAttribute('data-src');
            $(this).removeClass('lazyload').addClass('lazyloaded');
        }
    });
});
