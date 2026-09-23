This tag is gated behind OneTrust consent categories C0002/C0003/C0004 (Performance/Functional/Targeting). Before consent, only C0001 (Strictly Necessary) is active, so the tag never fires and Evergage never loads. Clicking "I Accept" grants all optional categories at once, the GTM trigger condition is satisfied, and Evergage loads and initializes on the page.
Category-level isolation confirmed: testing each optional category individually (fresh session, single category enabled at a time) shows the bug is gated specifically on Targeting Cookies (C0004):
Category enabled alone
Validation behavior
Functional Cookies (C0003) only
Works correctly
Performance Cookies (C0002) only
Works correctly
Targeting Cookies (C0004) only
Breaks
This narrows the cause from "consent in general" to Targeting consent specifically — the GTM trigger for the Evergage tag includes the Targeting category, and it is this category's grant that unlocks the tag and reproduces the bug.
Load confirmed: with only Targeting Cookies enabled, evergage.min.js was confirmed loading in the Network tab (filtered on evgnet). This closes the chain end-to-end: Targeting consent → Evergage tag fires → evergage.min.js loads → validation breaks. Each link is directly observed, not inferred.
Evergage is loaded from the Salesforce end (tenant-specific build path: .../caterpillar/global_impl/scripts/evergage.min.js), and once initialized it runs live personalization/targeting logic scoped by page URL — separate from and unrelated to the F2097-FV0001.js validation script itself.
