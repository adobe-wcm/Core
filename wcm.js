$compareHeader.on('click', function () {
  if (checkAllExpandedButton.animating) { return; }
  checkAllExpandedButton.animating = true;

  const $header = $(this);

  if ($header.hasClass('closed')) {
    // show things
    const $inner = $header.removeClass('closed').nextUntil($compareHeader).show().find('.cell--inner');
    $inner.slideDown();
    $inner.promise().done(() => {
      checkAllExpandedButton.animating = false;
    });
  } else {
    // hide things
    const $inner = $header.addClass('closed').nextUntil($compareHeader).find('.cell--inner');
    $inner.slideUp();
    $inner.promise().done(() => {
      $inner.closest('tr').hide();
      checkAllExpandedButton.animating = false;
    });
  }

  if (isAllExpandedButton()) {
    $compareExpandCollapseBtn.text($compareExpandCollapseBtn.data('close'));
  } else {
    $compareExpandCollapseBtn.text($compareExpandCollapseBtn.data('open'));
  }
});
