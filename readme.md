# Investigation: Salesforce Dynamic Form Error Styling vs Figma

**Ticket:** AB#3275237 — FS | Investigation + Fix on error message from Salesforce mismatch to Figma expectation
**Author:** Arkaprava Majumder
**PRs:** #35129 (→ `development`, merged) · #35133 (→ `release`)
**File changed:** `ui.apps/src/main/content/jcr_root/apps/deg/clientlibs/clientlib-site/css/auth-dynamic-forms.css`

---

## 1. Summary

The error state of the Salesforce dynamic forms (Request a Quote / Request a Price) did not match the Figma design. The required-field marker and the error message, icon and field border all differed.

The form **HTML markup and validation JS are owned and delivered by the Salesforce team**. The Cat team owns **only the CSS** (clientlib-site). So the fix was done **entirely in CSS on the Cat side**. No markup or JS changes were made or needed.

---

## 2. Ownership

| Layer | Owner | Can Cat team change it? |
|---|---|---|
| Form HTML (fields, labels, error label elements) | Salesforce team | ❌ No |
| Validation JS (`validateSubmit`, v3 jQuery Validate, v4 inline toggle) | Salesforce team | ❌ No |
| Error message text ("Field is required") | Salesforce team / authored content | ❌ No |
| Styling (`auth-dynamic-forms.css`, clientlib-site) | Cat team | ✅ Yes |

---

## 3. Current vs Expected (Figma)

| Element | Current (before fix) | Figma expectation |
|---|---|---|
| Required marker | Red `*` after label | Grey `(required)` text after label |
| Error message | ⚠ triangle icon + "Field is required" | Red text, no leading icon |
| Invalid field border | Default grey | 2px red border |
| Invalid field icon | None | Red diamond "!" icon inside field, right-aligned |
| Select (invalid) | Default | Red border + icon left of the chevron |
| Focus on invalid field | Browser/site focus glow | Red border, no glow |

---

## 4. Findings (from DevTools)

### 4.1 Markup (Salesforce-rendered)
```html
<div class="col-xs-12">
  <label for="lastName">Last Name <span class="red">*</span></label>
  <input type="text" id="lastName" class="required" onblur="validateSubmit(event)">
  <label id="error-msg-lastName-required" class="error" style="display: block;">Field is required</label>
  <label id="error-msg-lastName-invalidChar" style="display: none;">Enter a valid last name.</label>
</div>
```

- The required marker is a `<span class="red">*</span>` inside the label.
- Error labels are siblings of the input in the same `.col-xs-12`.
- No class or `aria-invalid` is added to the invalid **input** in the v4 validator. Only the error label's inline `display` changes.
- The invalid-character label has **no `.error` class**.

### 4.2 Two validator variants
- **v4:** toggles inline `style="display: block | none"` on pre-rendered `error-msg-*` labels.
- **v3 (`auth-dynamic-forms-v3.js`, jQuery Validate):** inserts `<label class="error">` dynamically (no inline style when visible, `display: none` when cleared) and sets `aria-invalid="true"` on the input.

The CSS has to work for **both** without relying on JS changes.

### 4.3 AEM clientlib minifier issue
An SVG icon embedded as a URL-encoded data URI broke after minification. The minifier **strips spaces inside the URL string** (`<svg xmlns=…` → `<svgxmlns=…`), which makes the SVG invalid. Fixed by switching to a **base64** data URI.

---

## 5. Solution (CSS only)

All rules are scoped to `.auth .auth-dynamic-forms` so they apply only to the Salesforce dynamic forms.

### 5.1 Detecting the error state without JS hooks
The error state is detected from the **visible error label** in the same field container, using `:has()`:

```css
.col-xs-12:has(> label:is(.error, [id^="error-msg-"]):not([style*="none"]))
```

- Covers v4 (inline toggle) and v3 (dynamically inserted `label.error`).
- Covers both `required` and `invalidChar` messages.
- Doesn't depend on the exact `display: block` value.

A fallback `[aria-invalid="true"]` selector covers v3 when the error label is placed outside the container.

### 5.2 What the CSS does
1. **Error text:** red (`#c52320`), legacy triangle icon hidden (`label.error::before`).
2. **Invalid input/textarea:** 2px red border (`#de2222`) and a red diamond icon (base64 SVG) on the right.
3. **Invalid select:** same border, with the icon placed left of the chevron.
4. **Focus when invalid:** red border kept; default glow removed.
5. **Required marker:** the `*` is visually hidden (`font-size: 0`) and replaced with grey `(required)` via `::after`, scoped to English pages with `:lang(en)`.
6. Checkbox, radio and hidden inputs are excluded from the error icon.

---

## 6. Limitations (because only CSS can be changed)

| Limitation | Impact | Needs |
|---|---|---|
| `(required)` text is in CSS | Can't be translated; scoped to `:lang(en)`, so other locales keep `*` | Salesforce markup change or i18n string in HTML |
| Error message copy ("Field is required" vs Figma "This field is required.") | Can't change text from CSS | Salesforce / content update |
| Error state detected via `:has()` and inline style | Depends on current markup structure; needs Chrome 105+, Safari 15.4+, Firefox 121+ | Salesforce JS adding `aria-invalid` / an error class on the field |
| v4 inputs have no `aria-invalid` / `aria-describedby` | Screen readers don't announce the error state | Salesforce JS / markup change |

---

## 7. Recommendations for the Salesforce team

To make this robust, accessible and localizable, the Salesforce team could:

1. Set `aria-invalid="true|false"` on the input when validation runs (v4).
2. Add `aria-describedby="error-msg-<field>-required"` on each input.
3. Render the required marker as translatable text (for example `<span class="required-text">(required)</span>`) instead of `*`.
4. Update error message copy to match Figma, if required.

Once 1 and 3 are done, the Cat CSS can be simplified to use `[aria-invalid="true"]` and drop the `:has()` and `::after` workarounds.

---

## 8. Testing checklist

- [ ] v4 form: submit empty → red border, icon and red error text on all required fields
- [ ] v4 form: invalid characters → same error styling
- [ ] v3 form (jQuery Validate): submit empty → error styling applies
- [ ] Fill the fields → error styling clears
- [ ] Select dropdown: icon and chevron both visible in error state
- [ ] Checkbox ("no business name"): no error icon
- [ ] Focus on invalid field: red border, no glow
- [ ] English page: `(required)` shown and baseline-aligned with label
- [ ] Non-English page: `*` still shown
- [ ] Author and publish (QA) both verified after clientlib minification
