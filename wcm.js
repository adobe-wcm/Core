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
