# Investigation: Form Validation Failure After Cookie Consent — F-2097 (Dealer Contact, Mining)

**Page:** `wwwqa.aws.cat.com/en_US/by-industry/mining/dealer-contact.html`
**Form:** F-2097 (`F2097-FV0001.js`, Salesforce-hosted client-side validation)
**Status:** Root cause identified; scope confirmation pending

---

## Symptom

Form field validation (required-field and invalid-format error messages) behaves correctly under normal conditions, but breaks in a specific scenario:

| Scenario | Validation behavior |
|---|---|
| Cookie consent **not accepted** (no action, or Reject) | Works correctly — single clean error message per field, updates in real time |
| Cookie consent **accepted** ("I Accept") | Breaks — overlapping/duplicate error messages, stale text, layout shifts, inconsistent updates |

No JavaScript errors are thrown in either state. jQuery version is unchanged before/after consent. jQuery Validate is present on the page but never binds to this form in either state — ruling out a validation-library conflict as the cause.

---

## Root Cause

`evergage.min.js` — Salesforce Interaction Studio (Marketing Cloud Personalization) — is loaded via a GTM tag (`GTM-5JB4X4`) from:

```
https://cdn.evgnet.com/beacon/caterpillar/global_impl/scripts/evergage.min.js
```

This tag is gated behind OneTrust consent categories C0002/C0003/C0004 (Performance/Functional/Targeting). Before consent, only C0001 (Strictly Necessary) is active, so the tag never fires and Evergage never loads. Clicking "I Accept" grants all optional categories at once, the GTM trigger condition is satisfied, and Evergage loads and initializes on the page.

**Category-level isolation confirmed:** testing each optional category individually (fresh session, single category enabled at a time) shows the bug is gated specifically on **Targeting Cookies (C0004)**:

| Category enabled alone | Validation behavior |
|---|---|
| Functional Cookies (C0003) only | Works correctly |
| Performance Cookies (C0002) only | Works correctly |
| Targeting Cookies (C0004) only | **Breaks** |

This narrows the cause from "consent in general" to **Targeting consent specifically** — the GTM trigger for the Evergage tag includes the Targeting category, and it is this category's grant that unlocks the tag and reproduces the bug.

**Load confirmed:** with only Targeting Cookies enabled, `evergage.min.js` was confirmed loading in the Network tab (filtered on `evgnet`). This closes the chain end-to-end: Targeting consent → Evergage tag fires → `evergage.min.js` loads → validation breaks. Each link is directly observed, not inferred.

Evergage is loaded from the **Salesforce end** (tenant-specific build path: `.../caterpillar/global_impl/scripts/evergage.min.js`), and once initialized it runs live personalization/targeting logic scoped by page URL — separate from and unrelated to the `F2097-FV0001.js` validation script itself.

---

## Tests Performed

### Test 1 — Block Evergage directly
Using DevTools → Request Conditions, blocked all requests matching `https://cdn.evgnet.com/*`. With the block active, cookies were accepted and the form was retested.

**Result:** Validation worked correctly with Evergage blocked, even with cookies accepted. Removing the block reproduced the bug immediately. This isolates Evergage as the trigger.

### Test 2 — Cross-page comparison (same component, different path)
The same AEM authoring/component setup (same form, same clientlibs) was checked on a different page/URL where GTM and Evergage both load identically, cookies accepted.

**Result:** Validation works correctly on that page despite Evergage being loaded there too. No JS errors, no jQuery differences, same script inventory.

**Conclusion from Test 2:** Evergage's mere presence/load is not sufficient to cause the bug — its effect is path/URL-specific. This means a Salesforce Interaction Studio campaign or targeting rule scoped to `by-industry/mining/dealer-contact.html` (or this form specifically) is the actual trigger, not the SDK generally.

---

## Conclusion

The validation failure is caused by Salesforce Interaction Studio (Evergage), which loads on Accept via GTM and runs page-targeted personalization logic. The problem is **path/URL-specific**, not present on other pages using the identical form component and identical script stack. This points to an active Interaction Studio campaign or content-targeting rule scoped to this specific page or form container, which interferes with the form's DOM/validation state after it initializes — independent of and without modifying `F2097-FV0001.js` or throwing any script error.

This is not a defect in the AEM component, the form component clientlib, or the Salesforce validation script. No code fix is indicated on the AEM/form side pending confirmation of the targeting rule.

---

## Next Steps

1. **Escalate to the Interaction Studio / Marketing Cloud Personalization admin team** to review campaigns/experiences currently targeting `by-industry/mining/dealer-contact.html` (or the `.dynamic-form`/`#F-2097` container). The trigger is confirmed tied to Targeting-category (C0004) consent — evergage.min.js only loads and the bug only reproduces when this category is granted.
2. **Request exclusion or pause** of the identified campaign for this page, or re-scope its targeting away from the form container.
3. **Re-test** validation on this page post-exclusion, with Targeting cookies accepted, to confirm resolution.
4. No changes required to `F2097-FV0001.js`, `formsComponentV3.js`, or AEM component configuration unless the Interaction Studio investigation reveals otherwise.
