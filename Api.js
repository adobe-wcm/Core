
Hi @Md Sarfraz Nawaz, quick update on your question:
For F-2097 (non-legacy), no override - it's sequential. SF's script runs validateSubmit() and sets its own error labels on submit. Our side skips jQuery Validate entirely for this form and just checks if any SF error label is still visible before allowing the AJAX submit. So SF validates first, we read the result.
We do have two extra CAT-only checks on top: bot honeypot, and mailing address autosuggest (for non-RAQ forms).
For legacy forms, jQuery Validate does run on our side - so if their legacy script also has its own validation, both could run in parallel. Would need SF to confirm what's in their legacy script to be sure.
