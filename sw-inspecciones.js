// ─────────────────────────────────────────────────────────────────────────
// Service Worker — Inspeccionador CR Consulting
// Sube este archivo a la MISMA carpeta que tu inspecciones.html (GitHub
// Pages). Solo cachea el "cascarón" de la app (HTML/CSS/fuentes/íconos) para
// que el navegador pueda abrirla sin conexión. Nunca cachea llamadas al
// backend de Apps Script: esas siempre van a la red (o fallan explícito, y
// el propio inspecciones.html se encarga de guardar los cambios localmente).
// ─────────────────────────────────────────────────────────────────────────
const CACHE = 'cr-inspecciones-v1';

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

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copia));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
