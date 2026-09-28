// HTML minification evaluation – proof script (ticket 2877209, Req 9)
// Run in DevTools Console on any www.cat.com page. Add more URLs to PAGES to cover other templates.
// For each page it measures:
//   rawKB            – HTML size as delivered by AEM (uncompressed)
//   realTransferKB   – bytes actually transferred by the server (real gzip/br, from Resource Timing)
//   contentEncoding  – server compression header
//   gzipKB           – raw HTML gzipped in the browser (should be close to realTransferKB)
//   aggressiveMin*   – upper bound: removes comments + collapses ALL whitespace
//   safeMin*         – realistic: same, but <pre>/<script>/<style>/<textarea> left untouched
(async () => {
  const PAGES = [
    location.href,
    // 'https://www.cat.com/en_US/products/new/equipment/excavators.html',
  ];

  try { performance.setResourceTimingBufferSize(10000); } catch {}
  const kb = n => +(n / 1024).toFixed(1);
  const bytes = s => new Blob([s]).size;
  const gz = async s => (await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()).byteLength;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const aggressive = h => h
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ');

  const PRESERVE = /<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--\[if[\s\S]*?<!\[endif\]-->|<!--#[\s\S]*?-->/gi;
  const safe = h => {
    let out = '', last = 0, m;
    const compact = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/[ \t\f\r]*\n\s*/g, '\n');
    PRESERVE.lastIndex = 0;
    while ((m = PRESERVE.exec(h))) { out += compact(h.slice(last, m.index)) + m[0]; last = m.index + m[0].length; }
    return out + compact(h.slice(last));
  };

  const rows = [];
  for (const url of PAGES) {
    const r = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
    const html = await r.text();
    let entry = null;
    for (let i = 0; i < 10 && !entry; i++) {
      entry = performance.getEntriesByName(url, 'resource').filter(e => e.initiatorType === 'fetch').pop() || null;
      if (!entry) await sleep(50);
    }
    const raw = bytes(html);
    const aggr = aggressive(html), sf = safe(html);
    const [gRaw, gAggr, gSafe] = [await gz(html), await gz(aggr), await gz(sf)];
    rows.push({
      url,
      status: r.status,
      contentEncoding: r.headers.get('content-encoding') || 'NONE',
      rawKB: kb(raw),
      realTransferKB: entry?.encodedBodySize ? kb(entry.encodedBodySize) : 'n/a',
      compressionSavingPct: entry?.encodedBodySize ? +((1 - entry.encodedBodySize / raw) * 100).toFixed(1) : '',
      gzipKB: kb(gRaw),
      aggressiveMinRawKB: kb(bytes(aggr)),
      aggressiveMinGzipKB: kb(gAggr),
      aggressiveSavingKB: kb(gRaw - gAggr),
      aggressiveSavingPct: +((1 - gAggr / gRaw) * 100).toFixed(1),
      safeMinRawKB: kb(bytes(sf)),
      safeMinGzipKB: kb(gSafe),
      safeSavingKB: kb(gRaw - gSafe),
      safeSavingPct: +((1 - gSafe / gRaw) * 100).toFixed(1)
    });
  }

  console.table(rows.map(({ url, ...r }) => ({ page: new URL(url).pathname, ...r })));
  rows.forEach(r => console.log(
    `%c${r.url}\n` +
    `Raw HTML: ${r.rawKB} KB | Served (${r.contentEncoding}): ${r.realTransferKB} KB → compression saves ${r.compressionSavingPct}%\n` +
    `Gzipped: ${r.gzipKB} KB → aggressive minify ${r.aggressiveMinGzipKB} KB (−${r.aggressiveSavingKB} KB, ${r.aggressiveSavingPct}%, upper bound)` +
    ` | safe minify ${r.safeMinGzipKB} KB (−${r.safeSavingKB} KB, ${r.safeSavingPct}%)`,
    'font-weight:bold'
  ));

  const cols = Object.keys(rows[0]);
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c]).replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'html-minification-evaluation.csv';
  document.body.appendChild(a); a.click(); a.remove();
})();
