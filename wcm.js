(async()=>{const J=jQuery,el=document.querySelector('.promo--carousel.slick-initialized')||document.querySelector('.promo--carousel'),t=document.querySelector('.track-pcp--carousel');
const ev=e=>Object.fromEntries(Object.entries(J._data(e,'events')||{}).map(([k,v])=>[k,k=='beforeChange'?v.map(h=>h.handler.toString().slice(0,90)):v.length]));
const hits={};await Promise.all([...document.scripts].map(s=>s.src).filter(u=>u.startsWith(location.origin)).map(u=>fetch(u).then(r=>r.text()).then(x=>{const n=(x.match(/view_promotion/g)||[]).length;if(n)hits[u.split('/').pop().slice(0,28)]=n}).catch(()=>{})));
console.log(JSON.stringify({jq:[J.fn.jquery,window.$===J],
sameJq:((J._data(document,'events')||{}).mousedown||[]).some(h=>/promo__button/.test(h.selector||'')),
cls:el.className,
insideTrack:!!el.parentElement.closest('.track-pcp--carousel'),selfTrack:el.matches('.track-pcp--carousel'),
containerMatches:document.querySelectorAll('.track-pcp--carousel .promo--carousel').length,
carouselEvents:ev(el),trackEvents:t?ev(t):null,
slides:(el.slick?[...el.slick.$slides]:[...el.children]).map(s=>[s.matches('.promo'),/promotionView-tracked/.test(s.className),!!s.querySelector('.promo__button'),(s.querySelector('.promo__heading')||{textContent:''}).textContent.trim().slice(0,22)]),
viewPromoInFiles:hits},null,1))})();
