SELECT page.* FROM [cq:Page] AS page
INNER JOIN [cq:PageContent] AS content ON ISCHILDNODE(content, page)
INNER JOIN [nt:unstructured] AS c ON ISDESCENDANTNODE(c, content)
WHERE ISDESCENDANTNODE(page, '/content/catdotcom/en_US/products')
AND c.[sling:resourceType] LIKE 'deg/components/content/product/editable/common/non-pim/productBanners/%'
