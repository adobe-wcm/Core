// Site-wide: every clientlib served as .min but NOT actually minified (publish/prod, no login)
// Run in DevTools Console on https://www.cat.com/en_US.html (reload the page first)
// Stop anytime: window.__stopCrawl = true   (results so far are still exported)
(async () => {
  const CFG = {
    PATH_PREFIX: '/en_US',  // '' = all locales (much bigger); clientlibs are the same across locales
    MAX_PAGES: 1000,
    CONCURRENCY: 4,
    DELAY_MS: 200,
    MAX_SITEMAPS: 50
  };
  window.__stopCrawl = false;
  const origin = location.origin;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pageUrl = (href, base = origin) => {
    try { const u = new URL(href, base); u.hash = ''; u.search = ''; return u.href; } catch { return null; }
  };
  const isPage = u => !!u && u.startsWith(origin + CFG.PATH_PREFIX) && /\.html$/i.test(new URL(u).pathname);
  const MIN_RE = /\.min(\.[0-9a-f]{8,})?\.(js|css)$/i;

  // ---------- 1. discover pages ----------
  const queue = [];
  const queued = new Set();
  const enqueue = u => { if (isPage(u) && !queued.has(u) && queued.size < CFG.MAX_PAGES) { queued.add(u); queue.push(u); } };
  enqueue(pageUrl(location.href));
  try {
    let maps = [];
    const t = await (await fetch('/robots.txt')).text();
    maps = [...t.matchAll(/^sitemap:\s*(\S+)/gim)].map(m => m[1]);
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

  // ---------- 2. crawl pages, collect every served .min clientlib ----------
  const assets = new Map(); // minUrl -> { pageCount, samplePage }
  let crawled = 0;
  async function crawl(url) {
    try {
      const r = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
      if (!r.ok || !(r.headers.get('content-type') || '').includes('html')) return;
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      doc.querySelectorAll('script[src], link[rel~="stylesheet"][href]').forEach(el => {
        try {
          const u = new URL(el.getAttribute('src') || el.getAttribute('href'), url);
          u.hash = ''; u.search = '';
          if (u.origin !== origin || !u.pathname.startsWith('/etc.clientlibs/') || !MIN_RE.test(u.pathname)) return;
          const a = assets.get(u.href) || { pageCount: 0, samplePage: url };
          a.pageCount++;
          assets.set(u.href, a);
        } catch {}
      });
      doc.querySelectorAll('a[href]').forEach(a => enqueue(pageUrl(a.getAttribute('href'), url)));
    } catch {}
  }
  let idx = 0, active = 0;
  async function worker() {
    while (!window.__stopCrawl && idx < CFG.MAX_PAGES) {
      if (idx >= queue.length) { if (active === 0) break; await sleep(100); continue; }
      const url = queue[idx++];
      active++;
      await crawl(url);
      active--;
      crawled++;
      if (crawled % 50 === 0) console.log(`Pages ${crawled} | queue ${queue.length} | unique .min clientlibs ${assets.size}`);
      await sleep(CFG.DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CFG.CONCURRENCY }, worker));
  console.log(`Crawl done: ${crawled} pages, ${assets.size} unique .min clientlib files. Checking...`);

  // ---------- 3. compare each .min file with its raw twin ----------
  const get = async u => {
    try { const r = await fetch(u, { cache: 'force-cache' }); return r.ok ? await r.text() : null; } catch { return null; }
  };
  const indentPct = t => {
    const lines = t.split('\n').filter(l => l.trim());
    const n = Math.max(lines.length, 1);
    return Math.round(lines.filter(l => /^[ \t]{2,}/.test(l)).length / n * 100);
  };
  async function check(minUrl, info) {
    const p = new URL(minUrl);
    const rawPath = p.pathname.replace(MIN_RE, '.$2');
    const row = {
      url: minUrl,
      type: /\.css$/i.test(p.pathname) ? 'CSS' : 'JS',
      verdict: '', minKB: '', rawKB: '', ratio: '', minIndentedPct: '',
      clientlibPath: rawPath.replace('/etc.clientlibs/', '/apps/').replace(/\.(js|css)$/i, ''),
      pageCount: info.pageCount, samplePage: info.samplePage
    };
    const [min, raw] = await Promise.all([get(minUrl), get(origin + rawPath)]);
    if (!min) { row.verdict = 'FETCH FAILED'; return row; }
    const mb = new Blob([min]).size;
    const ind = indentPct(min);
    row.minKB = +(mb / 1024).toFixed(1);
    row.minIndentedPct = ind;
    if (mb < 1024) { row.verdict = 'TINY'; return row; }
    if (!raw) { row.verdict = ind > 10 ? 'FAILING (heuristic)' : 'OK (heuristic)'; return row; }
    const rb = new Blob([raw]).size;
    const ratio = mb / rb;
    row.rawKB = +(rb / 1024).toFixed(1);
    row.ratio = +ratio.toFixed(2);
    if (ratio > 0.9 && ind > 10) row.verdict = 'FAILING (unminified)';
    else if (ratio > 0.9) row.verdict = 'NO GAIN (pre-minified?)';
    else if (ind > 10) row.verdict = 'PARTIAL';
    else row.verdict = 'OK';
    return row;
  }
  const list = [...assets.entries()];
  const rows = [];
  for (let i = 0; i < list.length; i += CFG.CONCURRENCY) {
    rows.push(...await Promise.all(list.slice(i, i + CFG.CONCURRENCY).map(([u, info]) => check(u, info))));
  }

  // ---------- 4. export only the NOT minified files ----------
  const bad = rows.filter(r => /^(FAILING|PARTIAL)/.test(r.verdict))
    .sort((a, b) => a.type.localeCompare(b.type) * -1 || b.minKB - a.minKB);
  const count = v => rows.filter(r => r.verdict.startsWith(v)).length;
  console.log(`%cPages: ${crawled} | .min files: ${rows.length} | FAILING: ${count('FAILING')} | PARTIAL: ${count('PARTIAL')} | OK: ${count('OK')}`,
    'font-weight:bold;font-size:13px');
  if (!bad.length) { console.log('No unminified clientlib files found.'); return; }
  console.table(bad);
  console.log('%cUnminified files (full URLs):\n' + bad.map(r => r.url).join('\n'), 'font-weight:bold');

  const cols = Object.keys(bad[0]);
  const csv = [cols.join(','), ...bad.map(r => cols.map(c => `"${String(r[c]).replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'cat-unminified-clientlibs-sitewide.csv';
  document.body.appendChild(a); a.click(); a.remove();
})();
