/* Invalid input/textarea (v3 jQuery Validate + v4 inline toggle) */
.auth .auth-dynamic-forms .dynamic-form .col-xs-12:has(> label:is(.error, [id^="error-msg-"]):not([style*="none"])) :is(input:not([type="checkbox"], [type="radio"], [type="hidden"]), textarea),
.auth .auth-dynamic-forms .dynamic-form :is(input:not([type="checkbox"], [type="radio"], [type="hidden"]), textarea)[aria-invalid="true"] {
  /* existing declarations unchanged */
}

/* Invalid select */
.auth .auth-dynamic-forms .dynamic-form .col-xs-12:has(> label:is(.error, [id^="error-msg-"]):not([style*="none"])) select,
.auth .auth-dynamic-forms .dynamic-form select[aria-invalid="true"] {
  /* existing declarations unchanged */
}

/* Focus state when invalid */
.auth .auth-dynamic-forms .dynamic-form .col-xs-12:has(> label:is(.error, [id^="error-msg-"]):not([style*="none"])) :is(input, select, textarea):focus,
.auth .auth-dynamic-forms .dynamic-form :is(input, select, textarea)[aria-invalid="true"]:focus {
  /* existing declarations unchanged */
}
