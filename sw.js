/* সাধারণ service worker: আগে নেটওয়ার্ক থেকে আনে, না পারলে জমানো কপি দেখায় */

const CACHE = "booktracker-v1";

self.addEventListener("install", function (event) {
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE; })
                    .map(function (k) { return caches.delete(k); })
            );
        }).then(function () { return self.clients.claim(); })
    );
});

self.addEventListener("fetch", function (event) {
    const req = event.request;

    if (req.method !== "GET") return;

    const url = new URL(req.url);

    /* শুধু নিজের সাইটের ফাইল (Firebase/অন্য সাইট নয়) */
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(req).then(function (res) {
            const copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
            return res;
        }).catch(function () {
            return caches.match(req).then(function (cached) {
                return cached || caches.match("index.html");
            });
        })
    );
});
