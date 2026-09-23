// cat.com crawl + minification/compression audit
// Run in DevTools Console on https://www.cat.com/en_US.html (same-origin = no CORS / bot issues)
// Stop anytime: window.__stopCrawl = true   (results so far are still exported)
(async () => {
  const CFG = {
    PATH_PREFIX: '/en_US',   // locale to crawl; '' = whole site (huge)
    MAX_PAGES: 500,          // assets repeat per template, 300-500 pages covers almost everything
    CONCURRENCY: 4,
    DELAY_MS: 200,           // be gentle on prod / Akamai WAF
    USE_SITEMAP: true,
    MAX_SITEMAPS: 50
  };
  window.__stopCrawl = false;
  const origin = location.origin;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pageUrl = (href, base = origin) => {
    try { const u = new URL(href, base); u.hash = ''; u.search = ''; return u.href; } catch { return null; }
  };
  const assetUrl = (href, base) => { try { const u = new URL(href, base); u.hash = ''; return u.href; } catch { return null; } };
  const isPage = u => !!u && u.startsWith(origin + CFG.PATH_PREFIX) && /\.html$/i.test(new URL(u).pathname);

  // ---------- 1. Discover pages (sitemap first) ----------
  async function fromSitemaps() {
    const found = new Set();
    let maps = [];
    try {
      const t = await (await fetch('/robots.txt')).text();
      maps = [...t.matchAll(/^sitemap:\s*(\S+)/gim)].map(m => m[1]);
    } catch {}
    if (!maps.length) maps = [origin + '/sitemap.xml'];
    const seen = new Set();
    while (maps.length && found.size < CFG.MAX_PAGES && seen.size < CFG.MAX_SITEMAPS) {
      const sm = maps.shift();
      if (seen.has(sm)) continue;
      seen.add(sm);
      try {
        const r = await fetch(sm);
        if (!r.ok) continue;
        const xml = new DOMParser().parseFromString(await r.text(), 'application/xml');
        for (const loc of xml.getElementsByTagName('loc')) {
          const parent = loc.parentNode && loc.parentNode.localName;
          const val = loc.textContent.trim();
          if (parent === 'sitemap') maps.push(val);
          else { const u = pageUrl(val); if (isPage(u) && found.size < CFG.MAX_PAGES) found.add(u); }
        }
      } catch {}
    }
    console.log(`Sitemaps read: ${seen.size}, pages found: ${found.size}`);
    return [...found];
  }

  const queue = CFG.USE_SITEMAP ? await fromSitemaps() : [];
  if (!queue.length) console.log('No sitemap pages found - crawling links instead.');
  const queued = new Set(queue);
  const seed = pageUrl(location.href);
  if (!queued.has(seed)) { queue.unshift(seed); queued.add(seed); }

  // ---------- 2. Crawl pages, collect unique assets ----------
  const pages = [];
  const assets = new Map();

  function addAsset(href, page, template, type) {
    const u = assetUrl(href, page);
    if (!u || !/^https?:/.test(u)) return;
    let a = assets.get(u);
    if (!a) {
      const p = new URL(u);
      a = {
        url: u, type,
        source: p.pathname.startsWith('/etc.clientlibs/') ? 'clientlib'
          : p.origin === origin ? 'NON-clientlib (same origin)' : 'third-party',
        pageCount: 0, templates: new Set(), samplePage: page
      };
      assets.set(u, a);
    }
    a.pageCount++;
    if (template) a.templates.add(template);
  }

  async function crawlPage(url) {
    const row = { url, status: '', htmlEncoding: '', template: '', scripts: 0, styles: 0 };
    try {
      const r = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
      row.status = r.status;
      row.htmlEncoding = r.headers.get('content-encoding') || 'NONE';
      if (!r.ok || !(r.headers.get('content-type') || '').includes('html')) return row;
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      row.template = doc.querySelector('meta[name="template"]')?.content || '';
      doc.querySelectorAll('script[src]').forEach(s => { addAsset(s.getAttribute('src'), url, row.template, 'JS'); row.scripts++; });
      doc.querySelectorAll('link[rel~="stylesheet"][href]').forEach(l => { addAsset(l.getAttribute('href'), url, row.template, 'CSS'); row.styles++; });
      if (queued.size < CFG.MAX_PAGES) {
        doc.querySelectorAll('a[href]').forEach(a => {
          const u = pageUrl(a.getAttribute('href'), url);
          if (isPage(u) && !queued.has(u) && queued.size < CFG.MAX_PAGES) { queued.add(u); queue.push(u); }
        });
      }
    } catch { row.status = 'ERR'; }
    return row;
  }

  let idx = 0, active = 0;
  async function worker() {
    while (!window.__stopCrawl && idx < CFG.MAX_PAGES) {
      if (idx >= queue.length) { if (active === 0) break; await sleep(100); continue; }
      const url = queue[idx++];
      active++;
      pages.push(await crawlPage(url));
      active--;
      if (pages.length % 25 === 0) console.log(`Crawled ${pages.length} pages | queue ${queue.length} | unique assets ${assets.size}`);
      await sleep(CFG.DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CFG.CONCURRENCY }, worker));
  console.log(`Crawl done: ${pages.length} pages, ${assets.size} unique JS/CSS files. Analysing...`);

  // ---------- 3. Analyse each unique asset once ----------
  async function analyse(a) {
    const row = {
      file: new URL(a.url).pathname.split('/').pop(), type: a.type, source: a.source,
      hasMinInName: /\.min\./.test(new URL(a.url).pathname) ? 'Y' : 'N',
      verdict: '', sizeKB: '', avgLineLen: '', indentedPct: '', commentPct: '', estSavingPct: '',
      encoding: '', pageCount: a.pageCount, templates: [...a.templates].join(' | '),
      samplePage: a.samplePage, url: a.url
    };
    try {
      const r = await fetch(a.url, { cache: 'force-cache', credentials: 'same-origin' });
      row.encoding = r.headers.get('content-encoding') || '';
      const text = await r.text();
      const bytes = new Blob([text]).size;
      const lines = text.split('\n').filter(l => l.trim());
      const n = Math.max(lines.length, 1);
      const avgLen = Math.round(bytes / n);
      const indented = lines.filter(l => /^[ \t]{2,}/.test(l)).length / n;
      const comments = (text.match(/\/\*(?!!)[\s\S]*?\*\//g) || []).reduce((s, c) => s + c.length, 0);
      const squashed = text.replace(/\/\*(?!!)[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').length;
      row.sizeKB = (bytes / 1024).toFixed(1);
      row.avgLineLen = avgLen;
      row.indentedPct = Math.round(indented * 100);
      row.commentPct = Math.round((comments / bytes) * 100);
      row.estSavingPct = Math.max(0, Math.round((1 - squashed / bytes) * 100));
      if (bytes < 1024) row.verdict = 'TINY (ignore)';
      else if (avgLen > 300 && indented < 0.05 && row.estSavingPct < 5) row.verdict = 'MINIFIED';
      else if (avgLen < 100 || indented > 0.25 || comments / bytes > 0.05) row.verdict = 'NOT MINIFIED';
      else row.verdict = 'PARTIAL / CHECK';
    } catch { row.verdict = 'FETCH BLOCKED (CORS) - check manually'; }
    return row;
  }

  const list = [...assets.values()];
  const results = [];
  for (let i = 0; i < list.length; i += CFG.CONCURRENCY) {
    results.push(...await Promise.all(list.slice(i, i + CFG.CONCURRENCY).map(analyse)));
  }
  const order = { 'NOT MINIFIED': 0, 'PARTIAL / CHECK': 1, 'FETCH BLOCKED (CORS) - check manually': 2, 'MINIFIED': 3, 'TINY (ignore)': 4 };
  results.sort((a, b) => (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9) || b.pageCount - a.pageCount);

  // ---------- 4. Report + CSV downloads ----------
  const count = v => results.filter(r => r.verdict === v).length;
  const noGzip = pages.filter(p => p.htmlEncoding === 'NONE').length;
  const templates = [...new Set(pages.map(p => p.template).filter(Boolean))];
  console.log(
    `%cPages: ${pages.length} | Templates: ${templates.length} | HTML without Content-Encoding: ${noGzip}\n` +
    `Unique files: ${results.length} | NOT MINIFIED: ${count('NOT MINIFIED')} | PARTIAL: ${count('PARTIAL / CHECK')} | MINIFIED: ${count('MINIFIED')} | BLOCKED: ${count('FETCH BLOCKED (CORS) - check manually')}`,
    'font-weight:bold;font-size:13px'
  );
  console.table(results.map(({ url, samplePage, templates, ...r }) => r));

  const download = (name, rows) => {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  };
  download('cat-assets-minification.csv', results);
  download('cat-pages-compression.csv', pages);
  console.log('Downloaded: cat-assets-minification.csv, cat-pages-compression.csv');
})();
