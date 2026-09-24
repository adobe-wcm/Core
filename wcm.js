(async () => {
  const html = await (await fetch(location.href, { cache: 'no-store' })).text();
  const min = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ');
  const gz = async s => (await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()).byteLength;
  const [a, b] = [await gz(html), await gz(min)];
  console.log(`Raw ${(html.length/1024).toFixed(1)} KB → ${(min.length/1024).toFixed(1)} KB | Gzipped ${(a/1024).toFixed(1)} KB → ${(b/1024).toFixed(1)} KB | Real saving: ${((1-b/a)*100).toFixed(1)}%`);
})();
