SELECT page.* FROM [cq:Page] AS page
INNER JOIN [cq:PageContent] AS content ON ISCHILDNODE(content, page)
INNER JOIN [nt:unstructured] AS c ON ISDESCENDANTNODE(c, content)
WHERE ISDESCENDANTNODE(page, '/content/catdotcom/en_US/products')
AND c.[sling:resourceType] LIKE 'deg/components/content/product/editable/common/non-pim/productBanners/%'



const rt = 'deg/components/content/product/editable/common/non-pim/productBanners/v1/productBanners';
['/content/catdotcom/en_US', '/content/experience-fragments'].forEach(path =>
  fetch(`/bin/querybuilder.json?path=${path}&property=sling:resourceType&property.value=${rt}&p.limit=-1&p.hits=selective&p.properties=jcr:path`)
    .then(r => r.json())
    .then(d => console.log(path, d.total, [...new Set(d.hits.map(h => h['jcr:path'].split('/jcr:content')[0]))]))
);


const base = 'deg/components/content/product/editable/common/non-pim/productBanners/';
fetch(`/bin/querybuilder.json?path=/content&property=sling:resourceType&property.value=${encodeURIComponent(base + '%')}&property.operation=like&p.limit=-1&p.hits=selective&p.properties=jcr:path%20sling:resourceType`)
  .then(r => r.json())
  .then(d => {
    const m = {};
    d.hits.forEach(h => (m[h['sling:resourceType']] ||= new Set()).add(h['jcr:path'].split('/jcr:content')[0]));
    Object.entries(m).forEach(([rt, pages]) => console.log(rt, pages.size, [...pages]));
  });


const rt = 'deg/components/content/product/editable/common/non-pim/productBanners/productBanners';
const marker = 'productBanners/v2/productBanners/clientlibs';
const d = await (await fetch(`/bin/querybuilder.json?path=/content/catdotcom/en_US/products&property=sling:resourceType&property.value=${rt}&p.limit=-1&p.hits=selective&p.properties=jcr:path`)).json();
const pages = [...new Set(d.hits.map(h => h['jcr:path'].split('/jcr:content')[0]))];
console.log(pages.length + ' candidate pages');
const found = [];
for (const p of pages) {
  if (found.length >= 5) break;
  const html = await (await fetch(p + '.html?wcmmode=disabled')).text();
  if (html.includes(marker)) { found.push(location.origin + p + '.html?wcmmode=disabled'); console.log('✔', p); }
}
console.log(found.join('\n'));
