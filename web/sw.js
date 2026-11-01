// Service Worker: コンビニはがき名刺ジェネレーター (完全オフライン対応PWA)
const CACHE_NAME = "hagaki-meishi-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./qrcode.min.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon.svg",
  "./favicon.ico",
  "./apple-touch-icon.png"
];

// インストール時: 基本アセットを事前キャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 有効化時: 古いキャッシュをクリア
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// リクエスト時: キャッシュ優先、ネットワークフォールバック
self.addEventListener("fetch", (event) => {
  // 外部アフィリエイト計測や外部リソースは通常取得
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      });
    })
  );
});
