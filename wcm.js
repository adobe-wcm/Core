$('.carousel--hero .slick-slide').map((i,s)=>
  $(s).attr('data-slick-index')+' | slide '+$(s).height()+
  ' | teaser '+$(s).find('.teaser').height()+
  ' | img '+$(s).find('.teaser__img-wrap img').height()+
  ' | text '+$(s).find('.teaser__text-wrap').height()).get()


$('.carousel--hero .slick-track').height()
$('.carousel--hero .slick-list').height()
