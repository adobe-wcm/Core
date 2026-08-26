Hero Carousel — Mobile Layout Defect
Component: deg/components/content/container/carousel/v3 (hero display)
Environment: authorqa · Chrome DevTools @ 440px
Symptom: Hero teasers render blank/offset on mobile; slide 5 shows overlapping headings from two slides.
Root cause
The hero teaser uses a full-bleed hack in the teaser clientlib:
Css
The existing mobile override (@media max-width: 991px) resets right, left and width — but not margin-left. At 440px the surviving margin-left: -50vw = −220px, pulling every hero teaser half a viewport left inside its slide. Content lands outside the visible box, and each teaser bleeds into the adjacent slide, producing the doubled headings.
Slides 2–4 appeared fine only because their shorter content still fell within the visible area.
Fix
Teaser clientlib, existing @media screen and (max-width: 991px) block:
Css
Verification
Js
All five slides render correctly at 440px; no overlap at the infinite-loop boundary.
Secondary findings (separate tickets)
height: auto overridden by inline style — .auth .carousel--hero .carousel__wrapper .teaser { height: auto } loses to the server-rendered style="height: 535px". Fixed here with !important; better fix is to stop emitting the desktop height at mobile.
Clone/offscreen slides not lazy-loaded — slick moves slides via transform, which fires no scroll event, so lazysizes never unveils them. Addressed by calling lazySizes.loader.unveil() on init/setPosition/beforeChange.
