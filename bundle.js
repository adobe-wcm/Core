(() => {
  const doc = document.documentElement;
  const over = () => doc.scrollWidth - doc.clientWidth;
  const base = over();
  console.log('%c=== OVERFLOW DIAGNOSTIC ===', 'font-weight:bold');
  console.log('viewport:', doc.clientWidth, '| scrollWidth:', doc.scrollWidth, '| overflow:', base);
  if (base <= 0) return console.log('No overflow. Scroll position or state differs.');

  // --- 1. bisect by hiding ---
  const hide = el => { const p = el.style.display; el.style.display = 'none'; const r = over(); el.style.display = p; return r; };
  const chain = [];
  let node = document.body;
  outer: while (true) {
    for (const child of node.children) {
      if (hide(child) <= 0) { chain.push(child); node = child; continue outer; }
    }
    break;
  }
  console.log('%c--- culprit chain (outer to inner) ---', 'font-weight:bold');
  chain.forEach((el, i) => console.log(' '.repeat(i*2) + '↳', el.tagName, el.className || '(no class)', el));
  const culprit = chain[chain.length - 1] || document.body;
  console.log('%cCULPRIT:', 'color:red;font-weight:bold', culprit);

  // --- 2. full box report on culprit + ancestors ---
  console.log('%c--- box model up the tree ---', 'font-weight:bold');
  let el = culprit;
  while (el && el !== doc) {
    const c = getComputedStyle(el), r = el.getBoundingClientRect();
    console.log((el.className || el.tagName).slice(0,45),
      '| L', Math.round(r.left), 'R', Math.round(r.right),
      '| w', c.width, '| pad', c.paddingLeft, c.paddingRight,
      '| mar', c.marginLeft, c.marginRight,
      '| pos', c.position, '| ovf', c.overflowX,
      '| tf', c.transform === 'none' ? '-' : c.transform);
    el = el.parentElement;
  }

  // --- 3. pseudo-elements on culprit subtree ---
  console.log('%c--- pseudo-elements extending past viewport ---', 'font-weight:bold');
  const w = doc.clientWidth;
  let foundPseudo = false;
  [culprit, ...culprit.querySelectorAll('*')].forEach(e => {
    ['::before','::after'].forEach(ps => {
      const c = getComputedStyle(e, ps);
      if (c.content === 'none' || !c.content) return;
      const suspect = [c.width, c.minWidth, c.maxWidth, c.marginRight, c.right, c.left, c.transform]
        .filter(v => v && (v.includes('vw') || (parseFloat(v) > w) || (parseFloat(v) < 0)));
      if (suspect.length) { foundPseudo = true; console.log(e.className || e.tagName, ps, c.width, c.marginRight, c.left, c.right, c.position); }
    });
  });
  if (!foundPseudo) console.log('(none suspicious)');

  // --- 4. vw units anywhere ---
  console.log('%c--- vw units in stylesheets ---', 'font-weight:bold');
  let vwHits = 0;
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const scan = rs => { for (const r of rs) {
      if (r.cssRules) scan(r.cssRules);
      else if (r.cssText && /\d+vw/.test(r.cssText) && !/100vh/.test(r.selectorText||'')) { console.log(r.cssText.slice(0,160)); vwHits++; }
    }};
    scan(rules);
  }
  if (!vwHits) console.log('(none)');

  // --- 5. positive right margins on wide elements ---
  console.log('%c--- elements with margin-right pushing past viewport ---', 'font-weight:bold');
  let marHits = 0;
  document.querySelectorAll('*').forEach(e => {
    const c = getComputedStyle(e), r = e.getBoundingClientRect();
    const mr = parseFloat(c.marginRight) || 0;
    if (mr > 0 && r.right + mr > w + 1) { console.log(Math.round(r.right), '+', mr, '=', Math.round(r.right+mr), e.className || e.tagName); marHits++; }
  });
  if (!marHits) console.log('(none)');

  // --- 6. html/body ---
  console.log('%c--- html / body ---', 'font-weight:bold');
  [['html',doc],['body',document.body]].forEach(([n,e]) => {
    const c = getComputedStyle(e);
    console.log(n, '| w', c.width, '| pad', c.paddingLeft, c.paddingRight, '| mar', c.marginLeft, c.marginRight, '| ovf', c.overflowX, '| sw', e.scrollWidth, '| rect', Math.round(e.getBoundingClientRect().right));
  });
})();
