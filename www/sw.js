// Cache hors ligne : réseau d'abord, cache en secours (mises à jour visibles tout de suite).
const CACHE = "tribe-v5";
const FILES = ["./","index.html","css/app.css","manifest.webmanifest","icon-192.png","icon-512.png","firebase-config.js",
  "js/i18n.js","js/i18n-en.js","js/lms.js","js/data.js","js/core.js","js/art.js","js/native.js","js/ui-base.js","js/ui-kid.js","js/ui-family.js","js/ai.js","js/ai-scan.js","js/ui-special.js","js/main.js","js/cloud.js","js/vendor/jspdf.umd.min.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.hostname.includes("googleapis.com") && !u.hostname.startsWith("fonts")) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok && (u.origin === location.origin || u.hostname.includes("gstatic") || u.hostname.includes("fonts"))) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{}); } return r; }).catch(() => caches.match(e.request)));
});
