"use strict";

const CACHE_NAME = "uniplan-static-v6.0.0";

const CORE_FILES = [
    "./",
    "./index.html",
    "./manifest.webmanifest"
];

const OPTIONAL_FILES = [
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await cache.addAll(CORE_FILES);

            await Promise.all(
                OPTIONAL_FILES.map(file =>
                    cache.add(file).catch(() => null)
                )
            );
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const copy = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put("./index.html", copy);
                    });

                    return response;
                })
                .catch(async () => {
                    return (
                        await caches.match("./index.html") ||
                        await caches.match("./")
                    );
                })
        );

        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200) {
                    const copy = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, copy);
                    });
                }

                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
