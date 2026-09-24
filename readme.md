No code changes needed from our side.
Not a code defect. F2097-FV0001.js, the AEM form component, and Salesforce validation logic are all confirmed clean — no JS errors, no library conflicts, identical behavior everywhere.
Steps:
Form validation breaks only after clicking "I Accept" on cookies. Reject = works fine.
Traced to evergage.min.js (Salesforce Interaction Studio), loaded via GTM tag, which only fires post-consent.
Tested each cookie category individually: Functional → works, Performance → works, Targeting → breaks.
Confirmed via GTM container source: the Evergage tag is gated on the functionality_storage consent signal — which by standard convention should map to the Functional category, not Targeting.
Since the tag only fires on Targeting (not Functional) despite requiring functionality_storage, this proves OneTrust's category-to-consent-signal mapping is misconfigured on this site — Targeting is incorrectly wired to grant functionality_storage.
Conclusion: This is a OneTrust/GTM consent-mapping misconfiguration, not an AEM or form-code issue. No code changes needed on our side.
