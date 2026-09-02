function checkAllExpandedButton() {
  if (checkAllExpandedButton.animating) { return; }
  checkAllExpandedButton.animating = true;

  const $btn = $(this);
  const collapse = isAllExpandedButton();

  if (collapse) {
    // collapse all and change button text
    const $inner = $compareHeader.addClass('closed').nextUntil($compareHeader).find('.cell--inner');
    $inner.slideUp();
    $btn.text($btn.data('open'));
    $inner.promise().done(() => {
      $inner.closest('tr').hide();
      checkAllExpandedButton.animating = false;
    });

  } else {
    // expand all and change button text
    const $inner = $compareHeader.removeClass('closed').nextUntil($compareHeader).show().find('.cell--inner');
    $inner.slideDown();
    $btn.text($btn.data('close'));
    $inner.promise().done(() => {
      checkAllExpandedButton.animating = false;
    });
  }
}
