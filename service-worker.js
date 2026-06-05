// ============================================================
// SERVICE WORKER — Offline PWA Cache for Duty Tracker Pro
// ============================================================

const CACHE_NAME = 'duty-tracker-v2';
const STATIC_CACHE = 'duty-tracker-static-v2';

const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './js/config.js',
    './js/payment.js',
    './js/analytics.js',
    './js/promo.js',
    './js/binance.js',
    './js/notifications.js',
    './js/core.js',
    './js/pay.js',
    './js/auth.js',
    './js/pin.js',
    './js/reward.js',
    './js/countries.js',
    './js/app-init.js',
    './js/i18n.js',
    './js/security.js',
    './js/navigation.js',
    './js/features.js'
];

// Install — cache all static assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
    );
});

// Activate — delete old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys
                .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
                .map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Fetch — cache first for static, network first for Firebase
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip Firebase/external API calls — always network
    if (url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis') ||
        url.hostname.includes('onesignal') ||
        url.hostname.includes('razorpay') ||
        url.hostname.includes('paypal')) {
        return;
    }

    // Cache-first for local static files
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (!response || response.status !== 200) return response;
                const clone = response.clone();
                caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
                return response;
            }).catch(() => {
                // Offline fallback
                if (event.request.destination === 'document') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
