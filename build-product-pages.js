/* ════════════════════════════════════════════════════════════════
   DLG AUTOPARTES — build-product-pages.js
   ──────────────────────────────────────────────────────────────────
   Los productos ya NO se generan como archivos HTML individuales.

   El enfoque actual usa una función serverless de Vercel (api/index.js)
   que sirve el mismo index.html en la raíz, pero inyecta las
   metaetiquetas Open Graph (og:title, og:description, og:image, etc.)
   al vuelo cuando se accede con ?producto=slug.

   Esto permite que WhatsApp, Facebook y Telegram muestren la vista
   previa correcta (foto + precio + descripción) sin necesidad de
   páginas HTML separadas por producto.

   Los slugs de los productos se definen en productos-data.js.

   Uso:
     node build-product-pages.js
   Salida:
     (ninguna — el script solo confirma que no es necesario
      generar páginas HTML individuales)
 ════════════════════════════════════════════════════════════════ */

const productos = require('./productos-data.js');

console.log(`✅ ${productos.length} productos con slugs definidos.`);
console.log('ℹ️  Las páginas de producto se sirven dinámicamente via api/index.js');
console.log('ℹ️  Cada producto se comparte como: https://catalogo-piezas.vercel.app/?producto=<slug>');