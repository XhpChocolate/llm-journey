/* 学习台 Service Worker：缓存应用外壳，离线可用。
   只在 http(s) 下生效（file:// 打开时浏览器不注册 SW）。 */
const CACHE = "xuetai-v1";
const SHELL = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./data/plan.js",
  "./assets/system.css",
  "./assets/motion/motion.css",
  "./favicon.svg",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  // 逐个缓存：某个文件抖动（超时/404）不会让整次安装失败
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(
        SHELL.map((url) =>
          c.add(url).catch(() => c.add(new Request(url, { cache: "reload" })).catch(() => null))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // 外部链接交给浏览器

  // 导航请求：先网络，失败回退缓存
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 静态资源：先缓存
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
    )
  );
});
