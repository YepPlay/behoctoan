const CACHE = "vl-toan-ca357f86d5";
const ASSETS = [
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./assets/images/donate.jpg",
  "./assets/images/icon-180.png",
  "./assets/images/icon-192.png",
  "./assets/images/icon-32.png",
  "./assets/images/icon-512.png",
  "./js/audio.js",
  "./js/data.js",
  "./js/games.js",
  "./js/main.js",
  "./js/pwa.js",
];

self.addEventListener("install", function (event) {
  event.waitUntil((async function () {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(ASSETS);
    } catch (e) {
      await Promise.all(ASSETS.map(function (url) {
        return cache.add(url).catch(function () { });
      }));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", function (event) {
  event.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  event.respondWith(respond(req));
});

async function respond(req) {
  const cache = await caches.open(CACHE);
  const range = req.headers.get("range");
  const hit = await cache.match(req.url, { ignoreVary: true, ignoreSearch: true });
  if (hit && !range) return hit;
  if (hit && range) {
    const part = await slice(hit, range);
    if (part) return part;
  }
  try {
    const res = await fetch(req);
    if (res && res.ok && !range && req.mode !== "navigate") cache.put(req.url, res.clone());
    return res;
  } catch (e) {
    if (req.mode === "navigate") {
      const page = await cache.match("./index.html", { ignoreVary: true });
      if (page) return page;
    }
    if (hit) return hit;
    return new Response("Offline", { status: 504, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function slice(res, header) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  let start, end;
  if (m[1] === "") {
    start = size - Number(m[2]);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Number(m[2]);
  }
  if (!isFinite(start) || !isFinite(end)) return null;
  if (start < 0) start = 0;
  if (end > size - 1) end = size - 1;
  if (start > end) return null;
  const headers = new Headers(res.headers);
  headers.set("Content-Range", "bytes " + start + "-" + end + "/" + size);
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Accept-Ranges", "bytes");
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: "Partial Content", headers: headers });
}
