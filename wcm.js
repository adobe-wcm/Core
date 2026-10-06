(async () => {
  const $ = window.jQuery, R = { url: location.href, ts: new Date().toISOString() };
  const cut = (s, n = 400) => (s || '').replace(/\s+/g, ' ').slice(0, n);
  const safe = o => { const w = new WeakSet(); return JSON.stringify(o, (k, v) =>
    v instanceof Node ? '<' + v.nodeName + '>' : typeof v === 'function' ? '[fn]' :
    v && typeof v === 'object' ? (w.has(v) ? '[circ]' : (w.add(v), v)) : v); };
  const attrs = el => Object.fromEntries([...el.attributes].map(a => [a.name, cut(a.value, 200)]));
  const path = el => { const p = []; for (let e = el; e && e.nodeType === 1 && p.length < 6; e = e.parentElement)
    p.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
      (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : ''));
    return p.join(' > '); };
  const evs = (el, re) => { try { const d = $ && $._data(el, 'events'); if (!d) return null;
    return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v
      .map(h => ({ ns: h.namespace, sel: h.selector, fn: cut(h.handler.toString(), 500) }))
      .filter(h => !re || re.test(h.sel + h.fn))])); } catch (e) { return String(e); } };

  // 1. dataLayer snapshot
  const dl = window.dataLayer = window.dataLayer || [];
  R.dlEvents = dl.map((e, i) => i + ':' + ((e && (e.event || e[0])) || '-'));
  R.dlPromo = dl.map((e, i) => ({ i, s: safe(e) || '' })).filter(x => /promo/i.test(x.s)).map(x => ({ i: x.i, e: JSON.parse(x.s) }));
  R.env = { jq: $ && $.fn.jquery, slick: !!($ && $.fn.slick), gtm: Object.keys(window.google_tag_manager || {}).filter(k => /^(GTM|G)-/.test(k)), vh: innerHeight };

  // 2. carousels + slides
  R.carousels = [...document.querySelectorAll('.slick-initialized')].map((el, n) => {
    const s = el.slick || {}, o = s.options || {};
    return { n, path: path(el), attrs: attrs(el), top: Math.round(el.getBoundingClientRect().top),
      current: s.currentSlide, count: s.slideCount,
      opts: { infinite: o.infinite, autoplay: o.autoplay, autoplaySpeed: o.autoplaySpeed, slidesToShow: o.slidesToShow,
        slidesToScroll: o.slidesToScroll, fade: o.fade, dots: o.dots, responsive: !!o.responsive },
      events: evs(el),
      slides: [...(s.$slides || [])].map((sl, i) => ({ i, cls: sl.className, attrs: attrs(sl), html: cut(sl.outerHTML, 1200),
        links: [...sl.querySelectorAll('a,button')].map(a => ({ text: cut(a.innerText, 60), href: a.getAttribute('href'), attrs: attrs(a), events: evs(a) })) })) };
  });

  // 3. anything promo-tagged + delegated handlers
  R.promoEls = [...document.querySelectorAll('*')].filter(el => [...el.attributes].some(a => /promo/i.test(a.name + a.value)))
    .slice(0, 40).map(el => ({ path: path(el), attrs: attrs(el), cloned: !!el.closest('.slick-cloned'), events: evs(el) }));
  const re = /promo|datalayer|analytic|track|slick|carousel|card/i;
  R.delegated = { document: evs(document, re), body: evs(document.body, re) };

  // 4. find the source that pushes the events
  R.code = []; R.unscanned = [];
  const scan = (name, t) => { const rx = /view_promotion|select_promotion/g; let m, c = 0;
    while ((m = rx.exec(t)) && c++ < 6) R.code.push({ name, at: m.index, hit: m[0], ctx: t.slice(Math.max(0, m.index - 900), m.index + 900) }); };
  [...document.scripts].filter(s => !s.src).forEach((s, i) => scan('inline#' + i, s.textContent));
  const srcs = [...document.scripts].map(s => s.src).filter(Boolean); R.scripts = srcs;
  await Promise.all(srcs.map(u => fetch(u).then(r => r.text()).then(t => scan(u, t)).catch(() => R.unscanned.push(u))));

  // 5. live hooks
  R.live = []; const t0 = performance.now();
  const log = (type, d) => { R.live.push({ t: Math.round(performance.now() - t0), type, ...d }); console.log('[promo]', type, d); };
  if (!window.__pdOn) { window.__pdOn = 1;
    const op = dl.push;
    dl.push = function (...a) { a.forEach(e => { const s = safe(e) || '', p = /promo/i.test(s);
      log('push', { event: e && e.event, payload: p ? JSON.parse(s) : undefined, stack: p ? new Error().stack.split('\n').slice(2, 9) : undefined }); });
      return op.apply(this, a); };
    if ($) $('.slick-initialized').on('beforeChange.pd afterChange.pd', function (ev, s, a, b) {
      log(ev.type, { carousel: [...document.querySelectorAll('.slick-initialized')].indexOf(this), a, b }); });
    document.addEventListener('click', e => { const a = e.target.closest('a,button');
      if (a) log('click', { text: cut(a.innerText, 60), href: a.getAttribute('href'), path: path(a) }); }, true);
    window.addEventListener('beforeunload', e => { e.preventDefault(); e.returnValue = ''; });
  }

  window.__pd = R;
  window.promoDump = () => { const out = window.__pdOut = safe(R); try { copy(out); } catch (e) {} return out.length + ' chars — copied'; };
  console.log('[promo] ready. Navigate cards, click Learn More, Cancel, then run promoDump()');
})();
