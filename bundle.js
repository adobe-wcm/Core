const w = document.documentElement.clientWidth;
[...document.querySelectorAll('*')]
  .filter(el => el.getBoundingClientRect().right > w + 1)
  .forEach(el => console.log(
    Math.round(el.getBoundingClientRect().right),
    getComputedStyle(el).marginRight,
    el.className || el.tagName
  ));
