function appendPriceSchema(price) {
  if (document.getElementById('pdp-price-schema')) return;

  var schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: document.title.split('|')[0].trim(), // "CW34 Pneumatic Rollers"
    price: String(price)
  };

  var s = document.createElement('script');
  s.type = 'application/ld+json';
  s.id = 'pdp-price-schema';
  s.textContent = JSON.stringify(schema);
  document.head.appendChild(s);
}
