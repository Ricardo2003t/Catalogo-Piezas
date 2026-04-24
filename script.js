/* ════════════════════════════════════════════════════════════════
   DLG AUTOPARTES — script.js
   Vanilla ES6+ · Mobile-First · PWA
════════════════════════════════════════════════════════════════ */

'use strict';

/* ── CONFIGURACIÓN ──────────────────────────────────────────── */
const CONFIG = {
  WA_NUMBER:    '5352531473',  // ← número real Cuba
  PAGE_SIZE:    4,             // PERF: 4 tarjetas/batch → menos DOM en 16kbps
  SEARCH_DELAY: 350,           // ms debounce búsqueda (un poco más en conexiones lentas)
  CAROUSEL_MAX: 4,
};

/* ── DETECCIÓN DE CONEXIÓN LENTA ────────────────────────────── */
const isSlowConnection = (() => {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return false;
  // saveData activo O velocidad menor a 1Mbps O tipo 2g/slow-2g
  return conn.saveData ||
         (conn.effectiveType && ['slow-2g','2g'].includes(conn.effectiveType)) ||
         (conn.downlink && conn.downlink < 1);
})();
  
/* ── BASE DE DATOS ──────────────────────────────────────────── */
const productos = [
  // HYUNDAI
  { marca:'hyundai', nombre:'Filtro de Aceite H100', modelo:['h100'], tipo:'filtro', precio:8.00, precioOriginal:null, imagenes:['Piezas/Hyundai/Filtro de Aceite  H100 (Foto 1).webp','Piezas/Hyundai/Filtro de Aceite  H100 (Foto 2).webp'], descripcion:'Filtro original para Hyundai H100. Máxima protección eliminando impurezas. Compatible con motores diesel y gasolina.', oferta:false, disponible:true },
  { marca:'hyundai', nombre:'Junta de Block H100', modelo:['h100'], tipo:'repuesto', precio:20.00, precioOriginal:null, imagenes:['Piezas/Hyundai/Junta de Block Hyundai H100 20 USD .webp'], descripcion:'Junta de block de alta calidad para Hyundai H100. Sella perfectamente el block y garantiza máxima durabilidad.', oferta:false, disponible:true },

  // PEUGEOT
  { marca:'peugeot', nombre:'Filtro de Aceite M20', modelo:['Peugeot'], tipo:'filtro', precio:8.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Filtro Aceite M20.webp'], descripcion:'Filtro de aceite M20 compatible con todos los modelos Peugeot. Filtración eficiente que protege el motor.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Camisas + Pistones XUD9', modelo:['xud9'], tipo:'repuesto', precio:450.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Camisas Pistones.webp'], descripcion:'Kit completo de camisas y pistones para motores Peugeot. Conjunto de alta precisión para máximo rendimiento.', oferta:true, disponible:true },
  { marca:'peugeot', nombre:'Kit Motor DW8', modelo:['dw8'], tipo:'repuesto', precio:300.00, precioOriginal:450.00, imagenes:['Piezas/Peugeot/Piston aros pasador Camisas DW8.webp'], descripcion:'Oferta especial: Kit de pistones, aros, pasadores y camisas para DW8. Máxima compatibilidad y ahorro.', oferta:true, disponible:true },
  { marca:'peugeot', nombre:'Junta de Block Metal', modelo:['dw8','xud9'], tipo:'repuesto', precio:35.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Junta de Block Metal DVV8 XUD9.webp'], descripcion:'Junta de block metal para motores DW8 y XUD9. Altamente resistente a presiones y temperaturas.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Kit Clutch TUD5', modelo:['tud5'], tipo:'repuesto', precio:130.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Kit Clutch TUD5.webp'], descripcion:'Kit completo de embrague para motor TUD5. Incluye disco, plato y rodamiento de empuje.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Kit de Retenes', modelo:['universal'], tipo:'repuesto', precio:35.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Kit de Retenes (peugeot).webp'], descripcion:'Kit completo de retenes para motores Peugeot. Evita fugas de aceite y protege los componentes internos.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Kit Distribución DW8', modelo:['dw8'], tipo:'correa', precio:95.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Kit Distribucion DVV8.webp'], descripcion:'Kit de distribución completo para motor DW8. Incluye correa y tensores de alta durabilidad.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Kit Distribución TUD5', modelo:['tud5'], tipo:'correa', precio:95.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Kit Distribucion TUD5.webp'], descripcion:'Kit de distribución completo para motor TUD5. Garantiza la sincronización perfecta de tu motor.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Kit Distribución XUD', modelo:['xud7','xud9'], tipo:'correa', precio:95.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Kit Distribucion XUD9 XUD7.webp'], descripcion:'Kit de distribución para motores XUD7 y XUD9. Componentes reforzados para larga vida útil.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Líquido Freno 1L', modelo:['Mannol'], tipo:'repuesto', precio:10.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Liquido Freno (1 litro).webp'], descripcion:'Líquido de freno de 1 litro, especificación DOT 4. Alta resistencia térmica para frenado seguro.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Metales Biela y Bancada', modelo:['tud5','xud9','dw8'], tipo:'repuesto', precio:80.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Metales de Biela y Bancada TUD5 XUD9 XUD9turbo DVV8 TU5JP4(301).webp'], descripcion:'Metales de biela y bancada para motores TUD5, XUD9 y DW8. Precisión y resistencia garantizadas.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Metales Turbo / TU5JP4', modelo:['xud9turbo','tu5jp4'], tipo:'repuesto', precio:90.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Metales de Biela y Bancada TUD5 XUD9 XUD9turbo DVV8 TU5JP4(301).webp'], descripcion:'Metales de biela y bancada específicos para motores XUD9 Turbo y TU5JP4 (301).', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Motor de Arranque TUD5', modelo:['tud5','tu5jp4'], tipo:'repuesto', precio:130.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Motor Aranque TUD5 TU5JP4(301).webp'], descripcion:'Motor de arranque compatible con motores TUD5 y TU5JP4. Alta fiabilidad de encendido.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Motor de Arranque XUD/DW', modelo:['xud7','xud9','dw8'], tipo:'repuesto', precio:150.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Motor Aranque XUD9 DVV8 XUD7.webp'], descripcion:'Motor de arranque reforzado para motores XUD7, XUD9 y DW8.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Kit Pistones Aros Pasador', modelo:['tud5','dw8','xud9'], tipo:'repuesto', precio:290.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Piston Aros Pasador TUD5 DVV8 XUD9 (foto1).webp','Piezas/Peugeot/Piston Aros Pasador TUD5 DVV8 XUD9 (foto2).webp'], descripcion:'Kit completo de pistones, aros y pasadores de alta precisión para reconstrucción de motor.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Pulmón Presión Aceite', modelo:['universal'], tipo:'repuesto', precio:15.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Pulmon Pesion Aceite (peugeot).webp'], descripcion:'Sensor de presión de aceite para motores Peugeot. Monitoreo preciso del sistema de lubricación.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Radiador 301', modelo:['301'], tipo:'repuesto', precio:130.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Radiador 301.webp'], descripcion:'Radiador refrigerante para motor Peugeot 301. Máxima eficiencia de enfriamiento térmico.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Retenes de Bastón', modelo:['xud9','dw8'], tipo:'repuesto', precio:10.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Retenes de Baston XUD9 DVV8 (foto2).webp'], descripcion:'Retenes de bastón de alta calidad para motores XUD9 y DW8.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Tornillos Block', modelo:['xud9','dw8'], tipo:'repuesto', precio:50.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Tornillos Block XUD9 DVV8.webp'], descripcion:'Set de tornillos de block de alta resistencia para motores XUD9 y DW8.', oferta:false, disponible:true },
  { marca:'Aceite', nombre:'Aceite Caja Automática 1L', modelo:['Castrol'], tipo:'aceite', precio:12.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Aceite Caja Automatica.webp'], descripcion:'Aceite especializado para cajas de cambio automáticas. Presentación de 1 Litro.', oferta:false, disponible:true },
  { marca:'Aceite', nombre:'Aceite Caja Mecánica 4L', modelo:['Mannol'], tipo:'aceite', precio:25.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Aceite Caja Mecanica (4 litros).webp'], descripcion:'Lubricante para transmisiones manuales. Formato de 4 litros para mantenimiento completo.', oferta:false, disponible:true },
  { marca:'Aceite', nombre:'Aceite Motor 10W-40 1L', modelo:['Fanfaro'], tipo:'aceite', precio:9.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Aceite Motor 10W-40 (1 litro).webp'], descripcion:'Aceite motor semisintético 10W-40. Botella de 1 litro para relleno o servicio.', oferta:false, disponible:true },
  { marca:'Aceite', nombre:'Aceite Motor 15W-40 5L', modelo:['Fanfaro'], tipo:'aceite', precio:20.00, precioOriginal:25.00, imagenes:['Piezas/Peugeot/Aceite Motor 15W-40 (5 litros).webp'], descripcion:'Aceite mineral 15W-40 en formato ahorro de 5 litros. Excelente protección al motor.', oferta:true, disponible:true },
  { marca:'Aceite', nombre:'Aceite Motor 20W-50 1L', modelo:['Fanfaro'], tipo:'aceite', precio:9.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Aceite Motor 20W-50 (1 litro).webp'], descripcion:'Aceite motor 20W-50 para climas cálidos o motores con alto kilometraje. 1 Litro.', oferta:false, disponible:true },
  { marca:'Aceite', nombre:'Aceite Motor 20W-50 5L', modelo:['Fanfaro'], tipo:'aceite', precio:20.00, precioOriginal:25.00, imagenes:['Piezas/Peugeot/Aceite Motor 20W-50 (5 litros).webp'], descripcion:'Aceite motor 20W-50 de alto rendimiento en formato familiar de 5 litros.', oferta:true, disponible:true },
  { marca:'peugeot', nombre:'Arandelas Traslado TUD5', modelo:['tud5'], tipo:'repuesto', precio:20.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Arandelas de Traslado TUD5 XUD9 DVV8 XUD9turbo (foto1).webp'], descripcion:'Arandelas de traslado para motor TUD5. Fabricadas con materiales de alta resistencia.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Arandelas Traslado XUD9/DW8', modelo:['xud9','xud9turbo','dw8'], tipo:'repuesto', precio:25.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Arandelas de Traslado TUD5 XUD9 DVV8 XUD9turbo (foto1).webp'], descripcion:'Arandelas de traslado para motores XUD9, XUD9 Turbo y DW8.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Árbol de Levas', modelo:['xud7','xud9','dw8'], tipo:'repuesto', precio:120.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Arbol Levas XUD7 XUD9 DVV8.webp'], descripcion:'Árbol de levas para motores XUD7, XUD9 y DW8. Acero forjado de alta resistencia.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Bobina Encendida 301', modelo:['301'], tipo:'repuesto', precio:95.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Bobina Encendida 301.webp'], descripcion:'Bobina de encendido de alta tensión para motor 301. Chispa constante y eficiente.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Aros de Pistón Estandar', modelo:['tud5','xud9','dw8'], tipo:'repuesto', precio:85.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Aros de Piston  TUD5 XUD9 XUD9Turbo DVV8 TU5JP4(301).webp'], descripcion:'Aros de pistón de alta calidad. Garantizan sellado perfecto y máxima compresión.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Aros de Pistón TU5JP4', modelo:['tu5jp4'], tipo:'repuesto', precio:100.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Aros de Piston  TUD5 XUD9 XUD9Turbo DVV8 TU5JP4(301).webp'], descripcion:'Aros de pistón específicos para motor TU5JP4. Diseño optimizado para inyección.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Aros de Pistón Turbo', modelo:['xud9turbo'], tipo:'repuesto', precio:95.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Aros de Piston  TUD5 XUD9 XUD9Turbo DVV8 TU5JP4(301).webp'], descripcion:'Aros de pistón para motor XUD9 Turbo. Diseñados para soportar presiones elevadas.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Bomba de Agua TU3', modelo:['t1','tu3'], tipo:'repuesto', precio:35.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Bomba Agua T1 TU3.webp'], descripcion:'Bomba de agua para motores T1 y TU3. Flujo optimizado para evitar calentamiento.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Bomba de Agua TUD5/301', modelo:['tud5','tu5jp4'], tipo:'repuesto', precio:40.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Bomba Agua TUD5 TUD5JP4(301).webp'], descripcion:'Bomba de agua de alta durabilidad para motores TUD5 y TU5JP4.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Brazos Cremallera 301', modelo:['301'], tipo:'repuesto', precio:40.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Brazos Cremallera 301.webp'], descripcion:'Brazos de cremallera de dirección para Peugeot 301. Precisión total en el manejo.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Brazos Cremallera 405', modelo:['405'], tipo:'repuesto', precio:40.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Brazos Cremallera 405.webp'], descripcion:'Brazos de cremallera de dirección específicos para Peugeot 405.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Bujías Precalentamiento', modelo:['xud9'], tipo:'repuesto', precio:35.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Bujias de Precalentamiento XUD9.webp'], descripcion:'Set de bujías para motor diesel XUD9. Garantizan un arranque rápido en frío.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Camisas Cilindro TUD5', modelo:['tud5'], tipo:'repuesto', precio:180.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Camisas TUD5 XUD9 DVV8.webp'], descripcion:'Camisas de cilindro para motor TUD5. Resistencia extrema al desgaste y calor.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Camisas XUD9 / DW8', modelo:['xud9','dw8'], tipo:'repuesto', precio:160.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Camisas TUD5 XUD9 DW8.webp'], descripcion:'Camisas de cilindro para motores XUD9 y DW8. Material de primera calidad OEM.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Cubo de Rueda', modelo:['205','206','207','308','306','307','309','405','406','partner'], tipo:'repuesto', precio:80.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Cubo de Rueda (Peugeo citroent) (foto1) 205 206 207 308 306 307 309 405 406 Partner.webp'], descripcion:'Cubo de rueda compatible con amplia gama de modelos Peugeot y Citroën.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Dampers DW8', modelo:['dw8'], tipo:'repuesto', precio:70.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Dampers DVV8.webp'], descripcion:'Polea Damper para motor DW8. Absorbe vibraciones críticas del cigüeñal.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Electroventilador 301', modelo:['301'], tipo:'repuesto', precio:100.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Electroventilador (peugeot) 301 Citroen.webp'], descripcion:'Electroventilador completo para motor 301 y Citroën compatibles.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Junta Block Amianto', modelo:['tud5'], tipo:'repuesto', precio:25.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Junta Block Amianto TUD5.webp'], descripcion:'Junta de culata/block de amianto clásica para motor TUD5.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Amortiguadores (Par)', modelo:['301','405','205'], tipo:'repuesto', precio:160.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Amortiguadores Delanteros 301 405 205GTI.webp'], descripcion:'Kit de dos amortiguadores delanteros. Máxima estabilidad para varios modelos.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Disco Clutch DW8/XUD9', modelo:['dw8','xud9'], tipo:'repuesto', precio:70.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Disco Clutch DW8 XUD9 (FOTO1).webp'], descripcion:'Disco de embrague reforzado para motores diesel DW8 y XUD9.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Kit Juntas 301', modelo:['301'], tipo:'repuesto', precio:120.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Kit Juntas 301.webp'], descripcion:'Kit completo de empaquetaduras para motor 301. Calidad superior OEM.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Válvula Electrónica', modelo:['Lucas','Bosch'], tipo:'repuesto', precio:35.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Valvula Electronica de Bomba Lucas y Bosch.webp'], descripcion:'Válvula de corte para bombas Lucas y Bosch. Sistemas de inyección Diesel.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Vieleta Suspensión 406', modelo:['406'], tipo:'repuesto', precio:30.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Vieleta Suspension 406.webp'], descripcion:'Vieleta de barra estabilizadora para Peugeot 406. Elimina ruidos en suspensión.', oferta:false, disponible:true },

  // PRODUCTOS FALTANTES
  { marca:'peugeot', nombre:'Cable Clutch 306', modelo:['306'], tipo:'repuesto', precio:30.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Cable Clutch 306.webp'], descripcion:'Cable de embrague de reemplazo para Peugeot 306. Movimiento suave y duradero.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Correa 6PK 17.39', modelo:['Peugeot'], tipo:'correa', precio:25.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Correa 6PK 17.39.webp'], descripcion:'Correa poli-V 6PK 17.39 para varios modelos Peugeot. Transmite potencia del motor de manera eficiente.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Correa Distribución 136/140/141', modelo:['136','140','141'], tipo:'correa', precio:35.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Correa Distribucion136,140,141(foto1).webp','Piezas/Peugeot/Correa Distribucion136,140,141(foto2).webp'], descripcion:'Correa de distribución para modelos 136, 140 y 141. Garantiza sincronización perfecta.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Dampers TUD5', modelo:['tud5'], tipo:'repuesto', precio:70.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Dampers TUD5.webp'], descripcion:'Polea Damper para motor TUD5. Absorbe vibraciones y protege el cigüeñal.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Dampers XUD9/XUD7', modelo:['xud9','xud7'], tipo:'repuesto', precio:70.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Dampers XUD9 XUD7.webp'], descripcion:'Polea Damper para motores XUD9 y XUD7. Componentes premium de alta durabilidad.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Esféricas 301', modelo:['301'], tipo:'repuesto', precio:50.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Esfericas 301.webp'], descripcion:'Esféricas de suspensión para Peugeot 301. Conexiones robustas y precisas.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Filtro Petroleo TUD5', modelo:['tud5'], tipo:'filtro', precio:15.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Filtro Petroleo TUD5.webp'], descripcion:'Filtro de combustible para motor TUD5. Protección contra impurezas en el sistema.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Guías Válvulas DW8/XUD9', modelo:['dw8','xud9'], tipo:'repuesto', precio:50.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Guias Valvulas DW8 XUD9.webp'], descripcion:'Guías de válvulas para motores DW8 y XUD9. Material de precisión extrema.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Junta Balancines XUD9', modelo:['xud9'], tipo:'repuesto', precio:10.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Junta de Balancines XUD9 (foto1).webp','Piezas/Peugeot/Junta de Balancines XUD9 (foto2).webp'], descripcion:'Junta de balancines para motor XUD9. Evita fugas de aceite en la culata.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Junta Block Metal TUD5', modelo:['tud5'], tipo:'repuesto', precio:40.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Junta Block Metal TUD5.webp'], descripcion:'Junta de block metal para motor TUD5. Resistencia superior a presión y temperatura.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Junta Block Amianto DW8/XUD9', modelo:['dw8','xud9'], tipo:'repuesto', precio:25.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Junta de Block Amianto DVV8 XUD9.webp'], descripcion:'Junta de block amianto para motores DW8 y XUD9. Sellado de larga duración.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Junta Block Amianto TU3', modelo:['t1','tu3'], tipo:'repuesto', precio:25.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Junta de Block Amianto TU3 25 USD .webp'], descripcion:'Junta de block amianto para motores T1 y TU3. Compatibilidad perfecta garantizada.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Kit Distribución 301', modelo:['301'], tipo:'correa', precio:95.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Kit Distribucion 301.webp'], descripcion:'Kit completo de distribución para motor 301. Incluye correa, tensores y rodillos.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Obturadores TUD5/XUD9/DW8/TU3', modelo:['tud5','xud9','dw8','t1','tu3'], tipo:'repuesto', precio:15.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Obturadores TUD5 XUD9 DW8 TU3.webp'], descripcion:'Obturadores universales para varios motores Peugeot. Cierres hermético seguros.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Parrillas 301', modelo:['301'], tipo:'repuesto', precio:140.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Parrillas 301.webp'], descripcion:'Parrilla/rejilla frontal para Peugeot 301. Acabado cromado y resistente.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Radiador 205', modelo:['205'], tipo:'repuesto', precio:100.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Radiador 205.webp'], descripcion:'Radiador refrigerante para Peugeot 205. Mantiene temperatura óptima del motor.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Rodamiento Delantero Universal', modelo:['universal'], tipo:'repuesto', precio:50.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Rodamiento Delantero Universal CITROEN.webp'], descripcion:'Rodamiento de rueda frontal universal para Peugeot y Citroën. Precisión de giro superior.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Rodamiento Delantero', modelo:['405'], tipo:'repuesto', precio:60.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Rodamiento Delantero Universal CITROEN.webp'], descripcion:'Rodamiento delantero para modelo 405. La pareja: 60 USD', disponible: true },
  { marca:'peugeot', nombre:'Tensor Dinámico XUD9', modelo:['xud9'], tipo:'repuesto', precio:40.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Tensor Dinamico XUD9 (FOTO1).webp'], descripcion:'Tensor dinámico para motor XUD9. Mantiene la tensión correcta de la distribución.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Válvulas XUD9/DW8', modelo:['xud9','dw8'], tipo:'repuesto', precio:50.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Valvulas XUD9 DW8 TUD5.webp'], descripcion:'Set de válvulas para motores XUD9, DW8 y TUD5. Calidad OEM premium.', oferta:false, disponible:true },
  { marca:'peugeot', nombre:'Válvulas TUD5', modelo:['tud5'], tipo:'repuesto', precio:85.00, precioOriginal:null, imagenes:['Piezas/Peugeot/Valvulas XUD9 DW8 TUD5.webp'], descripcion:'Kit de válvulas para motor TUD5. Fabricadas con precisión de fábrica.', oferta:false, disponible:true }
];

/* ── ESTADO GLOBAL ──────────────────────────────────────────── */
const state = {
  filteredProducts: [...productos],
  currentPage:      0,
  isLoading:        false,
  activeFilter:     { tipo: 'todos', valor: 'todos' },
  modalProduct:     null,
  modalImgIdx:      0,
};

/* ── REFS DOM ───────────────────────────────────────────────── */
const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ── UTILIDADES ─────────────────────────────────────────────── */
const formatPrice = n => `$${Number(n).toFixed(2)}`;

const normalize = str =>
  String(str).toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const showToast = msg => {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
};

const buildWAMessage = ({ nombre, marca, modelo, precio }) => {
  const modelStr = Array.isArray(modelo) ? modelo.join(', ') : modelo;
  return encodeURIComponent(
    `Hola DLG Autopartes! 👋\n\nMe interesa este repuesto:\n\n` +
    `🔧 *${nombre}*\n` +
    `🚗 Marca: ${marca.charAt(0).toUpperCase() + marca.slice(1)}\n` +
    `📋 Modelos: ${modelStr}\n` +
    `💰 Precio: ${formatPrice(precio)}\n\n` +
    `¿Está disponible?`
  );
};

/* ── LAZY LOAD IMÁGENES ─────────────────────────────────────── */
// PERF: en conexiones lentas rootMargin pequeño → solo carga lo visible
// En conexiones rápidas precarga 200px adelante
const lazyObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return;
    const src = target.dataset.src;
    if (!src) return;
    target.src = src;
    target.removeAttribute('data-src');
    obs.unobserve(target);
  });
}, { rootMargin: isSlowConnection ? '50px 0px' : '200px 0px', threshold: 0 });

const observeLazyImages = () => {
  $$('img[data-src]').forEach(img => lazyObserver.observe(img));
};

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3C/svg%3E`;

/* ── PRECARGA DE IMÁGENES POR BÚSQUEDA ─────────────────────── */
const preloadSearchImages = query => {
  if (!query || query.length < 2) return;
  const normalized = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = normalized.split(/\s+/).filter(Boolean);
  
  const toPreload = productos
    .filter(p => {
      const haystack = `${p.nombre} ${p.marca} ${p.modelo.join(' ')}`.toLowerCase();
      return words.some(w => haystack.includes(w));
    })
    .slice(0, 6)
    .flatMap(p => p.imagenes);
  
  toPreload.forEach(src => {
    if (!src) return;
    const img = new Image();
    img.src = src;
  });
};

/* ── HISTORIAL URL ──────────────────────────────────────────── */
const pushState = (params = {}) => {
  const url = new URL(window.location);
  ['marca', 'modelo', 'motor', 'tipo', 'q'].forEach(k => url.searchParams.delete(k));
  if (params.marca  && params.marca  !== 'todos') url.searchParams.set('marca',  params.marca);
  if (params.modelo && params.modelo !== 'todos') url.searchParams.set('modelo', params.modelo);
  if (params.motor  && params.motor  !== 'todos') url.searchParams.set('motor',  params.motor);
  if (params.tipo   && params.tipo   !== 'todos') url.searchParams.set('tipo',   params.tipo);
  if (params.q) url.searchParams.set('q', params.q);
  history.pushState(params, '', url.toString());
};

const applyStateFromURL = () => {
  const url    = new URL(window.location);
  const marca  = url.searchParams.get('marca');
  const modelo = url.searchParams.get('modelo');
  const motor  = url.searchParams.get('motor');
  const tipo   = url.searchParams.get('tipo');
  const q      = url.searchParams.get('q');

  if (q) {
    syncBuscadores(q, '');
    filterBySearch(q);
    return;
  }
  if (motor) {
    const chip = document.querySelector(`.chip[data-motor="${motor}"]`);
    if (chip) { activateChip(chip); filterByMotor(motor); }
    return;
  }
  if (tipo && marca) {
    const chip = document.querySelector(`.chip[data-tipo="${tipo}"][data-marca="${marca}"]`);
    if (chip) { activateChip(chip); filterByTipo(tipo, marca); }
    return;
  }
  if (modelo) {
    const chip = document.querySelector(`.chip[data-modelo="${modelo}"]`);
    if (chip) { activateChip(chip); filterByModelo(modelo); }
    return;
  }
  if (marca) {
    const chip = document.querySelector(`.chip[data-marca="${marca}"]`);
    if (chip) { activateChip(chip); filterByMarca(marca); }
    return;
  }
  resetFiltersUI();
  state.filteredProducts = [...productos];
  renderCatalogo();
};

/* ── FILTROS UI ─────────────────────────────────────────────── */
const activateChip = chip => {
  $$('.chip').forEach(c => {
    c.classList.remove('active');
    c.setAttribute('aria-pressed', 'false');
  });
  chip.classList.add('active');
  chip.setAttribute('aria-pressed', 'true');
};

const resetFiltersUI = () => {
  $$('.chip').forEach(c => {
    c.classList.remove('active');
    c.setAttribute('aria-pressed', 'false');
  });
  const todos = document.querySelector('.chip[data-marca="todos"]');
  if (todos) { todos.classList.add('active'); todos.setAttribute('aria-pressed', 'true'); }
};

/* ── FILTRAR PRODUCTOS ──────────────────────────────────────── */
const filterByMarca = marca => {
  state.filteredProducts = marca === 'todos'
    ? [...productos]
    : productos.filter(p => p.marca === marca);
  renderCatalogo();
};

const filterByModelo = modelo => {
  const ref = normalize(modelo);
  state.filteredProducts = productos.filter(p =>
    Array.isArray(p.modelo) && p.modelo.some(m => normalize(m) === ref)
  );
  renderCatalogo();
};

const filterByMotor = motor => {
  const ref = normalize(motor);
  state.filteredProducts = productos.filter(p =>
    Array.isArray(p.modelo) && p.modelo.some(m => normalize(m) === ref)
  );
  renderCatalogo();
};

const filterByTipo = (tipo, marca) => {
  state.filteredProducts = productos.filter(p =>
    p.tipo === tipo && p.marca === marca
  );
  renderCatalogo();
};

/* ── BÚSQUEDA FUZZY ─────────────────────────────────────────── */
const fuzzyScore = (p, query) => {
  const words   = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = normalize(`${p.nombre} ${p.marca} ${p.modelo.join(' ')} ${p.descripcion}`);
  let score = 0;
  words.forEach(w => {
    if (haystack.includes(w)) score += 3;
    else {
      const chars = [...new Set(w.split(''))];
      chars.forEach(c => { if (haystack.includes(c)) score += 0.3; });
    }
  });
  return score;
};

const getSimilarProducts = query => {
  const normalizedQuery = normalize(query);
  const chars = [...new Set(normalizedQuery.split(''))];
  return productos
    .map(p => {
      const haystack = normalize(`${p.nombre} ${p.marca} ${p.modelo.join(' ')} ${p.descripcion}`);
      let score = 0;
      chars.forEach(c => { if (haystack.includes(c)) score += 1; });
      normalizedQuery.split(/\s+/).forEach(w => {
        if (w.length >= 2 && haystack.includes(w.substring(0, w.length - 1))) score += 3;
      });
      return { p, score };
    })
    .filter(({ score }) => score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
};

const filterBySearch = query => {
  if (!query.trim()) {
    state.filteredProducts = [...productos];
    renderCatalogo();
    return;
  }
  const results = productos
    .map(p => ({ p, score: fuzzyScore(p, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ p }) => p);

  if (results.length === 0) {
    const similar = getSimilarProducts(query);
    if (similar.length > 0) {
      state.filteredProducts = similar.map(x => x.p);
      renderCatalogo();
      showToast('Mostrando productos similares');
      return;
    }
  }
  state.filteredProducts = results;
  renderCatalogo();
};

/* ── SINCRONIZAR BUSCADORES ─────────────────────────────────── */
const syncBuscadores = (valor, origenId) => {
  ['buscador-desktop', 'buscador-mobile'].forEach(id => {
    const el = $(id);
    if (el && el.id !== origenId) el.value = valor;
  });
  // Botones clear
  $('clear-desktop').hidden = !$('buscador-desktop').value;
  $('clear-mobile').hidden  = !$('buscador-mobile').value;
};

/* ── RENDER TARJETA PRODUCTO ────────────────────────────────── */
const createCard = p => {
  const article = document.createElement('article');
  article.className = 'p-card';
  article.setAttribute('role', 'listitem');
  article.setAttribute('tabindex', '0');
  article.setAttribute('aria-label', `${p.nombre}, ${formatPrice(p.precio)}`);

  const precioHTML = p.precioOriginal
    ? `<span class="p-card-precio">${formatPrice(p.precio)}</span>
       <span class="p-card-precio-og">${formatPrice(p.precioOriginal)}</span>`
    : `<span class="p-card-precio">${formatPrice(p.precio)}</span>`;

  article.innerHTML = `
    <div class="p-card-img-wrap">
      <img
        class="p-card-img"
        data-src="${p.imagenes[0]}"
        src="${PLACEHOLDER}"
        alt="${p.nombre}"
        width="400" height="400"
        loading="lazy"
      />
      ${p.oferta ? '<span class="p-card-badge-oferta" aria-label="Producto en oferta">Oferta</span>' : ''}
      ${!p.disponible ? `<div class="p-card-no-disp-overlay" aria-hidden="true"><span>No Disponible</span></div>` : ''}
    </div>
    <div class="p-card-body">
      <div class="p-card-marca">${p.marca}</div>
      <div class="p-card-nombre">${p.nombre}</div>
      <div class="p-card-modelos" title="${p.modelo.join(', ')}">${p.modelo.join(' · ')}</div>
      <div class="p-card-precio-wrap">${precioHTML}</div>
      <span class="p-card-disp ${p.disponible ? 'si' : 'no'}" aria-label="${p.disponible ? 'Disponible' : 'No disponible'}">
        ${p.disponible ? 'Disponible' : 'No Disponible'}
      </span>
  
    </div>
  `;

  const open = () => openModal(p);
  article.addEventListener('click', open);
  article.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open()));
  

  return article;
};

/* ── LAZY LOAD / INFINITE SCROLL ────────────────────────────── */
const loadNextPage = () => {
  if (state.isLoading) return;
  const start = state.currentPage * CONFIG.PAGE_SIZE;
  const slice = state.filteredProducts.slice(start, start + CONFIG.PAGE_SIZE);
  if (!slice.length) { $('sentinel').style.display = 'none'; return; }

  state.isLoading = true;
  const grid = $('catalogo-grid');
  const frag = document.createDocumentFragment();
  slice.forEach(p => frag.appendChild(createCard(p)));
  grid.appendChild(frag);
  observeLazyImages();

  state.currentPage++;
  state.isLoading = false;

  if (state.currentPage * CONFIG.PAGE_SIZE >= state.filteredProducts.length) {
    $('sentinel').style.display = 'none';
  }
};

const sentinelObserver = new IntersectionObserver(
  entries => { if (entries[0].isIntersecting) loadNextPage(); },
  { rootMargin: '300px' }
);
sentinelObserver.observe($('sentinel'));

/* ── RENDER CATÁLOGO ────────────────────────────────────────── */
let lastSearchQuery = '';

const renderCatalogo = () => {
  state.currentPage = 0;
  $('catalogo-grid').innerHTML = '';
  $('sentinel').style.display  = 'flex';

  $('total-badge').textContent = `${state.filteredProducts.length} pieza${state.filteredProducts.length !== 1 ? 's' : ''}`;

  if (!state.filteredProducts.length) {
    $('sentinel').style.display  = 'none';
    return;
  }

  loadNextPage();
};

/* ── CARRUSEL DE OFERTAS ────────────────────────────────────── */
const buildCarousel = () => {
  const ofertas = productos
    .filter(p => p.oferta)
    .sort(() => Math.random() - .5)
    .slice(0, CONFIG.CAROUSEL_MAX);

  if (!ofertas.length) {
    $('ofertas-section').hidden = true;
    return;
  }

  const track = $('carousel-track');
  track.innerHTML = ofertas.map((p, i) => {
    const precioOgHTML = p.precioOriginal
      ? `<span class="c-card-price-original">${formatPrice(p.precioOriginal)}</span>`
      : '';
    return `
      <article class="c-card" role="listitem" tabindex="0"
               aria-label="${p.nombre}, ${formatPrice(p.precio)}${p.precioOriginal ? ', antes ' + formatPrice(p.precioOriginal) : ''}"
               data-idx="${i}">
        <div class="c-card-img-wrap">
          <img class="c-card-img"
               data-src="${p.imagenes[0]}"
               src="${PLACEHOLDER}"
               alt="${p.nombre}"
               width="400" height="400" loading="lazy" />
        </div>
        <div class="c-card-body">
          <div class="c-card-name">${p.nombre}</div>
          <div>
            <span class="c-card-price">${formatPrice(p.precio)}</span>${precioOgHTML}
          </div>
          <span class="c-card-badge">Oferta</span>
        </div>
      </article>
    `;
  }).join('');

  // Eventos tarjetas carrusel
  track.querySelectorAll('.c-card').forEach((card, i) => {
    const open = () => openModal(ofertas[i]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open()));
  });

  observeLazyImages();

  // Botones navegación PC
  // Medir ancho real de tarjeta + gap
  const getScrollAmount = () => {
    const firstCard = track.querySelector('.c-card');
    if (!firstCard) return 200;
    return (firstCard.offsetWidth + 10) * 2; // 2 tarjetas
  };

  $('btn-prev').addEventListener('click', () =>
    track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' })
  );
  $('btn-next').addEventListener('click', () =>
    track.scrollBy({ left:  getScrollAmount(), behavior: 'smooth' })
  );
};

/* ── MODAL ──────────────────────────────────────────────────── */
let modalTouchStartX = 0;

const openModal = p => {
  state.modalProduct = p;
  state.modalImgIdx  = 0;

  // Imagen principal
  $('modal-img').src = p.imagenes[0];
  $('modal-img').alt = p.nombre;

  // Dots galería
  const dotsEl = $('modal-dots');
  dotsEl.innerHTML = p.imagenes.length > 1
    ? p.imagenes.map((_, i) => `
        <button class="m-dot ${i === 0 ? 'active' : ''}"
                data-i="${i}"
                role="tab"
                aria-label="Imagen ${i + 1} de ${p.imagenes.length}"
                aria-selected="${i === 0}">
        </button>
      `).join('')
    : '';

  dotsEl.querySelectorAll('.m-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      state.modalImgIdx = +dot.dataset.i;
      $('modal-img').src = p.imagenes[state.modalImgIdx];
      dotsEl.querySelectorAll('.m-dot').forEach((d, i) => {
        d.classList.toggle('active', i === state.modalImgIdx);
        d.setAttribute('aria-selected', i === state.modalImgIdx);
      });
    });
  });

  // Contenido
  $('modal-marca').textContent = p.marca.charAt(0).toUpperCase() + p.marca.slice(1);

  const dispEl = $('modal-disp');
  dispEl.textContent = p.disponible ? 'Disponible' : 'No disponible';
  dispEl.className   = `modal-disponibilidad ${p.disponible ? 'si' : 'no'}`;

  $('modal-nombre').textContent = p.nombre;

  // Precios
  const preciosEl = $('modal-precios');
  if (p.precioOriginal) {
    const pct = Math.round((1 - p.precio / p.precioOriginal) * 100);
    preciosEl.innerHTML = `
      <span class="modal-precio-actual">${formatPrice(p.precio)}</span>
      <span class="modal-precio-og">${formatPrice(p.precioOriginal)}</span>
      <span class="modal-descuento">-${pct}%</span>
    `;
  } else {
    preciosEl.innerHTML = `<span class="modal-precio-actual">${formatPrice(p.precio)}</span>`;
  }

  // Modelos
  $('modal-modelos').innerHTML = p.modelo
    .map(m => `<span class="modal-tag">${m}</span>`)
    .join('');

  $('modal-desc').textContent = p.descripcion || '—';

  // WhatsApp
  $('btn-whatsapp').href = `https://wa.me/${CONFIG.WA_NUMBER}?text=${buildWAMessage(p)}`;

  // Abrir overlay
  const overlay = $('modal-overlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus trap
  setTimeout(() => $('modal').focus(), 50);
};

const closeModal = () => {
  const overlay = $('modal-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state.modalProduct = null;
};

$('modal-close').addEventListener('click', closeModal);
$('modal-overlay').addEventListener('click', e => {
  if (e.target === $('modal-overlay')) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Swipe en modal para cambiar imágenes
$('modal').addEventListener('touchstart', e => {
  modalTouchStartX = e.touches[0].clientX;
}, { passive: true });

$('modal').addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - modalTouchStartX;
  const p  = state.modalProduct;
  if (!p || p.imagenes.length < 2 || Math.abs(dx) < 50) return;

  if (dx < 0 && state.modalImgIdx < p.imagenes.length - 1) state.modalImgIdx++;
  else if (dx > 0 && state.modalImgIdx > 0) state.modalImgIdx--;
  else return;

  $('modal-img').src = p.imagenes[state.modalImgIdx];
  $('modal-dots').querySelectorAll('.m-dot').forEach((d, i) => {
    d.classList.toggle('active', i === state.modalImgIdx);
    d.setAttribute('aria-selected', i === state.modalImgIdx);
  });
});

/* ── EVENTOS BUSCADORES ─────────────────────────────────────── */
let searchTimer;

const handleSearch = (valor, id) => {
  clearTimeout(searchTimer);
  syncBuscadores(valor, id);

  if (!valor.trim()) {
    lastSearchQuery = '';
    resetFiltersUI();
    pushState({});
    state.filteredProducts = [...productos];
    renderCatalogo();
    return;
  }

  searchTimer = setTimeout(() => {
    lastSearchQuery = valor.trim();
    resetFiltersUI();
    pushState({ q: valor.trim() });
    filterBySearch(valor.trim());
    preloadSearchImages(valor.trim());
  }, CONFIG.SEARCH_DELAY);
};

$('buscador-desktop').addEventListener('input', function () {
  handleSearch(this.value, this.id);
});
$('buscador-mobile').addEventListener('input', function () {
  handleSearch(this.value, this.id);
});

// Botones clear
$('clear-desktop').addEventListener('click', () => {
  $('buscador-desktop').value = '';
  handleSearch('', 'buscador-desktop');
  $('buscador-desktop').focus();
});
$('clear-mobile').addEventListener('click', () => {
  $('buscador-mobile').value = '';
  handleSearch('', 'buscador-mobile');
  $('buscador-mobile').focus();
});

// Mostrar/ocultar clear button
['buscador-desktop', 'buscador-mobile'].forEach(id => {
  $(id).addEventListener('input', function () {
    const clearId = id === 'buscador-desktop' ? 'clear-desktop' : 'clear-mobile';
    $(clearId).hidden = !this.value;
  });
});

/* ── EVENTOS FILTROS ────────────────────────────────────────── */
$('filters-scroll').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  activateChip(chip);
  syncBuscadores('', ''); // limpiar búsqueda
  $$('.buscador').forEach(b => b.value = '');
  $$('[id^="clear-"]').forEach(b => b.hidden = true);

  const marca  = chip.dataset.marca;
  const modelo = chip.dataset.modelo;
  const motor  = chip.dataset.motor;
  const tipo   = chip.dataset.tipo;

  if (motor) {
    const padre = chip.dataset.padre || '';
    pushState(padre && padre !== 'todos' ? { marca: padre, motor } : { motor });
    filterByMotor(motor);
  } else if (tipo && marca) {
    pushState({ marca, tipo });
    filterByTipo(tipo, marca);
  } else if (marca) {
    pushState(marca !== 'todos' ? { marca } : {});
    filterByMarca(marca);
  } else if (modelo) {
    const padre = chip.dataset.padre || '';
    pushState({ marca: padre, modelo });
    filterByModelo(modelo);
  }
});

/* ── BUSCADOR MÓVIL TOGGLE ──────────────────────────────────── */
$('btn-search-mobile').addEventListener('click', function () {
  const bar      = $('mobile-search-bar');
  const isOpen   = bar.classList.toggle('open');
  this.setAttribute('aria-expanded', isOpen);
  bar.setAttribute('aria-hidden', !isOpen);
  if (isOpen) setTimeout(() => $('buscador-mobile').focus(), 320);
});

/* ── MENÚ HAMBURGER ─────────────────────────────────────────── */
const openMenu = () => {
  $('mobile-menu').classList.add('open');
  $('menu-overlay').classList.add('open');
  $('mobile-menu').setAttribute('aria-hidden', 'false');
  $('menu-overlay').setAttribute('aria-hidden', 'false');
  $('btn-menu').classList.add('open');
  $('btn-menu').setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
};
const closeMenu = () => {
  $('mobile-menu').classList.remove('open');
  $('menu-overlay').classList.remove('open');
  $('mobile-menu').setAttribute('aria-hidden', 'true');
  $('menu-overlay').setAttribute('aria-hidden', 'true');
  $('btn-menu').classList.remove('open');
  $('btn-menu').setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

$('btn-menu').addEventListener('click', () =>
  $('mobile-menu').classList.contains('open') ? closeMenu() : openMenu()
);
$('btn-close-menu').addEventListener('click', closeMenu);
$('menu-overlay').addEventListener('click', closeMenu);
$('mobile-menu').querySelectorAll('.menu-link').forEach(l =>
  l.addEventListener('click', closeMenu)
);

/* ── BACK BUTTON / POPSTATE ─────────────────────────────────── */
window.addEventListener('popstate', () => {
  // Cerrar modal si está abierto
  if ($('modal-overlay').classList.contains('open')) {
    closeModal();
    return;
  }
  applyStateFromURL();
});

/* ── SCROLL TO TOP ──────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const btn = $('scroll-top');
  if (window.scrollY > 450) btn.removeAttribute('hidden');
  else btn.setAttribute('hidden', '');
}, { passive: true });

$('scroll-top').addEventListener('click', () =>
  window.scrollTo({ top: 0, behavior: 'smooth' })
);

/* ── INIT ───────────────────────────────────────────────────── */
const init = () => {
  buildCarousel();
  applyStateFromURL(); // leer URL al cargar (links compartidos)
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
/* ════════════════════════════════════════════════════════════════
   DLG AUTOPARTES — script.js  ADICIONES
   Pega todo este bloque al FINAL de tu script.js existente
════════════════════════════════════════════════════════════════ */

/* ── DARK MODE ───────────────────────────────────────────────── */
const applyTheme = theme => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('dlg-theme', theme);

  const btn = $('btn-theme');
  if (!btn) return;
  if (theme === 'dark') {
    btn.setAttribute('aria-label', 'Cambiar a modo claro');
    btn.title = 'Modo claro';
  } else {
    btn.setAttribute('aria-label', 'Cambiar a modo oscuro');
    btn.title = 'Modo oscuro';
  }
};

const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
};

const initTheme = () => {
  const saved       = localStorage.getItem('dlg-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
};

const btnTheme = $('btn-theme');
if (btnTheme) btnTheme.addEventListener('click', toggleTheme);

// Sincronizar si el usuario cambia la preferencia del SO mientras tiene la pestaña abierta
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (!localStorage.getItem('dlg-theme')) {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});

const resetearBusqueda = () => {
  ['buscador-desktop', 'buscador-mobile'].forEach(id => {
    const el = $(id);
    if (el) el.value = '';
  });
  $$('[id^="clear-"]').forEach(b => { if (b) b.hidden = true; });
  lastSearchQuery = '';
  resetFiltersUI();
  pushState({});
  state.filteredProducts = [...productos];
  renderCatalogo();
};

/* ── APPLE MAPS — solo visible en iOS ───────────────────────── */
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const btnApple = $('btn-apple-maps');
if (btnApple) {
  if (isIOS) {
    btnApple.classList.add('visible');
  }
  // En iOS usamos el scheme maps://, en otros Apple devices usamos https://maps.apple.com
  if (isIOS) {
    btnApple.href = 'maps://?q=DLG+Autopartes&ll=23.076917,-82.429631&z=16';
  }
}