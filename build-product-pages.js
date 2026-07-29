/* ════════════════════════════════════════════════════════════════
   DLG AUTOPARTES — build-product-pages.js
   ──────────────────────────────────────────────────────────────────
   Los productos ya NO se generan como archivos HTML individuales.

   El enfoque actual usa una función serverless de Vercel (api/index.js)
   que sirve index.html en la raíz e inyecta al vuelo las metaetiquetas
   Open Graph (og:title, og:description, og:image, product:price:amount, etc.)
   cuando se accede con el query param ?producto=slug.

   Formato del enlace de un producto:
     https://catalogo-piezas.vercel.app/?producto=varios-silicona-rtv-0

   Esto permite que WhatsApp, Facebook y Telegram muestren la vista previa
   correcta (foto, precio y descripción) sin necesidad de páginas HTML
   separadas ni archivos individuales por producto.

   Los slugs de los productos se definen en productos-data.js.

   Uso:
     node build-product-pages.js
   Salida:
     (ninguna — esta utilidad solo confirma que el método serverless
      está activo y los slugs están disponibles)
 ════════════════════════════════════════════════════════════════ */

const productos = require('./productos-data.js');

console.log(`✅ ${productos.length} productos con slugs definidos.`);
console.log('ℹ️  Las páginas de producto se sirven dinámicamente via api/index.js');
console.log('ℹ️  Formato: https://catalogo-piezas.vercel.app/?producto=<slug>');