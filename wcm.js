(function () {
  console.clear();
  console.log('%cFORM DIAGNOSTIC', 'font-size:14px;font-weight:bold;color:#4CAF50');

  // 1. FORM IDENTITY
  console.group('1. Form identity');
  var formIdVal = document.getElementById('form-id')?.value || document.querySelector('input[name="formId"]')?.value;
  var variationId = document.getElementById('form-variation-id')?.value;
  var enhancedFlagEl = document.getElementById('enhancedSFFormFlag');
  var enhancedFlag = enhancedFlagEl ? enhancedFlagEl.textContent.trim() : null;
  console.log('formId:', formIdVal);
  console.log('formVariationId:', variationId);
  console.log('enhancedSFFormFlag (raw text):', enhancedFlag);
  console.log('resourceType attr:', document.getElementById('form-resource-path')?.getAttribute('data-resource-type'));
  console.log('window.formId:', typeof formId !== 'undefined' ? formId : '(not defined yet)');
  console.log('typeof isLegacySFForm:', typeof isLegacySFForm);
  if (typeof isLegacySFForm === 'function' && formIdVal) {
    try { console.log('isLegacySFForm(formId) result:', isLegacySFForm(formIdVal)); } catch (e) { console.log('isLegacySFForm threw:', e.message); }
  }
  console.groupEnd();

  // 2. SCRIPTS LOADED
  console.group('2. Scripts on page');
  Array.from(document.scripts).forEach(function (s) {
    if (s.src) console.log(s.src);
  });
  console.groupEnd();

  // 3. GLOBAL VALIDATION FUNCTIONS PRESENT
  console.group('3. Validation functions detected');
  ['validateSubmit', 'consentLogic', 'checkSearchBeforeAsk', 'displayState', 'handleMailingCountryChange',
   'onloadValidation', 'isLegacySFForm', 'zipCode', 'zipcodeErrorMessage'].forEach(function (fn) {
    console.log(fn + ':', typeof window[fn]);
  });
  console.log('jQuery Validate plugin present ($.fn.valid):', typeof jQuery !== 'undefined' && typeof jQuery.fn.valid === 'function');
  console.groupEnd();

  // 4. .required FIELDS + THEIR ERROR LABEL MAPPING
  console.group('4. Required fields → error label check');
  document.querySelectorAll('.required').forEach(function (el) {
    var isFieldset = el.tagName === 'FIELDSET';
    var key = isFieldset ? el.id : (el.name || el.id);
    var lblId = 'error-msg-' + key + '-required';
    var lbl = document.getElementById(lblId);
    console.log(
      el.tagName, key,
      '| label found:', !!lbl,
      '| label tag:', lbl ? lbl.tagName : '-',
      '| label class:', lbl ? lbl.className : '-',
      '| visible now:', lbl ? (getComputedStyle(lbl).display !== 'none') : '-',
      '| current text:', lbl ? lbl.textContent.trim() : '-'
    );
  });
  console.groupEnd();

  // 5. ALL error-msg-* ELEMENTS, TEXT + VISIBILITY SNAPSHOT
  console.group('5. All error-msg-* elements (current state)');
  document.querySelectorAll('[id^="error-msg-"]').forEach(function (el) {
    console.log(el.id, '| tag:', el.tagName, '| class:', el.className,
      '| display:', getComputedStyle(el).display, '| text:', JSON.stringify(el.textContent.trim()));
  });
  console.groupEnd();

  // 6. VISIBLE ERRORS RIGHT NOW (what the submit-gate checks)
  console.group('6. Currently visible label.error (this is what blocks submit)');
  document.querySelectorAll('label.error:visible, label.error').forEach(function (el) {
    if (getComputedStyle(el).display !== 'none') {
      console.log(el.id || '(no id)', '|', JSON.stringify(el.textContent.trim()));
    }
  });
  console.groupEnd();

  // 7. i18n / TRANSLATED TEXT SOURCES ON PAGE
  console.group('7. Granite.I18n availability + locale');
  console.log('typeof Granite:', typeof Granite);
  console.log('typeof Granite?.I18n:', typeof (window.Granite && Granite.I18n));
  console.log('html lang attr:', document.documentElement.lang);
  if (typeof Granite !== 'undefined' && Granite.I18n) {
    try { console.log('Granite.I18n.get("field_required"):', Granite.I18n.get('field_required')); } catch (e) { console.log('lookup failed:', e.message); }
  }
  console.groupEnd();

  // 8. FORM MARKUP SOURCE (where the .dynamic-form HTML came from)
  console.group('8. .dynamic-form markup source');
  var dynForm = document.querySelector('.dynamic-form');
  console.log('.dynamic-form present:', !!dynForm);
  if (dynForm) {
    console.log('data-resource-type:', dynForm.getAttribute('data-resource-type'));
    console.log('inner form id:', dynForm.querySelector('form')?.id);
    console.log('inner form onsubmit attr:', dynForm.querySelector('form')?.getAttribute('onsubmit'));
  }
  console.groupEnd();

  // 9. PERFORMANCE ENTRIES — every resource load with type + duration (helps see load order)
  console.group('9. Resource load order (scripts/xhr only)');
  performance.getEntriesByType('resource')
    .filter(function (r) { return /\.js($|\?)|newformGet|verifyEmailData|newforms/.test(r.name); })
    .sort(function (a, b) { return a.startTime - b.startTime; })
    .forEach(function (r) { console.log(Math.round(r.startTime) + 'ms', r.initiatorType, r.name); });
  console.groupEnd();

  // 10. LIVE WATCHER — logs every future change to any error-msg-* element with a stack trace
  console.group('10. Live watcher armed');
  console.log('Any future text/display change to an error-msg-* element will be logged below with its call stack.');
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
  console.log('%cSnapshot complete. Watcher is live — trigger blur/submit now. Run __formDiagStop() to stop watching.', 'color:#2196F3');
})();
