// 1. CSS (must re-add after every reload)
if (!document.getElementById('tt-css')) {
  var s = document.createElement('style');
  s.id = 'tt-css';
  s.textContent = '.tooltip{position:absolute;z-index:1070;display:block;font-size:.875rem;opacity:0}.tooltip.show{opacity:.9}.tooltip .arrow{position:absolute;display:block;width:.8rem;height:.4rem}.tooltip .arrow::before{position:absolute;content:"";border-color:transparent;border-style:solid}.bs-tooltip-top{padding:.4rem 0}.bs-tooltip-top .arrow{bottom:0}.bs-tooltip-top .arrow::before{top:0;border-width:.4rem .4rem 0;border-top-color:#000}.bs-tooltip-bottom{padding:.4rem 0}.bs-tooltip-bottom .arrow{top:0}.bs-tooltip-bottom .arrow::before{bottom:0;border-width:0 .4rem .4rem;border-bottom-color:#000}.tooltip-inner{max-width:200px;padding:.25rem .5rem;color:#fff;text-align:center;background-color:#000;border-radius:.25rem}';
  document.head.appendChild(s);
}

// 2. Reset + init (hover handled by Bootstrap)
var el = document.getElementById('utility_links_sites_apps');
var $el = $(el);
$el.tooltip('dispose');
$el.attr('title', 'pichi').tooltip({ container: 'body', trigger: 'hover', boundary: 'window' });

// 3. Keyboard focus — bound natively on the element, can't be blocked by site JS
el.addEventListener('focus', function () { $el.tooltip('show'); });
el.addEventListener('blur',  function () { $el.tooltip('hide'); });
