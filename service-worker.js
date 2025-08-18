// Service Worker for MaterialMap
const CACHE_NAME = 'material-map-cache-v2';

// Get the base path from the service worker scope
const getBasePath = () => {
  const path = self.registration.scope;
  return path.endsWith('/') ? path.slice(0, -1) : path;
};

// Assets to cache - will be prefixed with base path
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/unified-styles.css',
  '/scripts.js',
  '/navigation.js',
  '/lib/mat.json',
  '/lib/eos.json',
  '/lib/mat_thermal.json',
  '/dist/file-list.json'
];

// Function to get full asset paths with the correct base path
const getAssetsToCache = () => {
  const basePath = getBasePath();
  return CORE_ASSETS.map(asset => {
    // If asset starts with '/', append it to base path
    if (asset.startsWith('/')) {
      return `${basePath}${asset}`;
    }
    // Otherwise, it's already a full URL
    return asset;
  });
};

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching core assets');
        return cache.addAll(getAssetsToCache());
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For HTML pages, always try network first (stale-while-revalidate)
  if (event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, clonedResponse);
            });
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/index.html');
            });
        })
    );
    return;
  }
  
  // For other assets, try cache first, then network (cache-first)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response to store in cache
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, clonedResponse);
              });
            
            return response;
          });
      })
  );
});