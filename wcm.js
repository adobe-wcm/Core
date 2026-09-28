// Site-wide HTML minification evaluation (ticket 2877209, Req 9)
// Run in DevTools Console (or Sources > Snippets) on https://www.cat.com/en_US.html – reload the page first.
// Stop anytime: window.__stopCrawl = true   (results so far are still exported)
//
// Per page:  raw HTML size, real transferred size (server gzip/br), gzip of current HTML,
//            minified+gzip (aggressive = upper bound, safe = realistic), saving after gzip.
// Output:    cat-html-minify-pages.csv (one row per page, full URL)
//            cat-html-minify-templates.csv (averages per template)
(async () => {
  const CFG = {
    PATH_PREFIX: '/en_US',
    MAX_PAGES: 1000,
    CONCURRENCY: 3,
    DELAY_MS: 200,
    MAX_SITEMAPS: 50
  };
  window.__stopCrawl = false;
  try { performance.setResourceTimingBufferSize(100000); } catch {}
  const origin = location.origin;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const kb = n => +(n / 1024).toFixed(1);
  const bytes = s => new Blob([s]).size;
  const gz = async s => (await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()).byteLength;
  const pageUrl = (href, base = origin) => {
    try { const u = new URL(href, base); u.hash = ''; u.search = ''; return u.href; } catch { return null; }
  };
  const isPage = u => !!u && u.startsWith(origin + CFG.PATH_PREFIX) && /\.html$/i.test(new URL(u).pathname);

  // ---------- minifiers ----------
  const aggressive = h => h
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ');
  const PRESERVE = /<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--\[if[\s\S]*?<!\[endif\]-->|<!--#[\s\S]*?-->/gi;
  const safe = h => {
    const re = new RegExp(PRESERVE.source, 'gi');
    const compact = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/[ \t\f\r]*\n\s*/g, '\n');
    let out = '', last = 0, m;
    while ((m = re.exec(h))) { out += compact(h.slice(last, m.index)) + m[0]; last = m.index + m[0].length; }
    return out + compact(h.slice(last));
  };

  // ---------- 1. discover pages (sitemap + links) ----------
  const queue = [], queued = new Set();
  const enqueue = u => { if (isPage(u) && !queued.has(u) && queued.size < CFG.MAX_PAGES) { queued.add(u); queue.push(u); } };
  enqueue(pageUrl(location.href));
  try {
    const t = await (await fetch('/robots.txt')).text();
    let maps = [...t.matchAll(/^sitemap:\s*(\S+)/gim)].map(m => m[1]);
    if (!maps.length) maps = [origin + '/sitemap.xml'];
    const seen = new Set();
    while (maps.length && queued.size < CFG.MAX_PAGES && seen.size < CFG.MAX_SITEMAPS) {
      const sm = maps.shift();
      if (seen.has(sm)) continue;
      seen.add(sm);
      try {
        const r = await fetch(sm);
        if (!r.ok) continue;
        const xml = new DOMParser().parseFromString(await r.text(), 'application/xml');
        for (const loc of xml.getElementsByTagName('loc')) {
          const v = loc.textContent.trim();
          if (loc.parentNode?.localName === 'sitemap') maps.push(v); else enqueue(pageUrl(v));
        }
      } catch {}
    }
    console.log(`Sitemaps read: ${seen.size}, pages queued: ${queued.size}`);
  } catch {}

  // ---------- 2. measure each page ----------
  const timingFor = async url => {
    for (let i = 0; i < 10; i++) {
      const e = performance.getEntriesByName(url, 'resource').filter(x => x.initiatorType === 'fetch').pop();
      if (e && e.responseEnd > 0) return e;
      await sleep(50);
    }
    return null;
  };

  async function measure(url) {
    const row = {
      url, status: '', template: '', contentEncoding: '',
      rawKB: '', transferredKB: '', gzipKB: '',
      minRawKB: '', minGzipKB: '', savingKB: '', savingPct: '',
      safeMinGzipKB: '', safeSavingKB: '', safeSavingPct: ''
    };
    try {
      const r = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
      const html = await r.text();
      row.status = r.status;
      row.contentEncoding = r.headers.get('content-encoding') || 'NONE';
      if (!(r.headers.get('content-type') || '').includes('html')) return row;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      row.template = doc.querySelector('meta[name="template"]')?.content || '(unknown)';
      if (queued.size < CFG.MAX_PAGES) doc.querySelectorAll('a[href]').forEach(a => enqueue(pageUrl(a.getAttribute('href'), url)));
      if (r.status !== 200) return row;

      const t = await timingFor(url);
      const aggr = aggressive(html), sf = safe(html);
      const [gRaw, gAggr, gSafe] = [await gz(html), await gz(aggr), await gz(sf)];
      row.rawKB = kb(bytes(html));
      row.transferredKB = t?.encodedBodySize ? kb(t.encodedBodySize) : '';
      row.gzipKB = kb(gRaw);
      row.minRawKB = kb(bytes(aggr));
      row.minGzipKB = kb(gAggr);
      row.savingKB = kb(gRaw - gAggr);
      row.savingPct = +((1 - gAggr / gRaw) * 100).toFixed(1);
      row.safeMinGzipKB = kb(gSafe);
      row.safeSavingKB = kb(gRaw - gSafe);
      row.safeSavingPct = +((1 - gSafe / gRaw) * 100).toFixed(1);
    } catch { row.status = 'ERR'; }
    return row;
  }

  const rows = [];
  let idx = 0, active = 0;
  async function worker() {
    while (!window.__stopCrawl && idx < CFG.MAX_PAGES) {
      if (idx >= queue.length) { if (active === 0) break; await sleep(100); continue; }
      const url = queue[idx++];
      active++;
      rows.push(await measure(url));
      active--;
      if (rows.length % 50 === 0) console.log(`Measured ${rows.length} pages | queue ${queue.length}`);
      await sleep(CFG.DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CFG.CONCURRENCY }, worker));

  // ---------- 3. aggregate ----------
  const ok = rows.filter(r => r.status === 200 && typeof r.savingPct === 'number');
  const avg = (list, k) => list.length ? +(list.reduce((s, r) => s + (+r[k] || 0), 0) / list.length).toFixed(1) : 0;
  const median = (list, k) => {
    const v = list.map(r => +r[k]).filter(n => !isNaN(n)).sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] : 0;
  };

  const summary = {
    pagesMeasured: ok.length,
    pagesSkipped: rows.length - ok.length,
    avgRawKB: avg(ok, 'rawKB'),
    avgTransferredKB: avg(ok, 'transferredKB'),
    avgGzipKB: avg(ok, 'gzipKB'),
    avgMinGzipKB: avg(ok, 'minGzipKB'),
    avgSavingKB_upperBound: avg(ok, 'savingKB'),
    avgSavingPct_upperBound: avg(ok, 'savingPct'),
    medianSavingPct_upperBound: median(ok, 'savingPct'),
    avgSafeSavingKB: avg(ok, 'safeSavingKB'),
    avgSafeSavingPct: avg(ok, 'safeSavingPct'),
    maxSavingKB: ok.length ? Math.max(...ok.map(r => r.savingKB)) : 0
  };

  const byTpl = {};
  ok.forEach(r => (byTpl[r.template] ||= []).push(r));
  const templates = Object.entries(byTpl).map(([template, list]) => ({
    template,
    pages: list.length,
    avgRawKB: avg(list, 'rawKB'),
    avgTransferredKB: avg(list, 'transferredKB'),
    avgMinGzipKB: avg(list, 'minGzipKB'),
    avgSavingKB: avg(list, 'savingKB'),
    avgSavingPct: avg(list, 'savingPct'),
    avgSafeSavingKB: avg(list, 'safeSavingKB'),
    avgSafeSavingPct: avg(list, 'safeSavingPct'),
    sampleUrl: list[0].url
  })).sort((a, b) => b.avgSavingKB - a.avgSavingKB);

  // ---------- 4. report ----------
  console.log(
    `%cPages measured: ${summary.pagesMeasured} (skipped non-200: ${summary.pagesSkipped})\n` +
    `Average raw HTML: ${summary.avgRawKB} KB | transferred today (gzip): ${summary.avgTransferredKB} KB\n` +
    `Minification saving after gzip – upper bound: ${summary.avgSavingKB_upperBound} KB (${summary.avgSavingPct_upperBound}%), median ${summary.medianSavingPct_upperBound}%\n` +
    `Minification saving after gzip – realistic (safe): ${summary.avgSafeSavingKB} KB (${summary.avgSafeSavingPct}%)`,
    'font-weight:bold;font-size:13px'
  );
  console.table(summary);
  console.table(templates);

  const download = (name, data) => {
    if (!data.length) return;
    const cols = Object.keys(data[0]);
    const csv = [cols.join(','), ...data.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  };
  download('cat-html-minify-pages.csv', rows);
  download('cat-html-minify-templates.csv', templates);
  download('cat-html-minify-summary.csv', [summary]);
  console.log('Downloaded: cat-html-minify-pages.csv, cat-html-minify-templates.csv, cat-html-minify-summary.csv');
})();
