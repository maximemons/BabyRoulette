// Service worker de Baby Roulette : garde une copie des fichiers de l'appli pour l'ouvrir hors ligne.
// Réseau d'abord (les mises à jour arrivent tout de suite), copie locale si le réseau manque.
// Les compteurs (votes, vues) ne passent jamais par le cache.

const CACHE = "baby-roulette-v2";
const SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/i18n.js",
  "./js/ui.js",
  "./js/share.js",
  "./js/counter.js",
  "./js/effects.js",
  "./js/slot.js",
  "./js/wordle.js",
  "./js/tournament.js",
  "./favicon.svg",
  "./manifest.webmanifest",
  "./icons/icon-192.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !fonts) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match("./index.html")))
  );
});
