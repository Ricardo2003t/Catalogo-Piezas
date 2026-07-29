/* ════════════════════════════════════════════════════════════════
   DLG AUTOPARTES — build-product-pages.js
   ──────────────────────────────────────────────────────────────────
   Las páginas de producto ya NO se generan como archivos HTML
   individuales en /producto/{slug}/index.html.

   En su lugar, Vercel reescribe cualquier petición a
   /producto/{slug}/ hacia la función serverless api/index.js,
   que sirve el mismo index.html de la raíz pero inyectando
   al vuelo las metaetiquetas Open Graph del producto solicitado.

   Esto significa que al compartir un producto en WhatsApp, Facebook
   o Telegram, la vista previa mostrará la foto, precio y descripción
   del producto correcto, sin necesidad de archivos HTML separados.

   Los slugs de los productos se definen en productos-data.js.

   Uso:
     node build-product-pages.js
   Salida:
     (ninguna — las páginas de producto se sirven mediante
      la función serverless en tiempo real)
 ════════════════════════════════════════════════════════════════ */

const productos = require('./productos-data.js');

console.log(`✅ ${productos.length} productos con slugs definidos.`);
console.log('ℹ️  Las páginas /producto/{slug}/ se sirven dinámicamente via api/index.js');
console.log('ℹ️  Usa vercel.json para reescribir esas rutas a la función serverless.');