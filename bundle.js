// Clientlib minification check for PUBLISH / PROD (no login, no QueryBuilder)
// Run in DevTools Console on any cat.com page. Repeat on one page per template.
// Optional: paste extra /etc.clientlibs URLs (e.g. from cat-assets-minification.csv) into EXTRA_URLS.
(async () => {
  const EXTRA_URLS = [
    // 'https://www.cat.com/etc.clientlibs/deg/.../site.min.abc123.js',
  ];
  const CONCURRENCY = 3;

  const urls = new Set(EXTRA_URLS);
  document.querySelectorAll('script[src], link[rel~="stylesheet"][href]').forEach(el => urls.add(el.src || el.href));
  performance.getEntriesByType('resource').forEach(e => urls.add(e.name));

  const targets = [...urls].filter(u => {
    try {
      const p = new URL(u, location.origin);
      return p.origin === location.origin && p.pathname.startsWith('/etc.clientlibs/') && /\.(js|css)$/i.test(p.pathname);
    } catch { return false; }
  });
  console.log(`Clientlib files found: ${targets.length}`);

  const rawUrlOf = u => {
    const p = new URL(u, location.origin);
    p.search = '';
    p.pathname = p.pathname.replace(/\.min(\.[0-9a-f]{8,})?\.(js|css)$/i, '.$2');
    return p.href;
  };
  const get = async u => {
    try { const r = await fetch(u, { cache: 'force-cache' }); return r.ok ? await r.text() : null; } catch { return null; }
  };
  const indentPct = t => {
    const lines = t.split('\n').filter(l => l.trim());
    const n = Math.max(lines.length, 1);
    return Math.round(lines.filter(l => /^[ \t]{2,}/.test(l)).length / n * 100);
  };

  async function check(u) {
    const type = /\.css$/i.test(new URL(u).pathname) ? 'CSS' : 'JS';
    const rawUrl = rawUrlOf(u);
    const row = {
      url: u,
      rawUrl,
      file: new URL(u).pathname.split('/').slice(-4).join('/'), type,
      minKB: '', rawKB: '', ratio: '', minIndentedPct: '', verdict: '',
      clientlibPath: new URL(rawUrl).pathname.replace('/etc.clientlibs/', '/apps/').replace(/\.(js|css)$/i, '')
    };
    const [min, raw] = await Promise.all([get(u), rawUrl === u ? null : get(rawUrl)]);
    if (!min) { row.verdict = 'FETCH FAILED'; return row; }
    const mb = new Blob([min]).size;
    const ind = indentPct(min);
    row.minKB = (mb / 1024).toFixed(1);
    row.minIndentedPct = ind;
    if (mb < 1024) { row.verdict = 'TINY'; return row; }
    if (!raw) {
      // raw twin blocked by dispatcher: fall back to indentation heuristic
      row.verdict = ind > 10 ? 'FAILING (heuristic)' : 'OK (heuristic)';
      return row;
    }
    const rb = new Blob([raw]).size;
    const ratio = mb / rb;
    row.rawKB = (rb / 1024).toFixed(1);
    row.ratio = ratio.toFixed(2);
    if (ratio > 0.9 && ind > 10) row.verdict = 'FAILING (unminified)';
    else if (ratio > 0.9) row.verdict = 'NO GAIN (pre-minified?)';
    else if (ind > 10) row.verdict = 'PARTIAL';
    else row.verdict = 'OK';
    return row;
  }

  const rows = [];
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    rows.push(...await Promise.all(targets.slice(i, i + CONCURRENCY).map(check)));
  }

  const order = { 'FAILING (unminified)': 0, 'FAILING (heuristic)': 1, 'PARTIAL': 2, 'FETCH FAILED': 3, 'NO GAIN (pre-minified?)': 4, 'OK': 5, 'OK (heuristic)': 6, 'TINY': 7 };
  rows.sort((a, b) => (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9) || (b.minKB - a.minKB));
  const count = v => rows.filter(r => r.verdict.startsWith(v)).length;
  console.log(`%cFAILING: ${count('FAILING')} | PARTIAL: ${count('PARTIAL')} | NO GAIN: ${count('NO GAIN')} | OK: ${count('OK')}`, 'font-weight:bold;font-size:13px');
  console.table(rows.map(({ url, rawUrl, ...r }) => r));

  // CSV: only files that are NOT actually minified, served .min URL only
  const bad = rows.filter(r => /^(FAILING|PARTIAL)/.test(r.verdict)).map(({ rawUrl, ...r }) => r);
  if (!bad.length) { console.log('No unminified clientlib files on this page.'); return; }
  const cols = Object.keys(bad[0]);
  const csv = [cols.join(','), ...bad.map(r => cols.map(c => `"${String(r[c]).replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `unminified-clientlibs-${location.pathname.split('/').pop().replace('.html', '')}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
})();
