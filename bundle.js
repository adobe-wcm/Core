// Find clientlibs where JS/CSS minification silently fails (processor error -> AEM serves raw source)
// Run in DevTools Console on AEM AUTHOR (logged in), e.g. http://localhost:4502 or authorqa
(async () => {
  const CFG = { ROOT: '/apps', CONCURRENCY: 3 };

  // 1. All clientlib folders via QueryBuilder
  const qs = new URLSearchParams({
    path: CFG.ROOT,
    type: 'cq:ClientLibraryFolder',
    'p.limit': '-1',
    'p.hits': 'selective',
    'p.properties': 'jcr:path categories jsProcessor cssProcessor allowProxy embed'
  });
  const res = await (await fetch('/bin/querybuilder.json?' + qs, { credentials: 'same-origin' })).json();
  const libs = res.hits || [];
  console.log(`Clientlib folders found under ${CFG.ROOT}: ${libs.length}`);

  const arr = v => Array.isArray(v) ? v.join(' | ') : (v ?? '');
  const urlFor = (lib, ext) => {
    const p = lib['jcr:path'];
    const proxy = lib.allowProxy === true || lib.allowProxy === 'true';
    return proxy && p.startsWith('/apps/') ? '/etc.clientlibs/' + p.slice(6) + ext : p + ext;
  };
  const get = async url => {
    try {
      const r = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
      return r.ok ? await r.text() : null;
    } catch { return null; }
  };
  const indentPct = text => {
    const lines = text.split('\n').filter(l => l.trim());
    const n = Math.max(lines.length, 1);
    return Math.round(lines.filter(l => /^[ \t]{2,}/.test(l)).length / n * 100);
  };

  // 2. Compare raw (.js/.css) vs minified (.min.js/.min.css) output per clientlib
  async function check(lib, type) {
    const ext = type === 'JS' ? '.js' : '.css';
    const row = {
      path: lib['jcr:path'], type,
      categories: arr(lib.categories),
      processor: arr(type === 'JS' ? lib.jsProcessor : lib.cssProcessor) || '(global default)',
      embeds: arr(lib.embed),
      rawKB: '', minKB: '', ratio: '', minIndentedPct: '', verdict: ''
    };
    const [raw, min] = await Promise.all([get(urlFor(lib, ext)), get(urlFor(lib, '.min' + ext))]);
    if (!raw || !raw.trim()) { row.verdict = 'NONE'; return row; }
    const rb = new Blob([raw]).size;
    row.rawKB = (rb / 1024).toFixed(1);
    if (!min) { row.verdict = 'MIN FETCH FAILED'; return row; }
    const mb = new Blob([min]).size;
    const ratio = mb / rb;
    const ind = indentPct(min);
    row.minKB = (mb / 1024).toFixed(1);
    row.ratio = ratio.toFixed(2);
    row.minIndentedPct = ind;
    if (rb < 1024) row.verdict = 'TINY';
    else if (ratio > 0.9 && ind > 10) row.verdict = 'FAILING (unminified)';
    else if (ratio > 0.9) row.verdict = 'NO GAIN (pre-minified?)';
    else if (ind > 10) row.verdict = 'PARTIAL';
    else row.verdict = 'OK';
    return row;
  }

  const jobs = libs.flatMap(l => [[l, 'JS'], [l, 'CSS']]);
  const rows = [];
  for (let i = 0; i < jobs.length; i += CFG.CONCURRENCY) {
    rows.push(...await Promise.all(jobs.slice(i, i + CFG.CONCURRENCY).map(([l, t]) => check(l, t))));
    if (rows.length % 60 < CFG.CONCURRENCY) console.log(`Checked ${rows.length}/${jobs.length}`);
  }

  // 3. Report
  const order = { 'FAILING (unminified)': 0, 'PARTIAL': 1, 'MIN FETCH FAILED': 2, 'NO GAIN (pre-minified?)': 3, 'OK': 4, 'TINY': 5, 'NONE': 6 };
  rows.sort((a, b) => a.type.localeCompare(b.type) * -1 || (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9) || (b.rawKB - a.rawKB));
  const withJs = rows.filter(r => r.verdict !== 'NONE');
  const count = (v, t) => withJs.filter(r => r.verdict === v && r.type === t).length;
  const line = t => `${t}: ${withJs.filter(r => r.type === t).length} | FAILING: ${count('FAILING (unminified)', t)} | PARTIAL: ${count('PARTIAL', t)} | NO GAIN: ${count('NO GAIN (pre-minified?)', t)} | OK: ${count('OK', t)}`;
  console.log(
    `%c${line('JS')}\n${line('CSS')}`,
    'font-weight:bold;font-size:13px'
  );
  console.table(withJs);

  const cols = Object.keys(rows[0] || {});
  const csv = [cols.join(','), ...withJs.map(r => cols.map(c => `"${String(r[c]).replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'clientlib-minification-status.csv';
  document.body.appendChild(a); a.click(); a.remove();
  console.log('Downloaded clientlib-minification-status.csv');
})();
