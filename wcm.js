history.replaceState(null, "", location.href.split("?")[0]);

var $modal = $('#build-price-modal-productHero');

function doRedirect() {
  var a = document.createElement('a');
  a.href = redirectUrl;
  a.referrerPolicy = 'no-referrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

if ($modal.hasClass('show')) {          // Bootstrap 4/5; use 'in' for BS3
  $modal.one('hidden.bs.modal', doRedirect);
  $modal.modal('hide');
} else {
  doRedirect();
}
