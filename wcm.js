const resizeDelay = 500;
  const PDPInit = '.pdp-tab__controls.slick-initialized';
  const $window = $(window);
  let resizeTimer = null;

  const resizer = function () {
    const $init = $(PDPInit);

    if ($window.width() < 990) {
      if (!$init.length) {
        initPDPTabMobile();
      }
    } else if ($init.length) {
      $init.slick('unslick');
    }
  };

  resizer();

  $window.off('resize.pdpTabs orientationchange.pdpTabs')
    .on('resize.pdpTabs orientationchange.pdpTabs', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizer, resizeDelay);
    });
