/* ════════════════════════════════════════════════════════════════
   DLG AUTOPARTES — script.js
   Vanilla ES6+ · Mobile-First · PWA
════════════════════════════════════════════════════════════════ */

'use strict';

console.log('DLG script loaded');

/* ── CONFIGURACIÓN ──────────────────────────────────────────── */
const CONFIG = {
  WA_NUMBER:    '5352531473',  // ← número real Cuba
  PAGE_SIZE:    5,             // PERF: 4 tarjetas/batch → menos DOM en 16kbps
  SEARCH_DELAY: 400,           // ms debounce búsqueda (un poco más en conexiones lentas)
  CAROUSEL_MAX: 10,
  SITE_URL:     'https://catalogo-piezas.vercel.app', // ← tu dominio real en Vercel
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
/* Ahora vive en productos-data.js (cargado antes que este script). */

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

/* ── COMPARTIR PRODUCTO INDIVIDUAL ──────────────────────────────
    La URL del producto usa query param (?producto=slug).
    Vercel sirve index.html como función serverless (api/index.js)
    que inyecta las metaetiquetas OG al vuelo cuando
    se accede con ?producto=slug. Así Facebook y WhatsApp
    muestran la vista previa correcta sin archivos HTML
    individuales por producto. */
const getProductShareURL = p => `${CONFIG.SITE_URL}/?producto=${p.slug}`;

const buildShareText = p =>
  `🔧 ${p.nombre}\n💰 ${formatPrice(p.precio)}\n${p.descripcion}`;

const shareToWhatsApp = p => {
  const url = getProductShareURL(p);
  window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
};

const shareToFacebook = p => {
  const url = encodeURIComponent(getProductShareURL(p));
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer,width=600,height=600');
};

const copyProductLink = async p => {
  const url = getProductShareURL(p);
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      const tmp = document.createElement('textarea');
      tmp.value = url;
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
    }
    showToast('Enlace copiado ✅');
  } catch {
    showToast('No se pudo copiar el enlace');
  }
};

/* ── MENÚ DE COMPARTIR (portal único) ───────────────────────────
   Las tarjetas tienen `overflow: hidden` (para el zoom de la imagen),
   así que un menú desplegable dentro de la tarjeta quedaría
   recortado. Por eso se usa un único menú "flotante" reutilizable,
   insertado directamente en <body> y posicionado con `position:fixed`
   junto al botón que lo abrió. */
let shareMenuEl = null;
let shareMenuProduct = null;

const getShareMenuEl = () => {
  if (shareMenuEl) return shareMenuEl;
  const menu = document.createElement('div');
  menu.className = 'p-card-share-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `
    <button type="button" class="share-item share-wa" role="menuitem">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="currentColor" d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4C11 9.9 10.5 8.6 10.3 8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.4 2.3.9 2.3.6 2.7.6.4 0 1.3-.5 1.5-1s.2-.9.1-1c0-.2-.2-.2-.5-.4Z"/><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Z"/></svg>
      WhatsApp
    </button>
    <button type="button" class="share-item share-fb" role="menuitem">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3H13.5V8.4c0-.9.2-1.5 1.5-1.5h1.6V4.2C16.3 4.1 15.3 4 14.2 4c-2.4 0-4 1.5-4 4.1v2.3H7.6v3h2.6V21h3.3Z"/></svg>
      Facebook
    </button>
    <button type="button" class="share-item share-copy" role="menuitem">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copiar enlace
    </button>
  `;
  menu.querySelector('.share-wa').addEventListener('click', e => {
    e.stopPropagation();
    if (shareMenuProduct) shareToWhatsApp(shareMenuProduct);
    closeAllShareMenus();
  });
  menu.querySelector('.share-fb').addEventListener('click', e => {
    e.stopPropagation();
    if (shareMenuProduct) shareToFacebook(shareMenuProduct);
    closeAllShareMenus();
  });
  menu.querySelector('.share-copy').addEventListener('click', e => {
    e.stopPropagation();
    if (shareMenuProduct) copyProductLink(shareMenuProduct);
    closeAllShareMenus();
  });
  menu.addEventListener('click', e => e.stopPropagation());
  document.body.appendChild(menu);
  shareMenuEl = menu;
  return menu;
};

const closeAllShareMenus = () => {
  if (shareMenuEl) shareMenuEl.classList.remove('open');
  $$('.p-card-share-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  shareMenuProduct = null;
};

const openShareMenuFor = (btn, p) => {
  const menu = getShareMenuEl();
  const wasOpenForSameProduct = menu.classList.contains('open') && shareMenuProduct === p;
  closeAllShareMenus();
  if (wasOpenForSameProduct) return; // toggle: click de nuevo en el mismo botón lo cierra

  shareMenuProduct = p;

  const rect = btn.getBoundingClientRect();
  const menuWidth = 180; // debe coincidir con min-width de .p-card-share-menu
  let left = rect.right - menuWidth;
  left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
  let top = rect.bottom + 6;
  if (top + 160 > window.innerHeight) top = rect.top - 166; // abrir hacia arriba si no cabe abajo

  menu.style.left = `${left}px`;
  menu.style.top  = `${top}px`;
  menu.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
};

document.addEventListener('click', e => {
  if (!e.target.closest('.p-card-share-btn') && !e.target.closest('.p-card-share-menu')) closeAllShareMenus();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllShareMenus(); });
window.addEventListener('scroll', closeAllShareMenus, { passive: true });
window.addEventListener('resize', closeAllShareMenus);

/* Crea solo el botón de compartir para una tarjeta (el menú es compartido/global) */

/* En Android (Chrome/Samsung/Firefox) y en iPhone/iPad Safari (iOS 12.2+)
   existe el "share sheet" nativo del sistema operativo: es la misma
   ventana que aparece al compartir un Reel o un post de Facebook, con
   WhatsApp, Mensajes, Facebook, etc. ya listados. Cuando está disponible
   lo usamos SIEMPRE en vez del menú propio, porque:
   - Es más rápido y nativo (no hay que enseñarle nada al usuario).
   - Es lo único 100% confiable dentro de Safari en iOS, donde los menús
     flotantes personalizados a veces fallan por la barra dinámica.
   El link que se comparte sigue siendo la página estática del producto,
   así que la vista previa con foto + precio + descripción aparece igual
   la reciba quien la reciba. */
const canUseNativeShare = typeof navigator.share === 'function';

const shareProductNative = async p => {
  const url = getProductShareURL(p);
  try {
    await navigator.share({
      title: p.nombre,
      url,
    });
  } catch (err) {
    if (err && err.name !== 'AbortError') showToast('No se pudo compartir');
  }
};

const createShareBlock = p => {
  const wrap = document.createElement('div');
  wrap.className = 'p-card-share-wrap';

  wrap.innerHTML = `
    <button type="button" class="p-card-share-btn" aria-haspopup="${canUseNativeShare ? 'false' : 'true'}" aria-expanded="false" aria-label="Compartir ${p.nombre}">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.6" y1="10.6" x2="15.4" y2="6.4"/><line x1="8.6" y1="13.4" x2="15.4" y2="17.6"/>
      </svg>
    </button>
  `;

  const btn = wrap.querySelector('.p-card-share-btn');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (canUseNativeShare) {
      shareProductNative(p);
    } else {
      openShareMenuFor(btn, p); // respaldo: navegadores de escritorio sin share sheet
    }
  });

  // Evita que un click en el botón de compartir abra el modal de la tarjeta
  wrap.addEventListener('click', e => e.stopPropagation());

  return wrap;
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
  const url      = new URL(window.location);
  const marca    = url.searchParams.get('marca');
  const modelo   = url.searchParams.get('modelo');
  const motor    = url.searchParams.get('motor');
  const tipo     = url.searchParams.get('tipo');
  const q        = url.searchParams.get('q');
  const producto = url.searchParams.get('producto'); // viene de un enlace compartido (WhatsApp/Facebook/copiado)

  if (producto) {
    resetFiltersUI();
    state.filteredProducts = [...productos];
    renderCatalogo();
    const p = productos.find(prod => prod.slug === producto);
    if (p) openModal(p);
    return;
  }

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
       <span class="p-card-disp ${p.disponible ? 'si' : p.disponibleDesde ? 'soon' : 'no'}" aria-label="${p.disponible ? 'Disponible' : p.disponibleDesde ? 'Disponible desde ' + p.disponibleDesde : 'No disponible'}">
         ${p.disponible ? 'Disponible' : p.disponibleDesde ? 'Disponible a partir del ' + p.disponibleDesde : 'No Disponible'}
       </span>
    
     </div>
  `;

  article.querySelector('.p-card-img-wrap').appendChild(createShareBlock(p));

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
   dispEl.textContent = p.disponible ? 'Disponible' : p.disponibleDesde ? 'Disponible a partir del ' + p.disponibleDesde : 'No disponible';
   dispEl.className   = `modal-disponibilidad ${p.disponible ? 'si' : p.disponibleDesde ? 'soon' : 'no'}`;


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

  // Compartir (mismo bloque reutilizado que en la tarjeta)
  const shareWrap = $('modal-share-wrap');
  shareWrap.innerHTML = '';
  shareWrap.appendChild(createShareBlock(p));

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

$('buscador-desktop').addEventListener('keyup', function () {
  console.log('buscador-desktop keyup:', this.value);
  handleSearch(this.value, this.id);
});
$('buscador-mobile').addEventListener('keyup', function () {
  console.log('buscador-mobile keyup:', this.value);
  handleSearch(this.value, this.id);
});

// Debug sin debounce para verificar si la función funciona
$('buscador-desktop').addEventListener('keyup', function () {
  console.log('DEBUG direct search:', this.value);
  if (this.value.trim()) {
    const results = productos.filter(p => 
      p.nombre.toLowerCase().includes(this.value.toLowerCase()) ||
      p.marca.toLowerCase().includes(this.value.toLowerCase())
    );
    console.log('DEBUG results:', results.length);
    state.filteredProducts = results;
    renderCatalogo();
  }
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
  console.log('btn-search-mobile clicked');
  const bar      = $('mobile-search-bar');
  const isOpen   = bar.classList.toggle('open');
  console.log('mobile-search-bar open:', isOpen);
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
  console.log('DLG init started');
  console.log('btn-search-mobile:', $('btn-search-mobile'));
  console.log('mobile-search-bar:', $('mobile-search-bar'));
  buildCarousel();
  applyStateFromURL(); // leer URL al cargar (links compartidos)
  console.log('DLG init complete');
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