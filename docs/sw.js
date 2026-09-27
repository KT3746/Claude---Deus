// Modo offline: guarda o app e os capítulos já abertos neste aparelho.
// O estudo acontece no Claude, fora do app, e precisa de internet.
const CACHE = "estudo-biblico-v2";
const APP = [
  "./", "index.html", "app.js", "style.css", "manifest.webmanifest",
  "icones/icone.svg", "icones/icone-192.png", "icones/icone-512.png", "icones/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Texto bíblico não muda: usa o que já está guardado, senão busca e guarda.
  if (url.hostname === "bible-api.com") {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const guardado = await c.match(request);
        if (guardado) return guardado;
        const resposta = await fetch(request);
        if (resposta.ok) c.put(request, resposta.clone());
        return resposta;
      }),
    );
    return;
  }

  // Arquivos do app: tenta a versão mais nova e, sem internet, usa a guardada.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(request)
        .then((resposta) => {
          if (resposta.ok) caches.open(CACHE).then((c) => c.put(request, resposta.clone()));
          return resposta;
        })
        .catch(() => caches.match(request).then((r) => r ?? caches.match("index.html"))),
    );
  }
});
