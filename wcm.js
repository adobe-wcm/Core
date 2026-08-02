$(document).ready(function () {

  var NAME_MAX_LENGTH = 64;

  /** Tokens that are markup/code vocabulary, never names. */
  var NOISE_TOKENS = /^(img|script|style|iframe|svg|div|span|input|body|html|head|link|meta|form|button|video|audio|embed|object|src|href|alert|onerror|onload|onclick|onmouseover|javascript|eval|expression|prompt|confirm|document|window|cookie)$/i;

  /**
   * Removes HTML/JS markup and code fragments from a value, keeping the
   * name-like words. Runs until stable so split or entity-encoded tags
   * can not reassemble into markup.
   * @param {string} value Input possibly containing markup.
   * @returns {string} Value with markup and code fragments removed.
   */
  function stripMarkup(value) {
    var previous;
    var result = value;
    var guard = 0;
    var tokens;
    var kept = [];
    var i;
    do {
      previous = result;
      result = result
        .replace(/&#0*60;?|&#x0*3c;?|&lt;?/gi, '<')
        .replace(/&#0*62;?|&#x0*3e;?|&gt;?/gi, '>')
        .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&#x?[0-9a-f]+;?/gi, '')
        .replace(/&[a-z]+;/gi, '')
        .replace(/[a-z_$][\w$]*\s*\([^()]*\)/gi, '')
        .replace(/[\w-]+\s*=("[^"]*"|'[^']*'|\S*)/g, '')
        .replace(/javascript\s*:/gi, '')
        .replace(/data\s*:/gi, '')
        .replace(/[<>=(){}[\];:\\/|@#$%^&*_+`"~!?]/g, ' ');
      guard += 1;
    } while (result !== previous && guard < 10);

    tokens = result.split(/\s+/);
    for (i = 0; i < tokens.length; i += 1) {
      if (tokens[i] && !NOISE_TOKENS.test(tokens[i])) {
        kept.push(tokens[i]);
      }
    }
    return kept.join(' ');
  }

  /**
   * Returns a display-safe name with markup/code removed and invisible
   * formatting characters stripped. Always returns a string.
   * @param {*} value Raw value read from the cookie.
   * @returns {string} Cleaned name.
   */
  function toSafeName(value) {
    if (typeof value !== 'string') {
      return '';
    }
    return stripMarkup(value)
      .replace(/[\u200B\u200E\u200F\u202A-\u202E\u2060\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .substring(0, NAME_MAX_LENGTH);
  }

  /**
   * Reads and validates the li_aemuinfo cookie.
   * @returns {Object|null} The detail object, or null when missing/invalid.
   */
  function readUserFromCookie() {
    var raw = getCookie('li_aemuinfo');
    var parsed;
    if (!raw) {
      return null;
    }
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return null;
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.detail &&
      typeof parsed.detail === 'object'
    ) {
      return parsed.detail;
    }
    return null;
  }

  /**
   * Writes the given name into the element as plain text, or hides the
   * element when there is no valid name. Markup is never parsed as HTML.
   * @param {Object} $element jQuery element(s) to update.
   * @param {string} fullName Display name.
   * @returns {undefined}
   */
  function setFirstName($element, fullName) {
    if (!$element || $element.length === 0) {
      return;
    }
    $('.my-account-default').hide();
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) &&
      screen.width < 1024
    ) {
      $('.my-account-loggedin').hide();
      $('.my-account-loggedin-mobile').show();
    } else {
      $('.my-account-loggedin-mobile').hide();
      $('.my-account-loggedin').show();
    }
    if (fullName) {
      $element.text(fullName).show();
    } else {
      $element.text('').hide();
    }
  }

  /**
   * Reads the user name from the cookie and populates all welcome
   * elements with a sanitized, display-safe value.
   * @returns {undefined}
   */
  function setUserName() {
    var detail = readUserFromCookie();
    var firstName;
    var lastName;
    var fullName;

    if (!detail) {
      return;
    }

    firstName = toSafeName(detail.firstName);
    lastName = toSafeName(detail.lastName);
    fullName = (firstName + ' ' + lastName).replace(/^\s+|\s+$/g, '');

    setFirstName($('.mega--nav .mega-mobile a[data-mega-drawer=mega-accountlinks].myaccount-welcome .login-msg'), fullName);
    setFirstName($('.mega--nav .utility--links__account span.myaccount-welcome'), fullName);
    setFirstName($('.mega--nav .my-account__modal .my-account__content .modal-content .my-account__header .modal-title'), fullName);
    setFirstName($('.mega--nav .utility--links a[data-mega-drawer=mega-accountlinks].myaccount-welcome .login-msg'), fullName);

    if (firstName || lastName) {
      setFirstName($('.mega--nav .mega-mobile #mega-accountlinks .myaccount-welcome'), fullName);
      setFirstName($('.mega--nav .mega-mobile #mega-accountlinks .welcome-header .my-account-header'), fullName);
      setFirstName($('.mega--nav .utility--links #mega-accountlinks .myaccount-welcome'), fullName);
      setFirstName($('.mega--nav .utility--links__account .new-account .welcome-back-desktop'), fullName);
      setFirstName($('.mega--nav .my-account-loggedin-mobile #mega-accountlinks .welcome-header .myaccount-username'), fullName);
    }
  }

  setUserName();

});
