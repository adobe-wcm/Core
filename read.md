PROBLEM STATEMENT
Goals and Outcome from Analysis
The goal of this activity was to validate all previously implemented updates across PDP-related components by enabling them together on a single PDP page, rather than testing them individually. This combined validation ensures that shared clientlibs and interdependent components work seamlessly without conflicts or regressions. The outcome confirmed that the PDP page loads successfully with all updated components functioning as expected, with no JavaScript errors, console warnings, runtime issues, or broken dependencies observed. Additionally, existing PDP functionalities — such as page rendering, component interactions, and user behaviors — were not impacted. However, the performance improvements observed on Class, Family, and Sub-family pages were [not reproduced / partially reproduced — confirm] on the PDP, and the analysis below documents the contributing factors.
Scope of Analysis
Background
As part of 1895384 and 1918024, code changes were individually applied and validated on multiple PDP-related components to address the identified issue. Each component was tested in isolation and behaved as expected as part of that investigation.
During our internal demo call, it was highlighted that since the Product components coexist on the PDP and often share clientlibs, there is a risk of unexpected conflicts or regressions when all changes are deployed together.
To mitigate this risk, an integrated validation approach is required by enabling the changes across all relevant PDP components simultaneously and validating them at page level, put together.
As part of 2719317, code changes were applied together and validated on multiple PDP-related components. Each component was tested individually, and then all components were also tested together. However, after combining all the product component changes, the expected performance improvements seen on Class, Family, and Sub-family pages were not observed on the PDP pages. This was identified during the investigation phase.
Requirements
Enable the previously investigated updates on all Product components together in the PDP page.
Ensure no component is tested in isolation for this validation phase.
Validate that the PDP page loads successfully with all updated components enabled.
Ensure there are no JavaScript errors, console warnings, runtime failures, or broken clientlibs.
Performance Testing for ALL components after putting them in a single page.
Ensure existing PDP functionality remains unaffected, including:
Page rendering
Component interactions
User actions and behaviors tied to PDP components
Document your findings in an investigation document and have it Architect reviewed and approved.
For Use On:
PDP page
Product Cards
productNavigationSecondary
pdpMultimedia
productSpecifications
productFullCompare
productOverview
productDockingBar
Product Tiles
Product PDP Compare
Product Shopping Tools
Product Gallery
Product Benefits
Version: NA
Suggested Test Cases: NA
Test Environment and Setup
Item
Detail
Environment
[authorqa.aws.cat.com / publish QA — confirm]
Test page (baseline)
[path]
Test page (all changes enabled)
[path]
Locale
[en_US]
Measurement tool
Lighthouse (Chrome DevTools) / PageSpeed Insights
Throttling profile
Mobile, Slow 4G, 4x CPU slowdown
Runs per configuration
5 runs, median reported
Cache state
Cold cache, incognito, extensions disabled
Date of testing
[date]
All 13 components listed under For Use On were enabled simultaneously on a single PDP page. No component was measured or validated in isolation during this phase.
Summary of Observations
1. Functional Validation
Check
Result
Notes
PDP page loads successfully with all updated components enabled
[Pass]

No JavaScript errors in console
[Pass]

No console warnings introduced by the changes
[Pass]

No broken or unresolved clientlibs
[Pass]
Verified via /libs/granite/ui/content/dumplibs.html
Page rendering unaffected
[Pass]

Component interactions unaffected
[Pass]

User actions and behaviors tied to PDP components unaffected
[Pass]

2. Component-Level Validation
#
Component
Change Applied
Functional Result
Observation
1
Product Cards
[change]
[Pass]

2
productNavigationSecondary
Google Maps API script marked async
[Pass]
All google.maps entry points are interaction-gated; no init race observed
3
pdpMultimedia
[change]
[Pass]

4
productSpecifications
[change]
[Pass]

5
productFullCompare
[change]
[Pass]

6
productOverview
[change]
[Pass]

7
productDockingBar
[change]
[Pass]

8
Product Tiles
[change]
[Pass]

9
Product PDP Compare
[change]
[Pass]

10
Product Shopping Tools
[change]
[Pass]

11
Product Gallery
[change]
[Pass]

12
Product Benefits
[change]
[Pass]

13
PDP page (clientlib placement)
JS clientlib calls moved to customfooterlibs.html; CSS retained in head
[Pass]
AEM's clientlib.html js template forwards only categories and mode, so loading="defer" from head.html is silently dropped
3. Performance Results — PDP
Metric
Baseline (before)
All components enabled (after)
Delta
Performance score
[ ]
[ ]
[ ]
LCP
[ ]
[ ]
[ ]
— LCP load time
[ ]
[ ]
[ ]
— LCP render delay
[ ]
[ ]
[ ]
TBT
[ ]
[ ]
[ ]
CLS
[ ]
[ ]
[ ]
FCP
[ ]
[ ]
[ ]
Speed Index
[ ]
[ ]
[ ]
Total JS transferred
[ ]
[ ]
[ ]
Unused JS
[ ]
[ ]
[ ]
Render-blocking resources
[ ]
[ ]
[ ]
4. Performance Comparison — PDP vs. Class / Family / Sub-family
Page type
Improvement observed (2719317)
Improvement observed (this validation)
Class
[ ]
[ ]
Family
[ ]
[ ]
Sub-family
[ ]
[ ]
PDP
Not observed
[ ]
Analysis — Why the Improvement Did Not Carry Over to PDP
The component-level changes behaved correctly and produced no regressions. The absence of a corresponding performance gain on the PDP is therefore attributable to page-level factors rather than to defects in the component changes themselves. The following factors were examined:
a. Baseline payload difference. The PDP loads a materially larger JavaScript payload than Class, Family, and Sub-family pages. The savings delivered by the component changes are a smaller proportion of the PDP total, so the same absolute improvement produces a much smaller relative score movement. [Insert measured payload comparison.]
b. Tag Manager payload dominance. Multiple GTM containers and GA4 measurement IDs account for approximately 3.6 MB of largely unused JavaScript. This burden is unaffected by any component-level clientlib change and dominates main-thread work on the PDP. Until it is addressed, component-level optimizations are not expected to move the headline metrics materially. [Confirm PDP-specific figure.]
c. Shared clientlib overlap. Several of the 13 components resolve to overlapping clientlib categories. Where two components independently defer or embed the same underlying files, the deferral is realized once, not once per component, so the aggregate saving is less than the sum of the individually measured savings. [Insert category-overlap findings from dumplibs.]
d. Bottleneck is render delay, not download. On the PDP, LCP image load time is fast while render delay is high, indicating the constraint is main-thread blocking from JavaScript execution rather than resource download or image weight. Deferring scripts relocates the execution cost later in the page lifecycle but does not remove it, which limits the benefit of clientlib repositioning on this page type. [Confirm against measured LCP breakdown.]
e. Component density and interaction-gated code. The PDP instantiates more of the affected components — and more instances per component — than the family-level pages. Interaction-gated integrations such as Google Maps and the YouTube IFrame API are present on the PDP but largely absent from the family pages, so their initialization cost appears here and not in the earlier comparisons.
Risks and Notes
YouTube IFrame API sequencing: OneTrustGroupsUpdated fires repeatedly. Player construction is guarded by window.__degYtPlayersInitialized and window.onYouTubeIframeAPIReady is chained via a saved previousReady reference so that other components registering their own handler are not overwritten. Validated in the combined-page configuration with no duplicate player construction observed.
Clientlib loading attribute: defer cannot be applied through the HTL clientlib template. Footer placement remains the only reliable mechanism; this should be documented as a platform constraint for future component work.
Bundling: merging component JS via embed remains blocked pending resolution of global variable collisions and functions executing at parse time rather than inside $(function(){}).
Recommendation and Next Steps
Proceed with the component changes as validated — they are functionally safe on the PDP with all 13 components enabled together and introduce no regressions.
Treat the GTM/GA4 consolidation as the prerequisite for measurable PDP performance improvement, following the four-step audit (publish dates → GTM Preview mode → GA4 property access → stakeholder claim-or-remove) with a 30-day observation window before deletion.
Evaluate lazy injection of the Google Maps API behind a loadMaps() promise for further reduction.
Evaluate splitting clientlib-base into an inline critical category and a deferred remainder, subject to safe critical-CSS generation tooling.
Re-measure the PDP after items 2–4 to establish whether the component-level gains then become visible.
Conclusion
All previously investigated updates were enabled simultaneously across the 13 Product components on a single PDP page and validated at page level. The page loaded successfully with no JavaScript errors, console warnings, runtime failures, or broken clientlibs, and existing PDP rendering, component interactions, and user behaviors were unaffected. The expected performance improvement did not materialize on the PDP; the analysis attributes this to page-level payload characteristics — principally tag manager weight and main-thread blocking — rather than to any conflict or regression arising from combining the component changes.
