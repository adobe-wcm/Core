# Investigation: Core Web Vitals – Minification (JavaScript, CSS, HTML) & Compression

| | |
|---|---|
| **Ticket** | 2877209 – FS \| Investigation \| Core Web Vitals (JavaScript optimization) \| Minification (JavaScript, CSS and Text/Html file) |
| **Owner** | Arkaprava Majumder |
| **Date** | 28 Sep 2026 |
| **Environments** | Production publish (www.cat.com), QA author (authorqa.aws.cat.com) |
| **Status** | Investigation complete – JS fix identified and validated on QA author |

---

## 1. Summary

| Area | Result |
|---|---|
| **JavaScript** | 81 unique clientlib files are served across the site. **79 are minified correctly. 2 are served as `.min` but are not minified.** A fix was validated on QA. |
| **CSS** | All clientlib CSS is minified correctly (YUI). One dynamic, non-clientlib CSS file (`whitelabel-v2`, ~824 KB) is not minified. |
| **HTML minification** | Not minified today. The estimated saving is up to ~18% after gzip. A Sling filter POC is ready. |
| **HTML compression** | **Working.** All crawled pages return `Content-Encoding: gzip`, except 8 pages that return **404**. |

---

## 2. Requirements Status

| # | Requirement | Status |
|---|---|---|
| 1 | Identify which files are minified and which still need optimization | ✅ Done |
| 2 | Review remaining JS and CSS files that are not minified | ✅ Done – 2 JS clientlibs, 1 dynamic CSS |
| 3 | Minify the identified JS and CSS files | ✅ JS fix validated on QA. CSS through filter POC |
| 4 | Verify HTML compression works as expected | ✅ Verified |
| 5 | Confirm compressed HTML returns `Content-Encoding: gzip` | ✅ Confirmed on all valid pages |
| 6 | Investigate missing `Content-Encoding` header | ✅ Missing only on 8 pages that return 404 |
| 7 | Functionality unaffected after optimization | ⏳ QA regression pending |
| 8 | Focus on JS/CSS delivered to the browser | ✅ Analysis based on served files |
| 9 | Evaluate HTML minification | ✅ Evaluated, POC ready |

---

## 3. Approach

### 3.1 How the file lists were produced

The initial repo scan (1,164 JS / 814 CSS files without `.min` in the name) was not used as-is. Clientlib source files are expected to be unminified in the repo, because AEM concatenates and minifies them at serve time. The investigation measured **what the browser actually receives** instead.

Custom browser-console scripts were run on production (www.cat.com):

1. **Page discovery:** the scripts read the sitemap XML files listed in `robots.txt` (including sitemap indexes), then followed internal links. **1,000 pages** under `/en_US` were crawled. Other locales use the same clientlibs, so these pages cover all templates and clientlibs.
2. **HTML:** each page was fetched to record `Content-Encoding`, the compressed and uncompressed size, and a minification estimate.
3. **JS and CSS:** every `<script>` and `<link rel="stylesheet">` in each page's HTML was collected and de-duplicated into the list of unique clientlib files (`/etc.clientlibs/...min.<hash>.js|css`).
4. **Minification check:** each served `.min` file was compared with its non-minified twin. A file was flagged when the `.min` output was about the same size as the raw source and still indented.

### 3.2 Server-side confirmation (QA author)

- HTML Library Manager configuration reviewed in `/system/console/configMgr`.
- GCC compile errors read from `error.log` through the Sling log tailer.
- Fixes tested in CRXDE, followed by `dumplibs.rebuild.html` → Invalidate caches.

---

## 4. AEM Configuration (Adobe Granite HTML Library Manager)

| Setting | Value |
|---|---|
| Minify | ✅ Enabled |
| Gzip (js/css) | ✅ Enabled |
| JS Processor Default Configs | `min:gcc;obfuscate=true;languageIn=ECMASCRIPT_2020;languageOut=ECMASCRIPT5` |
| CSS Processor Default Configs | `min:yui` |

Minification is enabled globally. A clientlib's own `jsProcessor`/`cssProcessor` property overrides these defaults for that clientlib only.

---

## 5. JavaScript

### 5.1 Result

| Metric | Value |
|---|---|
| Pages crawled | 1,000 |
| Unique `.min` clientlib files | 81 |
| Minified correctly | 66 |
| Tiny / already minified | 13 |
| **Served as `.min` but NOT minified** | **2** |

| Clientlib | Size | Loaded on |
|---|---|---|
| `/apps/deg/components/content/product/editable/detail/pim/productSpecifications/v3/productSpecifications/clientlibs/site` | 1,820 KB (identical to raw source) | 854 / 1,000 pages |
| `/apps/catDotCom/clientlibs/clientlib-catai` | 43 KB (identical to raw source) | 991 / 1,000 pages |

### 5.2 Root cause

Google Closure Compiler (GCC) processes each source file separately. When a file fails to compile under the global config (`obfuscate=true`, ES5 output), **AEM silently serves that file unminified** inside the `.min` bundle, with no visible error. The `error.log` shows these failures as `GCCScriptProcessor Processed <file>.js. N error(s)`.

### 5.3 Fix (validated on QA author)

Add this attribute to the `.content.xml` of both clientlib folders, keeping all existing properties:

```xml
jsProcessor="[default:none,min:gcc;compilationLevel=whitespace;languageIn=ECMASCRIPT_2020;languageOut=ECMASCRIPT_2020]"
```

- `.../productSpecifications/v3/productSpecifications/clientlibs/site/.content.xml`
- `.../apps/catDotCom/clientlibs/clientlib-catai/.content.xml`

Whitespace compilation removes comments and whitespace without rewriting code. It minified productSpecifications successfully on QA.

A global change to the same setting was evaluated and **not recommended**. It would make the 66 working clientlibs slightly larger (no variable renaming) and drop ES5 output site-wide, to fix only 2 files.

---

## 6. CSS

- **Clientlib CSS:** all files are minified by YUI, with 0 failures. YUI keeps one line break per rule, unlike Bootstrap's single-line output. The difference after gzip is ~0%, and matching Bootstrap would need a build pipeline the project does not have (no `ui.frontend`, CSS is component-scoped in `ui.apps`). **No change needed.**
- **Dynamic CSS:** `whitelabel-v2.css` (~824 KB) is generated by a Sling Model through HTL. It is not a clientlib, so it is never minified. It is covered by the filter POC (Section 7).
- **Oversized CSS:** `clientlib-base.min.css` (~743 KB) is minified but large, which points to unused CSS. Follow-up recommended.

---

## 7. HTML Minification

| Sample page | Before | After (estimated) |
|---|---|---|
| Raw HTML | 453.6 KB | 325.8 KB |
| Gzipped | 62.1 KB | 50.9 KB |
| **Saving after gzip** | | **~18% (upper bound)** |

**Proposed solution:** a Sling filter on publish (POC ready). It:
- Removes HTML comments and collapses indentation.
- Skips `<pre>`, `<script>`, `<style>` and `<textarea>` content, and never runs in author edit mode.
- Also minifies the dynamic whitelabel CSS.
- Is toggled through OSGi config, with a `?nominify=true` bypass for comparison.

Dispatcher caches the output, so the CPU cost is paid once per cache fill. Needs backend and architect review.

---

## 8. HTML Compression

| Result | Pages |
|---|---|
| `Content-Encoding: gzip` present | All valid pages |
| No `Content-Encoding` | **8 – all return HTTP 404** |

- Compression works correctly at the dispatcher/CDN level. The earlier observation that the header was missing was most likely made on a request sent without `Accept-Encoding`, or on a cached or intermediate response.
- The 8 URLs without compression are error pages (404). They are small and have negligible performance impact. They are, however, **broken links discovered through the sitemap or internal navigation**, and should be reviewed separately.
- Compression reduces the sample page from 453.6 KB to 62.1 KB (~86%).

---

## 9. Conclusion

- Site-wide minification is largely in place. **Only 2 JS clientlibs are unminified**, caused by silent GCC compile failures. A targeted, low-risk fix was identified and validated on QA author.
- Clientlib CSS minification works correctly. The only unminified CSS is dynamic (whitelabel).
- **HTML compression (gzip) works on all valid pages.** Missing headers were found only on 404 responses.
- HTML minification offers a moderate additional gain (~18% after gzip) and needs a backend filter. A POC is ready.
- The largest remaining performance opportunity is outside minification: productSpecifications ships **~1.8 MB of JS on ~85% of pages**, mostly html2pdf/jsPDF code that is only needed for PDF download.

---

## 10. Next Steps

| # | Action | Owner / Type |
|---|---|---|
| 1 | **Push the JS change:** add `jsProcessor` to productSpecifications v3 and clientlib-catai `.content.xml`, then raise a PR | Dev – this story |
| 2 | Revert any manual QA changes (global JS processor value, CRXDE `jsProcessor`) before deployment | Dev |
| 3 | Deploy to QA, invalidate clientlib cache (`dumplibs.rebuild.html`) | Dev / DevOps |
| 4 | **QA regression** (checklist below) | QA |
| 5 | Rerun the site-wide console script on QA/prod publish → expect **0 unminified files** | Dev |
| 6 | Review the 8 URLs returning 404 (sitemap / broken links) | Content / Dev |
| 7 | New story: lazy-load html2pdf/jsPDF in productSpecifications | Dev |
| 8 | New story: HTML + dynamic CSS minification Sling filter (POC ready) | Backend / Architect |
| 9 | New story: reduce whitelabel CSS size and audit unused CSS in `clientlib-base` | Dev |

### QA Regression Checklist

- [ ] PDP: specification tabs, anchor links, tab keyboard navigation
- [ ] PDP: PDF download (html2pdf)
- [ ] Cat AI features (clientlib-catai) on all templates
- [ ] Home, listing, article pages: no new console errors
- [ ] Both `.min.<hash>.js` files are minified (no indentation or comments)
- [ ] Cross-browser check (Chrome, Edge, Safari, Firefox; mobile)

---

## Appendix – Scripts & Useful URLs

| Script | Purpose |
|---|---|
| `cat-sitewide-unminified.js` | Crawls the sitemap and lists served `.min` JS/CSS that are not minified |
| `cat-html-compression-check.js` | Crawls the sitemap and records `Content-Encoding` per page (full URL, sizes) |
| `cat-html-minify-audit.js` | HTML minification saving per page and template |
| `html-minify-filter/` | Sling filter POC (HTML + dynamic CSS) |

| Purpose | URL (author) |
|---|---|
| HTML Library Manager | `/system/console/configMgr` → Adobe Granite HTML Library Manager |
| Rebuild clientlibs | `/libs/granite/ui/content/dumplibs.rebuild.html` |
| GCC errors | `/system/console/slinglog/tailer.txt?tail=20000&grep=GCCScriptProcessor&name=%2Flogs%2Ferror.log` |
