(function () {
  console.clear();
  console.log('%cCOOKIE CONSENT / VALIDATION DIAGNOSTIC', 'font-size:14px;font-weight:bold;color:#4CAF50');
  console.log('Run this BEFORE clicking Accept/Reject, then click one, then run __cookieDiagCompare() after.');

  function snapshotState(label) {
    var jqVer = (typeof jQuery !== 'undefined') ? jQuery.fn.jquery : null;
    var hasValidatePlugin = (typeof jQuery !== 'undefined' && typeof jQuery.fn.valid === 'function');
    var hasValidatorOnForm = null;
    try {
      var $f = jQuery('.dynamic-form form, #F-2097');
      hasValidatorOnForm = $f.length ? !!$f.data('validator') : 'form not found';
    } catch (e) { hasValidatorOnForm = 'error: ' + e.message; }

    var scripts = Array.from(document.scripts).map(function (s) { return s.src; }).filter(Boolean);

    var globals = {};
    ['validateSubmit', 'consentLogic', 'checkSearchBeforeAsk', 'displayState',
     'handleMailingCountryChange', 'onloadValidation', 'isLegacySFForm',
     'esriInteraction', 'DealerLocatorNew', 'Granite', 'dataLayer'].forEach(function (fn) {
      globals[fn] = typeof window[fn];
    });

    var otCookie = document.cookie.split(';').find(function (c) { return c.trim().indexOf('OptanonConsent') === 0; });
    var otAlertBox = document.cookie.split(';').find(function (c) { return c.trim().indexOf('OptanonAlertBoxClosed') === 0; });
    var activeGroups = (typeof OnetrustActiveGroups !== 'undefined') ? OnetrustActiveGroups : null;

    var state = {
      label: label,
      timestamp: new Date().toISOString(),
      jQueryVersion: jqVer,
      jQueryValidatePluginPresent: hasValidatePlugin,
      validatorBoundToForm: hasValidatorOnForm,
      scriptCount: scripts.length,
      scripts: scripts,
      globals: globals,
      OptanonConsent: otCookie || null,
      OptanonAlertBoxClosed: otAlertBox || null,
      OnetrustActiveGroups: activeGroups,
      allCookies: document.cookie
    };

    console.group('%cSnapshot: ' + label, 'color:#2196F3;font-weight:bold');
    console.log(state);
    console.groupEnd();

    return state;
  }

  window.__cookieDiagBefore = snapshotState('BEFORE consent action');

  console.group('Live watchers armed');
  console.log('Watching for: new <script> tags added, jQuery being reassigned, and any uncaught errors.');
  console.groupEnd();

  var scriptObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.tagName === 'SCRIPT') {
          console.log('%cNEW SCRIPT INJECTED: ' + (n.src || '(inline)'), 'color:#FF9800;font-weight:bold');
          if (n.textContent && n.textContent.length < 500) console.log(n.textContent);
        }
      });
    });
  });
  scriptObserver.observe(document.documentElement, { childList: true, subtree: true });

  var currentJQ = window.jQuery;
  var jqWatcher = setInterval(function () {
    if (window.jQuery !== currentJQ) {
      console.log('%cjQuery REFERENCE CHANGED! Old version: ' + (currentJQ ? currentJQ.fn.jquery : 'none') +
        ' -> New version: ' + (window.jQuery ? window.jQuery.fn.jquery : 'none'), 'color:red;font-weight:bold;font-size:13px');
      console.trace('stack at detection time');
      currentJQ = window.jQuery;
    }
  }, 200);

  window.addEventListener('error', function (e) {
    console.log('%cUNCAUGHT ERROR: ' + e.message, 'color:red;font-weight:bold');
    console.log('at ' + e.filename + ':' + e.lineno + ':' + e.colno);
    console.log(e.error && e.error.stack);
  });

  window.__cookieDiagStop = function () {
    scriptObserver.disconnect();
    clearInterval(jqWatcher);
    console.log('Watchers stopped.');
  };

  window.__cookieDiagCompare = function () {
    var after = snapshotState('AFTER consent action');
    var before = window.__cookieDiagBefore;

    console.group('%cDIFF: before vs after', 'color:#4CAF50;font-weight:bold;font-size:13px');

    if (before.jQueryVersion !== after.jQueryVersion) {
      console.log('%cjQuery version changed: ' + before.jQueryVersion + ' -> ' + after.jQueryVersion, 'color:red');
    } else {
      console.log('jQuery version unchanged:', after.jQueryVersion);
    }

    if (before.jQueryValidatePluginPresent !== after.jQueryValidatePluginPresent) {
      console.log('%c$.fn.valid presence changed: ' + before.jQueryValidatePluginPresent + ' -> ' + after.jQueryValidatePluginPresent, 'color:red');
    }

    if (JSON.stringify(before.validatorBoundToForm) !== JSON.stringify(after.validatorBoundToForm)) {
      console.log('%cvalidator binding changed:', 'color:red', before.validatorBoundToForm, '->', after.validatorBoundToForm);
    }

    var newScripts = after.scripts.filter(function (s) { return before.scripts.indexOf(s) === -1; });
    console.log('New scripts loaded after consent action (' + newScripts.length + '):');
    newScripts.forEach(function (s) { console.log('  ' + s); });

    Object.keys(after.globals).forEach(function (fn) {
      if (before.globals[fn] !== after.globals[fn]) {
        console.log('%cGlobal "' + fn + '" changed: ' + before.globals[fn] + ' -> ' + after.globals[fn], 'color:red');
      }
    });

    console.log('OptanonConsent before:', before.OptanonConsent);
    console.log('OptanonConsent after: ', after.OptanonConsent);
    console.log('ActiveGroups before:', before.OnetrustActiveGroups);
    console.log('ActiveGroups after: ', after.OnetrustActiveGroups);

    console.groupEnd();

    window.__cookieDiagAfter = after;
    console.log('%cDone. Copy this whole console output.', 'color:#2196F3');
  };
})();
