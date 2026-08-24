$('.tabs.auth-track').find('.tabs__content > .slick-list > .slick-track > .slick-slide.slick-active > div').length


var height = $activePanel.outerHeight(true);
if (height > 0) {
    $(container).find('.tabs__content > .slick-list').css('height', height + 'px');
}

// before
var $activePanel = $(container).find('.tabs__content .slick-active > div');

// after
var $activePanel = $(container).find('.tabs__content > .slick-list > .slick-track > .slick-slide.slick-active > div');
