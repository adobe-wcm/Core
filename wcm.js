$(document).ready(function () {
  const $iframe  = $('.virtual-tour__iframe');
  const $wrapper = $('.virtual-tour__iframe-wrapper');
  const $cta     = $('.virtual-tour__cta-button');
  const $close   = $('.virtual-tour__iframe-close');

  // Component not on this page — bind nothing.
  if (!$cta.length && !$iframe.length) {
    return;
  }

  let src = '',
      width = '',
      height = '',
      resizeTimer = null;

  function isMobileViewport() {
    return window.matchMedia('(max-width: 992px)').matches;
  }

  function sanitizeUrl(url) {
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.href;
      }
    } catch (e) {
      return '';
    }
    return '';
  }

  // click, Enter or Space
  function isActivation(e) {
    return e.type === 'click' || e.keyCode === 13 || e.keyCode === 32;
  }

  $cta.on('click keydown', function (e) {
    if (!isActivation(e)) {
      return;
    }
    e.preventDefault();

    if (isMobileViewport()) {
      $('body').addClass('vpt-open');
    }

    src = sanitizeUrl($iframe.attr('data-src'));

    if (src) {
      width  = $wrapper.width();
      height = $wrapper.height();
      $iframe.attr({ width: width, height: height }).prop('src', src);
    }

    $wrapper.show();
  });

  $close.on('click keydown', function (e) {
    if (!isActivation(e)) {
      return;
    }
    $wrapper.hide();

    if (isMobileViewport()) {
      $('body').removeClass('vpt-open');
    }
  });

  $(window).off('resize.vpt orientationchange.vpt')
    .on('resize.vpt orientationchange.vpt', function () {
      if (!src) {
        return;
      }

      $iframe.hide();

      // Debounced: one reload per resize gesture instead of one per event.
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        width  = $wrapper.width();
        height = $wrapper.height();

        $iframe.attr({ width: width, height: height }).prop('src', src);

        setTimeout(function () {
          $iframe.show();
        }, 900);
      }, 100);
    });
});
