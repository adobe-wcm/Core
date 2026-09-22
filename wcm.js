(function () {
  console.clear();
  console.log('%cFORM DIAGNOSTIC', 'font-size:14px;font-weight:bold;color:#4CAF50');

  console.group('7. Granite.I18n availability + locale');
  console.log('typeof Granite:', typeof Granite);
  console.log('typeof Granite?.I18n:', typeof (window.Granite && Granite.I18n));
  console.log('html lang attr:', document.documentElement.lang);
  if (typeof Granite !== 'undefined' && Granite.I18n) {
    try { console.log('Granite.I18n.get("field_required"):', Granite.I18n.get('field_required')); } catch (e) { console.log('lookup failed:', e.message); }
  }
  console.groupEnd();

  console.group('6. Currently visible label.error');
  Array.from(document.querySelectorAll('label.error')).forEach(function (el) {
    if (getComputedStyle(el).display !== 'none') {
      console.log(el.id || '(no id)', '|', JSON.stringify(el.textContent.trim()));
    }
  });
  console.groupEnd();

  console.group('9. Resource load order (scripts/xhr only)');
  performance.getEntriesByType('resource')
    .filter(function (r) { return /\.js($|\?)|newformGet|verifyEmailData|newforms/.test(r.name); })
    .sort(function (a, b) { return a.startTime - b.startTime; })
    .forEach(function (r) { console.log(Math.round(r.startTime) + 'ms', r.initiatorType, r.name); });
  console.groupEnd();

  var seen = new WeakMap();
  document.querySelectorAll('[id^="error-msg-"]').forEach(function (el) {
    seen.set(el, { text: el.textContent, display: getComputedStyle(el).display });
  });

  var mo = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      var el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      var errEl = el && el.closest && el.closest('[id^="error-msg-"]');
      if (!errEl) return;
      var prev = seen.get(errEl) || {};
      var nowText = errEl.textContent;
      var nowDisplay = getComputedStyle(errEl).display;
      if (prev.text !== nowText || prev.display !== nowDisplay) {
        console.groupCollapsed('%cCHANGE: ' + errEl.id, 'color:#FF9800;font-weight:bold');
        console.log('text:', JSON.stringify(prev.text), '→', JSON.stringify(nowText));
        console.log('display:', prev.display, '→', nowDisplay);
        console.trace('call stack');
        console.groupEnd();
        seen.set(errEl, { text: nowText, display: nowDisplay });
      }
    });
  });
  mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class'] });

  window.__formDiagStop = function () { mo.disconnect(); console.log('Watcher stopped.'); };
  console.log('%cWatcher is live — trigger blur/submit now. Run __formDiagStop() to stop.', 'color:#2196F3');
})();
