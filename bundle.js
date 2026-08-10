const tip = document.querySelector('.cat-tooltip');
const arrow = tip.querySelector('.arrow');
const inner = tip.querySelector('.tooltip-inner');
console.log({
  placement: tip.getAttribute('x-placement'),
  arrowStyle: arrow.getAttribute('style'),
  arrowRect: arrow.getBoundingClientRect(),
  innerRect: inner.getBoundingClientRect(),
  tipRect: tip.getBoundingClientRect()
});
