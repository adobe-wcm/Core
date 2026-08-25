# Tabs v2 — Intermittent Blank Tab Panel

**Component:** `deg/components/content/container/tabs/v2/tabs`
**Environment observed:** `catdealer.com` (QA/staging author), AEM 6.5
**Status:** Root cause identified, fix scoped to component JS

---

## Symptom

On a page with a tabs v2 component, the active tab panel intermittently renders blank.
Same URL, same tab, no content change — sometimes the panel shows, sometimes it does not.

Workaround observed by users: click a different tab, then click back. Content then appears.

Most visible when deep-linking, e.g.
`.../cat-ai-assistant.html#tabs-100a56e058-item-f408fb6881-tab`

---

## Investigation

### Step 1 — Content is present in the DOM

DevTools showed identical markup in both broken and working states. The active slide
(`data-slick-index="3"`, `slick-current slick-active`) contained the expected panel and
heading in both cases. Nothing was missing or unrendered.

### Step 2 — Slide positioning is correct

Slide inline styles matched the container:

| Property | Value |
|---|---|
| `sliderW` | 1100 |
| `listW` | 1100 |
| slide inline `width` | `1100px` |
| `.slick-track` inline `left` | *(empty)* |

`.tabs__content` is initialized with `fade: true`. In fade mode slick positions each slide
individually via a negative `left` and toggles `opacity`/`z-index`; the track is not
translated. So `left: -3300px` on slide 3 is correct, not a broken offset.

### Step 3 — The wrapper is collapsed

Comparing the two states:

| State | `.slick-track` height | `.slick-list` height |
|---|---|---|
| Broken | 1052 | **0** |
| Working | 1052 | 1052 |

`.slick-list` has `overflow: hidden`. The content is fully rendered and correctly
positioned — it is being clipped to zero height by its wrapper.

### Step 4 — `setPosition` does not fix it

Calling `$('.tabs__content.slick-initialized').slick('setPosition')` had no effect.

Checked against slick 1.8.1 source:

```js
Slick.prototype.setHeight = function() {
    var _ = this;
    if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
        var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
        _.$list.css('height', targetHeight + 'px');
    }
};
```

`.tabs__content` is initialized **without** `adaptiveHeight`, which defaults to `false`.
`setHeight()` therefore never executes, and **slick never writes an inline height on
`.slick-list` for this slider at all.**

The `height: 0px` is written by our own component code, not by slick. `setPosition` could
never have corrected it.

### Step 5 — Root cause

In `tabs.js`, `adjustHeight()`:

```js
var $activePanel = $(container).find('.tabs__content .slick-active > div');
...
var height = $activePanel.outerHeight(true);
$(container).find('.tabs__content > .slick-list').css('height', height + 'px');
```

`.find('.slick-active')` is a **descendant** selector. It matches the active slide of the
tabs slider *and* the active slide of any nested slick slider inside any tab panel
(multimedia carousels, List components, etc.).

Console table of `.slick-slide` elements in the broken state:

| row | idx | active | opacity | left | height |
|---|---|---|---|---|---|
| 0 | 0 | false | 0 | `0px` | 1052 |
| 1 | 1 | false | 0 | `-1100px` | 1052 |
| 2 | 2 | false | 0 | `-2200px` | 1052 |
| **3** | **0** | **true** | 1 | **`auto`** | **0** |
| 4 | 1 | false | 1 | `auto` | 0 |
| **5** | **3** | **true** | 1 | **`-3300px`** | **1052** |
| 6 | 4 | false | 0 | `-4400px` | 1052 |

Rows 3 and 4 belong to a **nested, non-fade slider** — non-fade sliders translate the track,
so their slides carry no inline `left`. Being inside a hidden panel, they measure `0`.

`.outerHeight()` returns the height of the **first** matched element in DOM order. The
nested slider's slide precedes the real tab slide, so the measurement returns `0`, and
`0px` is written to `.slick-list`.

In the working state, row 3 was `active: false` — only the real tab slide matched, and
`1052` was written correctly.

**The race:** whether a nested slider has initialized and applied `.slick-active` to its
own slide before `adjustHeight()` runs. This is why the failure is intermittent and why
clicking away and back resolves it (the re-run measures after nested sliders have settled).

---

## Fix

Three edits in the tabs v2 component JS. No slick configuration changes.

### 1. `adjustHeight()` — scope measurement to tab-level slides

```js
// before
var $activePanel = $(container).find('.tabs__content .slick-active > div');

// after
var $activePanel = $(container).find('.tabs__content > .slick-list > .slick-track > .slick-slide.slick-active > div');
```

### 2. `adjustHeightWithImageCheck()` — same line, same change

```js
// before
var $activePanel = $(container).find('.tabs__content .slick-active > div');

// after
var $activePanel = $(container).find('.tabs__content > .slick-list > .slick-track > .slick-slide.slick-active > div');
```

### 3. `adjustHeight()` — guard against a zero measurement

```js
// before
var height = $activePanel.outerHeight(true);
$(container).find('.tabs__content > .slick-list').css('height', height + 'px');

// after
var height = $activePanel.outerHeight(true);
if (height > 0) {
    $(container).find('.tabs__content > .slick-list').css('height', height + 'px');
}
```

### Why this does not break existing behaviour

- Child combinators restrict matching to the tabs slider's own slides. Nested sliders in
  other panels can no longer contaminate the measurement.
- No reach is lost: the tab-level slide is an ancestor of everything in the active panel,
  so `$activePanel.find('.slick-initialized')` still finds every nested slider, and
  `waitForImages()` still finds every image.
- The `.multimedia` branch and `waitForImages()` become more correct for the same reason —
  they previously operated on the wrong element whenever the race lost.
- The `height > 0` guard is the safety net. The existing polling loop (10 × 500ms) re-runs
  `adjustHeight()` whenever heights diverge, so a skipped write self-corrects on the next
  poll. Previously a `0` was written and stuck.
- Selector verified in browser before implementation: returns exactly `1` match.

---

## Alternative considered and rejected

**CSS override:**

```css
.auth .tabs .tabs__content > .slick-list { height: auto !important; }
```

Verified working, and a smaller diff. Rejected because `height: auto` resolves to the
**tallest** panel (slides overlap via negative `left` offsets), effectively disabling
per-panel height. Shorter tabs gain dead whitespace on every tabs v2 instance site-wide.

Retained as a rollback option if the JS fix causes issues.

**`infinite: false` on `.tabs__content`:** the more complete change, but it alters slide
indices and slick's internal `currentSlide` bookkeeping, which `slickGoTo` and the
`beforeChange` handler both depend on. Out of scope for a bug fix; candidate for a
separate hardening ticket.

---

## Test plan

- [ ] Deep-link to a non-first tab via URL hash; hard-reload 5–10 times — content renders every time
- [ ] Click through all tabs; panel heights still differ per panel (adaptive height intact)
- [ ] Page with a nested carousel / List component inside a tab panel
- [ ] Page with images inside tab panels (exercises `waitForImages`)
- [ ] Accordion expand/collapse inside a tab (triggers `adjustHeight`)
- [ ] Window resize and orientation change
- [ ] Author mode (`wcmmode` cookie present) and published view
- [ ] Spot-check 2–3 other tabs v2 instances — shared clientlib

**Finding all instances** — QueryBuilder at `/libs/cq/search/content/querydebug.html`:

```
path=/content/catdotcom
type=nt:unstructured
property=sling:resourceType
property.value=deg/components/content/container/tabs/v2/tabs
p.limit=-1
```

Repeat against `/content/experience-fragments/deg`.

---

## Key learnings

1. **`.find()` is a descendant selector.** In nested-slider components, `.slick-active`,
   `.slick-slide`, and `.slick-initialized` match far more than intended. Use child
   combinators when targeting one slider's own structure.
2. **`.outerHeight()` returns the first match.** A multi-element set silently measures the
   wrong element rather than erroring.
3. **Verify library behaviour against source, not assumption.** `setPosition` was pursued
   as a fix for two rounds before checking that `setHeight()` is gated on
   `adaptiveHeight === true` — which is not set here. The inline `height: 0px` was our
   code all along.
4. **Guard computed writes.** Any measured value written to the DOM should be validated
   before it overwrites a working value.
