const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const productosPath = path.join(__dirname, '..', 'productos-data.js');

let indexHtml = null;
let productosCache = null;

const loadIndexHtml = () => {
  if (!indexHtml) {
    indexHtml = fs.readFileSync(indexPath, 'utf-8');
  }
  return indexHtml;
};

const loadProductos = () => {
  if (!productosCache) {
    const mod = require(productosPath);
    productosCache = Array.isArray(mod) ? mod : mod.productos;
  }
  return productosCache;
};

const truncate = (str, max) =>
  str.length > max ? str.slice(0, max - 1).trimEnd() + '\u2026' : str;

const buildMetaTags = (p) => {
  const SITE_URL = 'https://catalogo-piezas.vercel.app';
  const image = `${SITE_URL}/${encodeURI(p.imagenes[0])}`;
  const title = `${p.nombre} \u2014 ${formatPrice(p.precio)} | DLG Autopartes`;
  const description = truncate(p.descripcion, 200);
  const url = `${SITE_URL}/producto/${p.slug}/`;
  const price = p.precio;

  return `  <meta property="og:type" content="product" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:image:width" content="400" />
  <meta property="og:image:height" content="400" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:site_name" content="DLG Autopartes" />
  <meta property="product:price:amount" content="${price}" />
  <meta property="product:price:currency" content="USD" />
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:title" content="${esc(title)}" />
  <meta property="twitter:description" content="${esc(description)}" />
  <meta property="twitter:image" content="${esc(image)}" />`;
};

const esStaticMetaTag = (line) =>
  line.includes('property="og:') ||
  line.includes('name="twitter:') ||
  line.includes('property="product:') ||
  line.includes('name="description"') ||
  line.includes('property="og:url"');

const esc = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const formatPrice = (n) => `$${Number(n).toFixed(2)}`;

const injectProductMeta = (html, p) => {
  const staticLines = [];
  const productMetaLines = [];
  const otherLines = [];

  html.split('\n').forEach((line) => {
    if (esStaticMetaTag(line)) {
      staticLines.push(line);
    } else {
      otherLines.push(line);
    }
  });

  productMetaLines.push(buildMetaTags(p));

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  let newTitle = titleMatch ? titleMatch[1] : 'DLG Autopartes';
  if (p) {
    newTitle = `${p.nombre} \u2014 ${formatPrice(p.precio)} | DLG Autopartes`;
  }

  let result = otherLines.join('\n');
  result = result.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(newTitle)}</title>`);

  const headInsert = staticLines.join('\n') + '\n' + productMetaLines.join('\n');
  result = result.replace('</head>', headInsert + '\n</head>');

  return result;
};

module.exports = (req, res) => {
  const productoSlug = req.query.producto || null;

  try {
    let html = loadIndexHtml();

    if (productoSlug) {
      const productos = loadProductos();
      const product = productos.find((p) => p.slug === productoSlug);

      if (product) {
        html = injectProductMeta(html, product);
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
