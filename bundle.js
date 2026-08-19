const w = document.documentElement.clientWidth;
[...document.querySelectorAll('*')].forEach(el => {
  const r = el.getBoundingClientRect();
  if (r.right > w + 1 || r.left < -1) {
    console.log(Math.round(r.left), Math.round(r.right), Math.round(r.width), el);
  }
});
