/* Service worker : l'application fonctionne hors ligne et se met à jour proprement.

   - Au premier chargement, tous les fichiers du « shell » (liste et version dans precache-manifest.js, généré par
     `npm run build:pwa`) sont téléchargés dans un cache nommé d'après la version.
   - Ensuite, ils sont servis depuis ce cache (cache d'abord) : l'application démarre sans réseau.
   - Une nouvelle version s'installe en arrière-plan puis ATTEND : la page propose « Mettre à jour » (js/pwa.js), qui envoie
     SKIP_WAITING. L'utilisateur n'est donc jamais rechargé au milieu d'une session.
   - Les polices Google (hôtes externes) sont gardées au fil de l'eau ; sans elles, la pile de polices retombe sur le système.
   Tous les chemins sont relatifs à la portée du service worker : l'application peut vivre dans un sous-dossier. */
importScripts("precache-manifest.js");

const { version, files } = self.PRECACHE;
const CACHE = `ace-shell-${version}`;
const FONTS = "ace-fonts";
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
const SCOPE = self.registration.scope;                   // ex. https://exemple.fr/gcp/
const INDEX = new URL("index.html", SCOPE).href;

async function precache() {
  const cache = await caches.open(CACHE);
  // `reload` : on contourne le cache HTTP du navigateur pour ne pas figer une ancienne version.
  await Promise.all(files.map(async f => {
    const res = await fetch(new Request(new URL(f, SCOPE).href, { cache: "reload" }));
    if (!res.ok) throw new Error(`${f} : HTTP ${res.status}`);
    await cache.put(new URL(f, SCOPE).href, res);
  }));
}

async function cleanup() {
  const keep = new Set([CACHE, FONTS]);
  await Promise.all((await caches.keys()).filter(k => k.startsWith("ace-") && !keep.has(k)).map(k => caches.delete(k)));
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(FONTS);
  const cached = await cache.match(request);
  const fresh = fetch(request).then(res => { if (res && (res.ok || res.type === "opaque")) cache.put(request, res.clone()); return res; }).catch(() => null);
  return cached || (await fresh) || Response.error();
}

self.addEventListener("install", e => e.waitUntil(precache()));       // pas de skipWaiting : l'utilisateur choisit le moment
self.addEventListener("activate", e => e.waitUntil(cleanup().then(() => self.clients.claim())));
self.addEventListener("message", e => { if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // Page d'application : toujours le shell mis en cache (une seule page), réseau en dernier recours.
    if (req.mode === "navigate") { e.respondWith(caches.match(INDEX).then(r => r || fetch(req))); return; }
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
  } else if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(staleWhileRevalidate(req));
  }
});
