Root cause: not a code issue. Checked F2097-FV0001.js, the AEM form component, and Salesforce validation — all clean, no JS errors, no library conflicts, same behavior everywhere.
Steps:
Validation only breaks after clicking "I Accept" on cookies. Reject works fine.
Traced it to evergage.min.js (Salesforce Interaction Studio), loaded via a GTM tag that only fires post-consent.
Tested each cookie category separately — Functional: works, Performance: works, Targeting: breaks.
Checked the GTM tag source directly — it's gated on the functionality_storage consent signal, which normally maps to Functional, not Targeting.
Since it only fires when Targeting is accepted (not Functional), the category-to-consent-signal mapping in OneTrust is wrong on this site — Targeting is wired to grant functionality_storage instead of Functional.
Also, the same form works fine on other pages even with Evergage loaded and cookies accepted, so this might also be an Interaction Studio campaign scoped to just this page/URL rather than the script itself. Needs someone with dashboard access to confirm what's targeting this path.
No code changes needed from our side.
Assigning to Marketing Ops / OneTrust-GTM team for the consent mapping, and Interaction Studio team to check campaign targeting for this URL.
