const w = document.documentElement.clientWidth;
let worst = null, max = w;
document.querySelectorAll('*').forEach(el => {
  const r = el.getBoundingClientRect();
  if (r.right > max) {
    let p = el.parentElement, clip = false;
    while (p) {
      const o = getComputedStyle(p).overflowX;
      if (o !== 'visible') { clip = true; break; }
      p = p.parentElement;
    }
    if (!clip) { max = r.right; worst = el; }
  }
});
console.log(max, worst);
