# XSS Remediation Note — li_aemuinfo First/Last Name

**Ticket:** AB#2917338  **PR:** #34145
**File:** `ui.apps/src/main/content/jcr_root/apps/deg/clientlibs/clientlib-site/js/v5/myAccount.js`

## Method

The user's first/last name comes from the `li_aemuinfo` cookie, which is
editable in the browser and therefore untrusted. Two controls are applied:

1. **Output encoding (primary control).** The name is written to the DOM with
   jQuery `.text()` (sets `textContent`), so any markup renders as literal text
   and is never parsed as HTML. This is the actual XSS defense.
2. **Input cleaning (secondary, cosmetic).** `toSafeName()` runs the value
   through `stripMarkup()` to remove HTML/JS fragments, strips invisible
   formatting characters, normalizes whitespace, and caps length. This stops a
   tampered value from displaying as raw markup. It is defense-in-depth, not the
   security boundary.

The cookie JSON is parsed inside a `try/catch`; a missing or malformed cookie
returns null and the welcome UI is skipped, so a bad cookie cannot break the page.

## Regular expressions

Applied inside `stripMarkup()` in a loop that repeats until the string stops
changing (so split tags cannot reassemble):

```
/&#0*60;?|&#x0*3c;?|&lt;?/gi   -> "<"   decode angle-bracket entities
/&#0*62;?|&#x0*3e;?|&gt;?/gi   -> ">"   so encoded tags are caught
/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi   remove script/style
                                       blocks INCLUDING their content
/<[^>]*>/g                            remove any remaining complete tag
/&#x?[0-9a-f]+;?/gi , /&[a-z]+;/gi    remove leftover HTML entities
/[a-z_$][\w$]*\s*\([^()]*\)/gi        remove function calls e.g. alert(1)
/[\w-]+\s*=("[^"]*"|'[^']*'|\S*)/g    remove attribute fragments e.g. src=x
/javascript\s*:/gi , /data\s*:/gi     remove dangerous protocols
/[<>=(){}[\];:\\\/|@#$%^&*_+`"~!?]/g  -> " "  leftover code punctuation
```

Invisible-character strip in `toSafeName()`:

```
/[\u200B\u200E\u200F\u202A-\u202E\u2060\uFEFF]/g   remove zero-width space,
   LTR/RTL marks, bidi overrides, word joiner, BOM
```

ZWNJ (U+200C) and ZWJ (U+200D) are intentionally NOT removed — they are
meaningful in Bengali, Hindi, Persian and Urdu names. All visible characters in
every script (Latin with apostrophe/hyphen/accents, Chinese, Japanese, Korean,
Arabic, Indic, African) pass through unchanged.

## Character limit

The display value is capped at **64 characters** (`.substring(0, 64)`), matching
Microsoft Entra ID's maximum length for the Given Name / Surname attributes.
Because Entra enforces the same limit upstream, a legitimate name is never
truncated; the cap only bounds a tampered value.

## CodeQL finding on the script / style regex

GitHub Advanced Security (CodeQL rule **`js/incomplete-multi-character-sanitization`**)
flagged the tag-removal regexes — the `script|style` block strip and the
`/<[^>]*>/g` tag strip — as **High**, with the message
*"This string may still contain `<script`."*

**What it means.** CodeQL flags any attempt to sanitize HTML by removing
substrings with a regex, because such stripping is incomplete by nature: crafted
input (for example nested `<scr<script>ipt>`) can defeat a single pass. As a
general principle the rule is correct — regex is not a reliable HTML sanitizer.

**Why it is not an actual XSS hole here.** The security control is `.text()`
(output encoding), not the regex. The regex output only ever flows into
`.text()`, which encodes completely, so no markup can execute regardless of what
the regex leaves behind. The finding sits on the cosmetic cleaning step, not the
security boundary.

**Resolution.** To clear the finding, the regex-based stripping is replaced with
detect-and-reject validation (a `.test()` check that returns an empty string when
markup is present), so no `String.replace` is used as an HTML sanitizer. `.text()`
remains the enforcement layer. Note: the currently committed build still contains
the flagged `stripMarkup` regexes, so the CodeQL alert will persist until that
change is applied.
