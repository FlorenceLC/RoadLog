/**
 * RoadLog - Service Worker
 * Gestion du cache pour le mode hors ligne et les performances
 */

const CACHE_NAME = 'roadlog-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/components.css',
    '/css/responsive.css',
    '/js/config.js',
    '/js/utils.js',
    '/js/storage.js',
    '/js/github.js',
    '/js/router.js',
    '/js/ui.js',
    '/js/speech.js',
    '/js/ai.js',
    '/js/geo.js',
    '/js/camera.js',
    '/js/stats.js',
    '/js/map.js',
    '/js/export.js',
    '/js/qrcode.js',
    '/js/app.js',
    '/manifest.json'
];

// Installation du service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Stratégie : Network First, fallback Cache
self.addEventListener('fetch', (event) => {
    // Ne pas mettre en cache les requêtes vers l'API GitHub
    if (event.request.url.includes('api.github.com') || 
        event.request.url.includes('api.mistral.ai')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Mettre en cache la réponse fraîche
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => cache.put(event.request, responseClone));
                }
                return response;
            })
            .catch(() => {
                // Fallback sur le cache
                return caches.match(event.request);
            })
    );
});
