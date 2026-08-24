$('.carousel--hero .slick-slide').map((i,s)=>{
  const im = $(s).find('.teaser__img-wrap img')[0];
  return $(s).attr('data-slick-index') + ' | ' +
    ($(s).hasClass('slick-cloned')?'clone':'real') + ' | src:' +
    (im && im.getAttribute('src') ? 'yes':'NO') + ' | ' + (im ? im.className : '-');
}).get()


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
