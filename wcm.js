// Unveil lazysizes images inside a slick carousel.
// Slick moves slides via transform, which fires no scroll/resize,
// so lazysizes never re-evaluates offscreen slides on slide change.
function unveilSlides($ctx) {
    if (!window.lazySizes || !$ctx || !$ctx.length) {
        return;
    }
    $ctx.find('.lazyload').each(function () {
        lazySizes.loader.unveil(this);
    });
}


that.on("init setPosition breakpoint", function () {
        that.find(".slick-slide .teaser").matchHeight({ byRow: false });



  

        $('.carousel--hero .slick-slide').map((i,s)=>{
  const im=$(s).find('.teaser__img-wrap img')[0];
  return $(s).attr('data-slick-index')+' | '+(im&&im.getAttribute('src')?'yes':'NO');
}).get()
