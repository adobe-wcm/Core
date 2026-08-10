/**
 * pdptabs.js — performance-optimized
 * Behaviour is intentionally identical to the production version.
 * Top-level function declarations are kept global (NOT wrapped in an IIFE)
 * so any other clientlib calling PDPTabControl()/initPDPTabMobile() keeps working.
 */

// Reset Slick carousel wrappers to presentational roles and remove SR attributes
function cleanupSlickA11y($controls) {
  if (!$controls.hasClass('slick-initialized')) {
    return;
  }

  $controls.find('.slick-list, .slick-track').attr('role', 'presentation');
  $controls.find('.slick-slide')
    .attr('role', 'presentation')
    .removeAttr('aria-hidden tabindex');
  $controls.find('.slick-prev, .slick-next').attr({ 'aria-hidden': 'true', 'tabindex': '-1' });
}

// Sync ARIA tab roles, states, and relationships for accessibility
function syncPdpTabsAria($group) {
  const $controls = $group.find('.pdp-tab__controls');
  const $tabs = $controls.find('.control--link');
  const setSize = String($tabs.length);

  $controls.attr('role', 'tablist');

  $tabs.each(function (index) {
    const $tab = $(this);
    const isActive = $tab.hasClass('active');

    $tab.attr({
      'role': 'tab',
      'aria-selected': isActive ? 'true' : 'false',
      'tabindex': isActive ? '0' : '-1',
      'aria-posinset': String(index + 1),
      'aria-setsize': setSize
    });
  });

  $group.find('.pdp-tab__content').each(function () {
    const $panel = $(this);
    const panelId = this.id;
    const attrs = {
      'role': 'tabpanel',
      'aria-hidden': $panel.hasClass('active') ? 'false' : 'true'
    };

    if (panelId) {
      const $labelTab = $tabs.filter('[data-tab="' + panelId + '"]');
      const labelId = $labelTab.length ? $labelTab.attr('id') : '';

      if (labelId) {
        attrs['aria-labelledby'] = labelId;
        $labelTab.attr('aria-controls', panelId);
      }
    }

    $panel.attr(attrs);
  });

  cleanupSlickA11y($controls);
}

// Activate tab, show panel, and update ARIA state
function PDPTabControl(evt, tabID) {
  // !! Keep the original fallback selector here — it was cut off in the screenshot.
  const $selectedTab = evt && evt.currentTarget ? $(evt.currentTarget) : $('.auth .pdp-tab__group .pdp-tab__co…');
  const $group = $selectedTab.closest('.pdp-tab__group');

  if (!$selectedTab.length || !$group.length || $selectedTab.hasClass('active')) {
    return;
  }

  const $targetPanel = $group.find('#' + tabID);

  if (!$targetPanel.length) {
    return;
  }

  // Skip the target in the reset pass: avoids a hide() + show() reflow on the panel being opened
  $group.find('.pdp-tab__content').not($targetPanel).removeClass('active').hide();
  $group.find('.pdp-tab__controls .control--link').not($selectedTab).removeClass('active');

  $targetPanel.addClass('active').show();
  $selectedTab.addClass('active');

  syncPdpTabsAria($group);
}

// Initialize Slick carousel on mobile with accessibility: false to prevent double SR announcements
function initPDPTabMobile() {
  const $controls = $('.auth .pdp-tab__group .pdp-tab__controls');

  if (!$controls.length) {
    return;
  }

  // Sync ARIA on Slick init/reinit; cleanup on position/after-change
  $controls.off('init.pdpTabs reInit.pdpTabs setPosition.pdpTabs afterChange.pdpTabs')
    .on('init.pdpTabs reInit.pdpTabs', function () {
      syncPdpTabsAria($(this).closest('.pdp-tab__group'));
    })
    .on('setPosition.pdpTabs afterChange.pdpTabs', function () {
      cleanupSlickA11y($(this));
    });

  // Slick config: accessibility: false prevents Slick from overwriting ARIA attrs
  $controls.slick({
    infinite: false,
    arrows: true,
    focusOnSelect: false,
    accessibility: false,
    responsive: [
      { breakpoint: 992, settings: { slidesToShow: 4, arrows: false } },
      { breakpoint: 768, settings: { slidesToShow: 3, arrows: false } },
      { breakpoint: 492, settings: { slidesToShow: 2, arrows: false } }
    ]
  });

  // Safety net in case the init event fired before the handler above was attached
  $controls.each(function () {
    syncPdpTabsAria($(this).closest('.pdp-tab__group'));
  });
}

$(document).ready(function () {
  const $window = $(window);
  const resizeDelay = 500;
  const mobileMaxWidth = 990;
  const PDPInit = '.pdp-tab__controls.slick-initialized';
  const controlLink = '.pdp-tab__controls .control--link';
  let resizeTimer = null;

  // Replaces the permanent setInterval poll with a debounced resize handler
  const applyResponsiveTabs = function () {
    const $initialized = $(PDPInit);

    if ($window.width() < mobileMaxWidth) {
      if ($initialized.length === 0) {
        initPDPTabMobile();
      }
    } else if ($initialized.length > 0) {
      $initialized.slick('unslick');
    }
  };

  applyResponsiveTabs();

  $window.off('resize.pdpTabs orientationchange.pdpTabs')
    .on('resize.pdpTabs orientationchange.pdpTabs', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyResponsiveTabs, resizeDelay);
    });

  $('.auth .pdp-tab__group').each(function () {
    syncPdpTabsAria($(this));
  });

  // Click: activate tab and panel
  $(document).off('click.pdpTabs', controlLink)
    .on('click.pdpTabs', controlLink, function (e) {
      e.preventDefault();
      e.stopPropagation();
      PDPTabControl({ currentTarget: this }, this.getAttribute('data-tab'));
    });

  // Keyboard: Enter/Space activates; arrows move focus only (no double announce)
  $(document).off('keydown.pdpTabs', controlLink)
    .on('keydown.pdpTabs', controlLink, function (e) {
      const key = e.keyCode;

      // Enter/Space: activate current focused tab
      if (key === 13 || key === 32) {
        e.preventDefault();
        e.stopPropagation();
        PDPTabControl({ currentTarget: this }, this.getAttribute('data-tab'));
        return;
      }

      if (key !== 37 && key !== 39 && key !== 36 && key !== 35) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const $controls = $(this).closest('.pdp-tab__controls');
      const tabs = $controls.find('.control--link');
      const total = tabs.length;
      const current = tabs.index(this);
      let newIndex;

      if (key === 39) {
        newIndex = current + 1 < total ? current + 1 : 0;
      } else if (key === 37) {
        newIndex = current > 0 ? current - 1 : total - 1;
      } else if (key === 36) {
        newIndex = 0;
      } else {
        newIndex = total - 1;
      }

      const newFocus = tabs.eq(newIndex);

      // Arrows: on mobile, shift Slick viewport to keep focused tab visible
      if ($controls.hasClass('slick-initialized')) {
        const slickInstance = $controls.slick('getSlick');
        const slidesToShow = Math.max(1, parseInt(slickInstance.options.slidesToShow, 10) || 1);
        const maxStart = Math.max(0, total - slidesToShow);
        const targetStart = Math.min(maxStart, Math.max(0, newIndex - slidesToShow + 1));

        if (slickInstance.currentSlide !== targetStart) {
          $controls.slick('slickGoTo', targetStart);
        }
      }

      // Focus arrival without activation = single SR announcement
      newFocus.focus();
    });
});
