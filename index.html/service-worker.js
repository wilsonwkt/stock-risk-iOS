const CACHE_NAME = 'risk-calc-cache-v1';

// 依你的實際檔案路徑調整
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 安裝：預先快取必要資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 啟用：清理舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 取用策略：優先用快取，沒有再去抓網路
self.addEventListener('fetch', event => {
  const { request } = event;

  // 只處理 GET；其他 request 直接略過
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          // 動態快取新資源（簡單版，可視情況關掉）
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(() => {
          // 離線且無快取時，可視需要回傳自訂離線頁
          // 目前先不處理，讓瀏覽器顯示預設錯誤
          return new Response('Offline', {
            status: 503,
            statusText: 'Offline'
          });
        });
    })
  );
});