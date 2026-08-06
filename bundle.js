document.getElementById('tt-css')?.remove();
var s = document.createElement('style');
s.id = 'tt-css';
s.textContent = `
.tooltip{position:absolute;z-index:1070;display:block;opacity:0;font-family:"Segoe UI",system-ui,sans-serif}
.tooltip.show{opacity:1}
.tooltip .arrow{display:none}
.tooltip-inner{
  max-width:300px;
  padding:3px 6px;
  font-size:12px;
  color:#000;
  text-align:left;
  background-color:#f9f9f9;
  border:1px solid #b0b0b0;
  border-radius:3px;
  box-shadow:0 2px 4px rgba(0,0,0,.15);
  white-space:nowrap;
}`;
document.head.appendChild(s);
