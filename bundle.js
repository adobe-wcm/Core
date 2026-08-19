// at scroll top
document.documentElement.scrollWidth - document.documentElement.clientWidth  // expect 0
window.scrollTo(0, 500);
document.documentElement.scrollWidth - document.documentElement.clientWidth  // expect 15
