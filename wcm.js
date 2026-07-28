var NAME_MAX_LENGTH = 120;

/**
 * Returns a display-safe name string.
 * Strips invisible/formatting characters only. All visible characters in
 * every script (Latin, CJK, Arabic, Indic, African) pass through intact.
 * ZWNJ (200C) and ZWJ (200D) are kept because they are meaningful in
 * Bengali, Hindi, Persian and Urdu names.
 * @param {*} value Raw value read from the cookie.
 * @returns {string} Cleaned name. Always a string.
 */
function toSafeName(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value
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
 * Writes the given name into the element as plain text and toggles the
 * logged-in navigation state.
 * @param {Object} $element jQuery element(s) to update.
 * @param {string} fullName Display name. Markup is never parsed.
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
  $element.text(fullName);
}

/**
 * Reads the user name from the cookie and populates all welcome elements.
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

  if (!fullName) {
    return;
  }

  setFirstName($('.mega--nav .mega-mobile a[data-mega-drawer=mega-accountlinks].myaccount-welcome .login-msg'), fullName);
  setFirstName($('.mega--nav .utility--links__account span.myaccount-welcome'), fullName);
  setFirstName($('.mega--nav .my-account__modal .my-account__content .modal-content .my-account__header .modal-title'), fullName);
  setFirstName($('.mega--nav .utility--links a[data-mega-drawer=mega-accountlinks].myaccount-welcome .login-msg'), fullName);

  setFirstName($('.mega--nav .mega-mobile #mega-accountlinks .myaccount-welcome'), fullName);
  setFirstName($('.mega--nav .mega-mobile #mega-accountlinks .welcome-header .my-account-header'), fullName);
  setFirstName($('.mega--nav .utility--links #mega-accountlinks .myaccount-welcome'), fullName);
  setFirstName($('.mega--nav .utility--links__account .new-account .welcome-back-desktop'), fullName);
  setFirstName($('.mega--nav .my-account-loggedin-mobile #mega-accountlinks .welcome-header .myaccount-username'), fullName);
}
