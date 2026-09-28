// cat.com HTML compression check – Content-Encoding on every page (ticket 2877209, Req 4-6)
// Run in DevTools Console on https://www.cat.com/en_US.html (reload the page first)
// Stop anytime: window.__stopCrawl = true   (results so far are still exported)
//
// Note: the browser always sends "Accept-Encoding: gzip, deflate, br, zstd" (it cannot be changed from JS),
// so the server may answer with br (Brotli) instead of gzip. Brotli = compression working.
// To test gzip specifically for one URL:  curl -sI -H "Accept-Encoding: gzip" <url> | grep -i content-encoding
(async () => {
  const CFG = {
    PATH_PREFIX: '/en_US',   // '' = all locales
    MAX_PAGES: 1000,
    CONCURRENCY: 4,
    DELAY_MS: 200,
    MAX_SITEMAPS: 50
  };
  window.__stopCrawl = false;
  try { performance.setResourceTimingBufferSize(100000); } catch {}
  const origin = location.origin;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pageUrl = (href, base = origin) => {
    try { const u = new URL(href, base); u.hash = ''; u.search = ''; return u.href; } catch { return null; }
  };
  const isPage = u => !!u && u.startsWith(origin + CFG.PATH_PREFIX) && /\.html$/i.test(new URL(u).pathname);
  const kb = n => (typeof n === 'number' && n > 0) ? +(n / 1024).toFixed(1) : '';

  // ---------- 1. discover pages ----------
  const queue = [];
  const queued = new Set();
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

  // ---------- 2. check each page ----------
  const timingFor = async url => {
    for (let i = 0; i < 10; i++) {
      const e = performance.getEntriesByName(url, 'resource').filter(x => x.initiatorType === 'fetch').pop();
      if (e && e.responseEnd > 0) return e;
      await sleep(50);
    }
    return null;
  };

  async function check(url) {
    const row = {
      url,
      status: '',
      contentEncoding: '',
      gzipHeaderPresent: '',
      compressionWorking: '',
      encodedKB: '', decodedKB: '', savingPct: '',
      contentType: '', vary: '', server: '', cacheHeaders: ''
    };
    try {
      const r = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
      const h = r.headers;
      const html = await r.text();
      const enc = (h.get('content-encoding') || '').toLowerCase();
      row.status = r.status;
      row.contentEncoding = enc || 'NONE';
      row.gzipHeaderPresent = enc.includes('gzip') ? 'Y' : 'N';
      row.contentType = h.get('content-type') || '';
      row.vary = h.get('vary') || '';
      row.server = h.get('server') || '';
      row.cacheHeaders = ['x-cache', 'x-cache-status', 'cf-cache-status', 'x-dispatcher', 'age', 'akamai-cache-status']
        .filter(k => h.get(k)).map(k => `${k}: ${h.get(k)}`).join(' | ');

      // transfer vs decoded size proves compression even if the header were hidden
      const t = await timingFor(url);
      const encoded = t?.encodedBodySize || 0;
      const decoded = t?.decodedBodySize || new Blob([html]).size;
      row.encodedKB = kb(encoded);
      row.decodedKB = kb(decoded);
      if (encoded && decoded) row.savingPct = +((1 - encoded / decoded) * 100).toFixed(1);

      const sizeSaysCompressed = encoded > 0 && decoded > 0 && encoded < decoded * 0.9;
      row.compressionWorking = (enc && enc !== 'identity') || sizeSaysCompressed ? 'YES' : 'NO';

      // collect more pages
      if (queued.size < CFG.MAX_PAGES && row.contentType.includes('html')) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('a[href]').forEach(a => enqueue(pageUrl(a.getAttribute('href'), url)));
      }
    } catch (e) {
      row.status = 'ERR';
      row.compressionWorking = 'UNKNOWN';
    }
    return row;
  }

  const rows = [];
  let idx = 0, active = 0;
  async function worker() {
    while (!window.__stopCrawl && idx < CFG.MAX_PAGES) {
      if (idx >= queue.length) { if (active === 0) break; await sleep(100); continue; }
      const url = queue[idx++];
      active++;
      rows.push(await check(url));
      active--;
      if (rows.length % 50 === 0) console.log(`Checked ${rows.length} pages | queue ${queue.length}`);
      await sleep(CFG.DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CFG.CONCURRENCY }, worker));

  // ---------- 3. report ----------
  const order = { NO: 0, UNKNOWN: 1, YES: 2 };
  rows.sort((a, b) => (order[a.compressionWorking] ?? 9) - (order[b.compressionWorking] ?? 9));
  const count = f => rows.filter(f).length;
  const byEnc = {};
  rows.forEach(r => { byEnc[r.contentEncoding] = (byEnc[r.contentEncoding] || 0) + 1; });

  console.log(
    `%cPages: ${rows.length} | Compression working: ${count(r => r.compressionWorking === 'YES')} | NOT compressed: ${count(r => r.compressionWorking === 'NO')} | gzip header present: ${count(r => r.gzipHeaderPresent === 'Y')}\n` +
    `Content-Encoding breakdown: ${Object.entries(byEnc).map(([k, v]) => `${k}=${v}`).join(', ')}`,
    'font-weight:bold;font-size:13px'
  );
  console.table(rows);
  const bad = rows.filter(r => r.compressionWorking !== 'YES');
  if (bad.length) console.log('%cPages WITHOUT compression (full URLs):\n' + bad.map(r => r.url).join('\n'), 'font-weight:bold;color:#c00');

  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'cat-html-compression.csv';
  document.body.appendChild(a); a.click(); a.remove();
  console.log('Downloaded cat-html-compression.csv');
})();
