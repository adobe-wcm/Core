$(window).on('resize orientationchange', function(event) {
    event.preventDefault();

    if(src){
      $('.virtual-tour__iframe').hide();

      setTimeout(function(){
        width = $('.virtual-tour__iframe-wrapper').width();
        height = $('.virtual-tour__iframe-wrapper').height();

        $('.virtual-tour__iframe').attr('width', width);
        $('.virtual-tour__iframe').attr('height', height);

        // Show as soon as the tour has actually loaded
        $('.virtual-tour__iframe')
          .off('load.vpt')
          .one('load.vpt', function () {
            clearTimeout(showTimer);
            $('.virtual-tour__iframe').show();
          });

        $('.virtual-tour__iframe').prop('src', src);

        // Fallback, same 1000ms as before
        clearTimeout(showTimer);
        showTimer = setTimeout(function(){
          $('.virtual-tour__iframe').off('load.vpt').show();
        }, 1000);

      }, 100);
    }
  });
