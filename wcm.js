// Site-wide CSS minification report – every CSS file loaded across cat.com (ticket 2877209)
// Run in DevTools > Sources > Snippets on https://www.cat.com/en_US.html (reload first), Ctrl+Enter.
// Stop anytime: window.__stopCrawl = true   (results so far are still exported)
//
// Covers: clientlib CSS (/etc.clientlibs/*.min.css), non-clientlib CSS (e.g. dynamic /content/*.css), third-party CSS.
// Output: cat-css-minification.csv (all CSS files, full URL, verdict) + console summary.
(async () => {
  const CFG = { PATH_PREFIX: '/en_US', MAX_PAGES: 1000, CONCURRENCY: 4, DELAY_MS: 200, MAX_SITEMAPS: 50 };
  window.__stopCrawl = false;
  const origin = location.origin;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const kb = n => +(n / 1024).toFixed(1);
  const bytes = s => new Blob([s]).size;
  const pageUrl = (href, base = origin) => {
    try { const u = new URL(href, base); u.hash = ''; u.search = ''; return u.href; } catch { return null; }
  };
  const isPage = u => !!u && u.startsWith(origin + CFG.PATH_PREFIX) && /\.html$/i.test(new URL(u).pathname);

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

  // ---------- 2. crawl pages, collect every stylesheet ----------
  const cssFiles = new Map(); // url -> { pageCount, samplePage }
  let crawled = 0;
  async function crawl(url) {
    try {
      const r = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
      if (!r.ok || !(r.headers.get('content-type') || '').includes('html')) return;
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      doc.querySelectorAll('link[rel~="stylesheet"][href]').forEach(l => {
        try {
          const u = new URL(l.getAttribute('href'), url);
          u.hash = '';
          const e = cssFiles.get(u.href) || { pageCount: 0, samplePage: url };
          e.pageCount++;
          cssFiles.set(u.href, e);
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
      active++; await crawl(url); active--; crawled++;
      if (crawled % 50 === 0) console.log(`Pages ${crawled} | queue ${queue.length} | unique CSS files ${cssFiles.size}`);
      await sleep(CFG.DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CFG.CONCURRENCY }, worker));
  console.log(`Crawl done: ${crawled} pages, ${cssFiles.size} unique CSS files. Checking...`);

  // ---------- 3. check each CSS file ----------
  const MIN_RE = /\.min(\.[0-9a-f]{8,})?\.css$/i;
  const get = async u => {
    try { const r = await fetch(u, { cache: 'force-cache' }); return r.ok ? await r.text() : null; } catch { return null; }
  };
  const indentPct = t => {
    const lines = t.split('\n').filter(l => l.trim());
    const n = Math.max(lines.length, 1);
    return Math.round(lines.filter(l => /^[ \t]{2,}/.test(l)).length / n * 100);
  };
  // conservative CSS minify estimate (comments + whitespace; strings untouched)
  const cssMin = css => {
    let out = '', last = 0, m;
    const re = /\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
    const compact = s => s.replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/:\s+/g, ':').split(';}').join('}');
    while ((m = re.exec(css))) {
      out += compact(css.slice(last, m.index));
      if (!m[0].startsWith('/*') || m[0].startsWith('/*!')) out += m[0];
      last = m.index + m[0].length;
    }
    return (out + compact(css.slice(last))).trim();
  };

  async function check(url, info) {
    const u = new URL(url);
    const source = u.origin !== origin ? 'third-party'
      : u.pathname.startsWith('/etc.clientlibs/') ? 'clientlib' : 'non-clientlib (same origin)';
    const row = {
      url, source, verdict: '', sizeKB: '', rawTwinKB: '', ratio: '',
      indentedPct: '', commentPct: '', estSavingPct: '',
      clientlibPath: source === 'clientlib' ? u.pathname.replace('/etc.clientlibs/', '/apps/').replace(MIN_RE, '').replace(/\.css$/i, '') : '',
      pageCount: info.pageCount, samplePage: info.samplePage
    };
    const css = await get(url);
    if (css === null) { row.verdict = source === 'third-party' ? 'UNCHECKED (CORS)' : 'FETCH FAILED'; return row; }
    const size = bytes(css);
    const comments = (css.match(/\/\*(?!!)[\s\S]*?\*\//g) || []).reduce((a, c) => a + c.length, 0);
    row.sizeKB = kb(size);
    row.indentedPct = indentPct(css);
    row.commentPct = size ? +((comments / size) * 100).toFixed(1) : 0;
    row.estSavingPct = size ? +((1 - bytes(cssMin(css)) / size) * 100).toFixed(1) : 0;

    if (size < 1024) { row.verdict = 'TINY'; return row; }

    let notMin = row.indentedPct > 10 || row.commentPct > 3 || row.estSavingPct > 10;
    if (source === 'clientlib' && MIN_RE.test(u.pathname)) {
      const raw = await get(origin + u.pathname.replace(MIN_RE, '.css'));
      if (raw) {
        const rb = bytes(raw);
        row.rawTwinKB = kb(rb);
        row.ratio = +(size / rb).toFixed(2);
        notMin = row.ratio > 0.9 && row.indentedPct > 10;
      }
    }
    row.verdict = notMin ? 'NOT MINIFIED' : 'MINIFIED';
    return row;
  }

  const list = [...cssFiles.entries()];
  const rows = [];
  for (let i = 0; i < list.length; i += CFG.CONCURRENCY) {
    rows.push(...await Promise.all(list.slice(i, i + CFG.CONCURRENCY).map(([u, info]) => check(u, info))));
  }

  // ---------- 4. report ----------
  const order = { 'NOT MINIFIED': 0, 'FETCH FAILED': 1, 'UNCHECKED (CORS)': 2, 'MINIFIED': 3, 'TINY': 4 };
  rows.sort((a, b) => (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9) || (b.sizeKB || 0) - (a.sizeKB || 0));
  const cnt = (v, s) => rows.filter(r => r.verdict === v && (!s || r.source === s)).length;
  const bySource = ['clientlib', 'non-clientlib (same origin)', 'third-party'].map(s =>
    `${s}: ${rows.filter(r => r.source === s).length} files | MINIFIED ${cnt('MINIFIED', s)} | NOT MINIFIED ${cnt('NOT MINIFIED', s)} | TINY ${cnt('TINY', s)} | UNCHECKED ${cnt('UNCHECKED (CORS)', s) + cnt('FETCH FAILED', s)}`
  ).join('\n');
  console.log(`%cPages: ${crawled} | CSS files: ${rows.length} | MINIFIED: ${cnt('MINIFIED')} | NOT MINIFIED: ${cnt('NOT MINIFIED')} | TINY: ${cnt('TINY')}\n${bySource}`,
    'font-weight:bold;font-size:13px');
  console.table(rows);
  const bad = rows.filter(r => r.verdict === 'NOT MINIFIED');
  if (bad.length) console.log('%cNOT minified CSS (full URLs):\n' + bad.map(r => `${r.url}  (${r.sizeKB} KB, ${r.source})`).join('\n'), 'font-weight:bold;color:#c00');

  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'cat-css-minification.csv';
  document.body.appendChild(a); a.click(); a.remove();
  console.log('Downloaded cat-css-minification.csv');
})();
