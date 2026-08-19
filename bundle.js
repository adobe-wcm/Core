let el = document.querySelector('.row.track-pdp-breadcrumb');
while (el && el !== document.body) {
  const c = getComputedStyle(el), r = el.getBoundingClientRect();
  console.log(el.className.slice(0,40),
    '| L', Math.round(r.left), 'R', Math.round(r.right),
    '| pad', c.paddingLeft, c.paddingRight,
    '| mar', c.marginLeft, c.marginRight);
  el = el.parentElement;
}
