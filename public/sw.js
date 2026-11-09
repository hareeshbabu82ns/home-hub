/* Home Hub service worker.
 *
 * - Pages: network first; when offline, the last cached copy of that page,
 *   else /offline.html. Only GET navigations are cached, never API calls,
 *   server actions (POST) or auth routes.
 * - Build assets (/_next/static, hashed) and icons: cache first.
 *
 * Bump VERSION to drop old caches on the next activation.
 */
const VERSION = "v1";
const PAGES = `hh-pages-${VERSION}`;
const ASSETS = `hh-assets-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/manifest.json"];
const MAX_PAGES = 40;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(ASSETS).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith("hh-") && ![PAGES, ASSETS].includes(key)).map((key) => caches.delete(key)),
      );
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

// The page asks a waiting worker to take over ("Update available" → Reload).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|svg|ico|webp|jpg|jpeg|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = (await event.preloadResponse) || (await fetch(request));
          // Don't keep redirects (e.g. to /sign-in) or errors.
          if (response.ok && !response.redirected && response.type === "basic") {
            const copy = response.clone();
            event.waitUntil(
              caches
                .open(PAGES)
                .then((cache) => cache.put(request, copy))
                .then(() => trimCache(PAGES, MAX_PAGES)),
            );
          }
          return response;
        } catch {
          return (await caches.match(request, { cacheName: PAGES })) || (await caches.match(OFFLINE_URL));
        }
      })(),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(ASSETS).then((cache) => cache.put(request, copy)));
        }
        return response;
      })(),
    );
  }
});
