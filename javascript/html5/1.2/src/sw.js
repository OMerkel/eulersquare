// Service Worker for Euler Square PWA
// Handles caching and offline support

const CACHE_VERSION = "v3";
const CACHE_NAME = `euler-square-${CACHE_VERSION}`;
const RUNTIME_CACHE = `euler-square-runtime-${CACHE_VERSION}`;

const LOCAL_DEBUG_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const ENABLE_DEV_TEST_CACHE = LOCAL_DEBUG_HOSTS.has(self.location.hostname);

// Core runtime assets for production/offline app usage.
const CORE_STATIC_ASSETS = [
  "./",
  "./index.html",
  "./css/index.css",
  "./js/constants.js",
  "./js/ui-constants.js",
  "./js/solver.js",
  "./js/game-state.js",
  "./js/board-renderer.js",
  "./js/input-controller.js",
  "./js/hmi.js",
  "./img/icons/favicon.ico",
  "./manifest.json",
];

// Developer-only test assets cached on localhost environments.
const DEV_TEST_ASSETS = [
  "./test/test-harness.js",
  "./test/constants.tests.js",
  "./test/ui-constants.tests.js",
  "./test/solver.tests.js",
  "./test/game-state.tests.js",
  "./test/board-renderer.tests.js",
  "./test/input-controller.tests.js",
  "./test/hmi.tests.js",
  "./test/tests.js",
];

const STATIC_ASSETS = ENABLE_DEV_TEST_CACHE
  ? CORE_STATIC_ASSETS.concat(DEV_TEST_ASSETS)
  : CORE_STATIC_ASSETS;

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  console.log(
    `[Service Worker] Dev test caching ${ENABLE_DEV_TEST_CACHE ? "enabled" : "disabled"}`,
  );

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Immediately activate the service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[Service Worker] Install failed:", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches that don't match current version
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          }),
        );
      })
      .then(() => {
        // Claim all clients immediately
        return self.clients.claim();
      }),
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Cache-first strategy for static assets
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log("[Service Worker] Served from cache:", request.url);
          return response;
        }

        // Network fallback
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Only document requests should fallback to index HTML.
            if (request.destination === "document") {
              return caches.match("./index.html");
            }
            return Response.error();
          });
      }),
    );
    return;
  }

  // Network-first strategy for HTML pages
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((response) => {
          return response || caches.match("./index.html");
        });
      }),
  );
});

/**
 * Determine if a request URL is for a static asset
 * @param {string} url - The request URL
 * @returns {boolean} True if the request is for a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = [
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".json",
  ];

  return (
    staticExtensions.some((ext) => url.endsWith(ext)) ||
    url.endsWith("manifest.json")
  );
}
