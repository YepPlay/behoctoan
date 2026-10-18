const CACHE = "vl-toan-fbee201797";
const ASSETS = [
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./assets/images/donate.jpg",
  "./assets/images/icon-180.png",
  "./assets/images/icon-192.png",
  "./assets/images/icon-32.png",
  "./assets/images/icon-512.png",
  "./assets/voice/after1.mp3",
  "./assets/voice/after2.mp3",
  "./assets/voice/after3.mp3",
  "./assets/voice/after4.mp3",
  "./assets/voice/after5.mp3",
  "./assets/voice/after6.mp3",
  "./assets/voice/after7.mp3",
  "./assets/voice/after8.mp3",
  "./assets/voice/after9.mp3",
  "./assets/voice/caoHon.mp3",
  "./assets/voice/cong.mp3",
  "./assets/voice/daiHon.mp3",
  "./assets/voice/demCham.mp3",
  "./assets/voice/demHinh.mp3",
  "./assets/voice/gioiQua.mp3",
  "./assets/voice/hinhNgoiSao.mp3",
  "./assets/voice/hinhTamGiac.mp3",
  "./assets/voice/hinhTron.mp3",
  "./assets/voice/hinhVuong.mp3",
  "./assets/voice/hoiCalc.mp3",
  "./assets/voice/n0.mp3",
  "./assets/voice/n1.mp3",
  "./assets/voice/n10.mp3",
  "./assets/voice/n2.mp3",
  "./assets/voice/n3.mp3",
  "./assets/voice/n4.mp3",
  "./assets/voice/n5.mp3",
  "./assets/voice/n6.mp3",
  "./assets/voice/n7.mp3",
  "./assets/voice/n8.mp3",
  "./assets/voice/n9.mp3",
  "./assets/voice/nhieuHon.mp3",
  "./assets/voice/phanLoaiAn.mp3",
  "./assets/voice/phanLoaiChoi.mp3",
  "./assets/voice/phanLoaiDi.mp3",
  "./assets/voice/phanLoaiMac.mp3",
  "./assets/voice/quyLuat.mp3",
  "./assets/voice/soTiep.mp3",
  "./assets/voice/thuLai.mp3",
  "./assets/voice/toHon.mp3",
  "./assets/voice/tru.mp3",
  "./js/audio.js",
  "./js/data.js",
  "./js/games.js",
  "./js/main.js",
  "./js/pwa.js",
  "./js/voice-lines.js",
  "./js/voice.js",
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
