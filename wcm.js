// 1. Did the fix land?
$('.carousel--hero .slick-slide').map((i,s)=>
  String($(s).find('.teaser').attr('style'))).get()

// 2. Is the handler bound?
$._data($('.carousel--hero .carousel__wrapper')[0],'events').setPosition
