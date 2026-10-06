function checkIfPromoExists(promoId, promoName) {
  return dataLayer.some(function (entry) {
    return !!entry && entry.event === 'view_promotion' && !!entry.ecommerce &&
      entry.ecommerce.promotion_id === promoId &&
      entry.ecommerce.promotion_name === promoName;
  });
}


if(!checkIfPromoExists(id, $(element).data('name'))){


$(cardContainerId).on("beforeChange", function(event, slick, currentSlide, nextSlide){
  var rect = this.getBoundingClientRect();
  if(currentSlide !== nextSlide && rect.bottom > 0 && rect.top < $(window).height()){
    promoViewTracker(slick.$slides[nextSlide]);
  }
});

promoViewTracker($(cardContainerId).find(cardId + ".slick-current")[0] || $(cardContainerId).find(cardId)[0]);

dataLayer.filter(e => /_promotion/.test(e.event)).map(e => [e.event, e.ecommerce.promotion_name, e.ecommerce.items[0].index])
