rom combining the component changes.
# 2881905 — FS | Investigation and POC | SEO | Re-evaluate Component-level JavaScript Review for Product Components Together

# PROBLEM STATEMENT

## Goals and Outcome from Analysis

The goal of this activity was to validate all previously implemented updates across PDP-related components by enabling them together on a single PDP page, rather than testing them individually. This combined validation ensures that shared clientlibs and interdependent components work seamlessly without conflicts or regressions.

During the investigation it was identified that 4 of the 13 in-scope components are not authored on the standard PDP page. To validate them under the same page-level conditions as the remaining components, the PDP template was temporarily updated to include these components, allowing console output and performance to be observed with the complete component set present.

As part of the POC, unused libraries were removed and performance-related fixes were applied across several Product components. The outcome confirmed that the PDP page loads successfully with all updated components functioning as expected, with no JavaScript errors, console warnings, runtime issues, or broken dependencies observed, and existing PDP functionality — page rendering, component interactions, and user behaviors — was not impacted. However, these component-level changes did not produce a significant improvement in overall page performance. The analysis indicates that meaningful gains on the PDP require site-level changes, which are proposed in the *Recommendation and Next Steps* section below.

## Scope of Analysis

### Background

As part of 1895384 and 1918024, code changes were individually applied and validated on multiple PDP-related components to address the identified issue. Each component was tested in isolation and behaved as expected as part of that investigation.

During our internal demo call, it was highlighted that since the Product components coexist on the PDP and often share clientlibs, there is a risk of unexpected conflicts or regressions when all changes are deployed together.

To mitigate this risk, an integrated validation approach is required by enabling the changes across all relevant PDP components simultaneously and validating them at page level, put together.

As part of 2719317, code changes were applied together and validated on multiple PDP-related components. Each component was tested individually, and then all components were also tested together. However, after combining all the product component changes, the expected performance improvements seen on Class, Family, and Sub-family pages were not observed on the PDP pages. This was identified during the investigation phase.

### Requirements

- Enable the previously investigated updates on all Product components together in the PDP page.
- Ensure no component is tested in isolation for this validation phase.
- Validate that the PDP page loads successfully with all updated components enabled.
- Ensure there are no JavaScript errors, console warnings, runtime failures, or broken clientlibs.
- Performance Testing for ALL components after putting them in a single page.
- Ensure existing PDP functionality remains unaffected, including:
  - Page rendering
  - Component interactions
  - User actions and behaviors tied to PDP components
- Document your findings in an investigation document and have it Architect reviewed and approved.

### For Use On:

- PDP page
- Product Cards
- productNavigationSecondary
- pdpMultimedia
- productSpecifications
- productFullCompare
- productOverview
- productDockingBar
- Product Tiles
- Product PDP Compare
- Product Shopping Tools
- Product Gallery
- Product Benefits

**Version:** NA

**Suggested Test Cases:** NA

---

## Test Approach

### Component Availability on the PDP

Of the 13 components listed under *For Use On*, 9 are authored on the standard PDP page. The remaining 4 are not part of the default PDP authoring model:

| # | Component | Present on standard PDP | Action taken |
|---|---|---|---|
| 1 | [component name] | No | Added to PDP template for validation |
| 2 | [component name] | No | Added to PDP template for validation |
| 3 | [component name] | No | Added to PDP template for validation |
| 4 | [component name] | No | Added to PDP template for validation |

To ensure no component was validated in isolation — as required by the story — the PDP template was temporarily updated to include these 4 components so that the complete set could be loaded on a single page and assessed together for console output, runtime behavior, and performance impact.

**Note:** This template change was made solely to enable integrated validation and is not intended for release. It should be reverted before any production deployment.

### Environment and Setup

| Item | Detail |
|---|---|
| Environment | [authorqa.aws.cat.com / publish QA — confirm] |
| Test page (baseline) | [path] |
| Test page (all components enabled) | [path] |
| Template modified | [/conf/deg/settings/wcm/templates/...] |
| Locale | [en_US] |
| Measurement tool | Lighthouse (Chrome DevTools) / PageSpeed Insights |
| Throttling profile | Mobile, Slow 4G, 4x CPU slowdown |
| Runs per configuration | 5 runs, median reported |
| Cache state | Cold cache, incognito, extensions disabled |
| Date of testing | [date] |

---

## Changes Applied as Part of the POC

### 1. Unused Library Removal

| # | Library / clientlib removed | Component / category | Size reclaimed | Justification |
|---|---|---|---|---|
| 1 | [name] | [category] | [KB] | Not referenced by any active component |
| 2 | [name] | [category] | [KB] | |
| 3 | [name] | [category] | [KB] | |

### 2. Component-Level Performance Fixes

| # | Component | Change applied | Purpose |
|---|---|---|---|
| 1 | productNavigationSecondary | `async` attribute added to Google Maps API script tag | Remove render-blocking third-party request; all `google.maps` entry points are interaction-gated |
| 2 | PDP page (clientlib placement) | JS clientlib calls moved to `customfooterlibs.html`; CSS retained in head | AEM's `clientlib.html` `js` template forwards only `categories` and `mode`, so `loading="defer"` from `head.html` is silently dropped |
| 3 | [component] | [change] | [purpose] |
| 4 | [component] | [change] | [purpose] |
| 5 | [component] | [change] | [purpose] |

---

## Summary of Observations

### 1. Functional Validation

| Check | Result | Notes |
|---|---|---|
| PDP page loads successfully with all updated components enabled | Pass | Including the 4 components added via template |
| No JavaScript errors in console | Pass | |
| No console warnings introduced by the changes | Pass | |
| No broken or unresolved clientlibs | Pass | Verified via `/libs/granite/ui/content/dumplibs.html` |
| Page rendering unaffected | Pass | |
| Component interactions unaffected | Pass | |
| User actions and behaviors tied to PDP components unaffected | Pass | |

No conflicts, regressions, or shared-clientlib collisions were observed when all component changes were enabled simultaneously. The primary risk raised during the internal demo call — that combining the changes would surface unexpected interactions — was not borne out.

### 2. Performance Results — PDP

| Metric | Baseline (before) | After POC changes | Delta |
|---|---|---|---|
| Performance score | [ ] | [ ] | [ ] |
| LCP | [ ] | [ ] | [ ] |
| — LCP load time | [ ] | [ ] | [ ] |
| — LCP render delay | [ ] | [ ] | [ ] |
| TBT | [ ] | [ ] | [ ] |
| CLS | [ ] | [ ] | [ ] |
| FCP | [ ] | [ ] | [ ] |
| Total JS transferred | [ ] | [ ] | [ ] |
| Unused JS | [ ] | [ ] | [ ] |
| Render-blocking resources | [ ] | [ ] | [ ] |

The measured improvement was marginal and within the range where run-to-run variance makes it difficult to attribute confidently to the changes.

---

## Analysis — Why Component-Level Changes Did Not Deliver Significant Improvement

The component changes were correctly applied and functionally validated, but the resulting performance gain on the PDP was minimal. The analysis attributes this to page-level and site-level factors that dominate the PDP's performance profile and are unaffected by component-scoped optimization:

**a. Site-level payload dominates the component-level saving.** The JavaScript removed or deferred at component level represents a small fraction of the PDP's total payload. Even where a component change is individually effective, its contribution is absorbed by the much larger site-level baseline. *[Insert measured comparison: component saving vs. total page JS.]*

**b. Tag Manager payload is the dominant burden.** Multiple GTM containers and GA4 measurement IDs account for a large volume of largely unused JavaScript loaded on every page. This is loaded at site level and is entirely outside the scope of component-level clientlib changes. Until it is consolidated, component optimizations cannot move the headline metrics materially. *[Insert PDP-specific figure.]*

**c. The bottleneck is main-thread blocking, not download.** On the PDP, LCP image load time is fast while render delay is high, indicating the constraint is JavaScript execution on the main thread rather than resource weight or image optimization. Deferring scripts relocates execution later in the page lifecycle but does not remove the work, which caps the benefit achievable through clientlib repositioning alone.

**d. Shared clientlib overlap reduces the aggregate saving.** Several of the in-scope components resolve to overlapping clientlib categories. Where multiple components independently defer or remove the same underlying files, the saving is realized once rather than once per component, so the combined result is less than the sum of the individually measured savings. *[Insert category-overlap findings from dumplibs.]*

**e. Baseline difference versus Class / Family / Sub-family pages.** Those page types carry a lighter component set and a smaller baseline payload, so the same absolute saving produced a visible score movement there. The PDP's heavier baseline suppresses the same change into the noise floor.

---

## Risks and Notes

- **Template modification is not for release.** The addition of the 4 non-PDP components to the template was for validation purposes only and must be reverted prior to deployment.
- **YouTube IFrame API sequencing:** `OneTrustGroupsUpdated` fires repeatedly. Player construction is guarded by `window.__degYtPlayersInitialized`, and `window.onYouTubeIframeAPIReady` is chained via a saved `previousReady` reference so that other components registering their own handler are not overwritten. Validated on the combined page with no duplicate player construction observed.
- **Clientlib `loading` attribute constraint:** `defer` cannot be applied through the HTL clientlib template. Footer placement is the only reliable mechanism and should be documented as a platform-level constraint for future component work.
- **Bundling:** merging component JS via `embed` remains blocked pending resolution of global variable collisions and functions executing at parse time rather than inside `$(function(){})`.

---

## Recommendation and Next Steps

The component-level work is complete and safe to release, but the PDP's performance profile is governed by site-level concerns. The following site-level changes are proposed:

1. **GTM / GA4 consolidation.** Audit all active containers and measurement IDs and remove those that are unclaimed or obsolete. Recommended process: review publish dates → validate in GTM Preview mode → confirm GA4 property access → circulate a stakeholder claim-or-remove list → observe for 30 days before deletion. This is expected to be the single largest available improvement.

2. **Critical CSS split.** Split `clientlib-base` into an inlined critical category and a deferred remainder, using appropriate critical-CSS generation tooling to avoid above-the-fold regressions.

3. **Inline the dynamically generated whitelabel CSS** via `<cq:include>` to eliminate its external request, with a fix for the duplicate `@import` font block emission.

4. **Lazy-load the Google Maps API** behind a `loadMaps()` promise so the library is fetched only on interaction rather than on page load.

5. **Third-party script audit** across AppDynamics RUM, OneTrust, and remaining vendor tags to establish which are required at page load versus deferrable.

6. **Re-measure the PDP after items 1–5** to establish whether the component-level gains become visible once the site-level burden is reduced.

*[Add any further site-level recommendations you want to put forward.]*

## Conclusion

All previously investigated updates were enabled simultaneously across the in-scope Product components on a single PDP page and validated at page level. Four components not present on the standard PDP were added via a temporary template change so that the complete set could be assessed together. Unused libraries were removed and performance-related fixes applied across several Product components.

The PDP loaded successfully with no JavaScript errors, console warnings, runtime failures, or broken clientlibs, and existing rendering, component interactions, and user behaviors were unaffected — confirming that the combined changes carry no regression risk. However, the performance improvement was not significant. The investigation concludes that the PDP's performance is constrained by site-level factors, principally tag manager payload and main-thread blocking, and that the site-level changes recommended above are required before further component-level optimization will yield measurable benefit.

---

*Caterpillar: Confidential Green*
