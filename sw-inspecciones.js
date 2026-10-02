// ─────────────────────────────────────────────────────────────────────────
// Service Worker — Inspeccionador CR Consulting
// Sube este archivo a la MISMA carpeta que tu inspecciones.html (GitHub
// Pages). Solo cachea el "cascarón" de la app (HTML/CSS/fuentes/íconos) para
// que el navegador pueda abrirla sin conexión. Nunca cachea llamadas al
// backend de Apps Script: esas siempre van a la red (o fallan explícito, y
// el propio inspecciones.html se encarga de guardar los cambios localmente).
// ─────────────────────────────────────────────────────────────────────────
const CACHE = 'cr-inspecciones-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.add(self.registration.scope).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Las llamadas al backend (Apps Script) siempre van a la red: nunca se
  // sirven desde caché, para no mostrar datos de casos desactualizados.
  if (url.hostname.indexOf('script.google') !== -1) return;

  // RED PRIMERO: con señal siempre se usa la versión nueva de la app y de
  // config.js (antes se servía la copia vieja guardada, y el teléfono del
  // inspector podía quedar una versión atrás). La copia guardada solo se usa
  // sin conexión, o si la red tarda más de 4 s.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const resp = await Promise.race([
        fetch(e.request, { cache: 'no-cache' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('lento')), 4000))
      ]);
      if (resp && resp.ok) cache.put(e.request, resp.clone());
      return resp;
    } catch (err) {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      if (cached) return cached;
      return fetch(e.request);
    }
  })());
});
