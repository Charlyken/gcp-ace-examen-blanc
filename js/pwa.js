/* PWA côté navigateur : enregistrement du service worker, mise à jour proposée à l'utilisateur, invite d'installation.
   La logique de décision pure est dans install.js. */
import { installMode, isIOS } from "./install.js";

const status = { ready: false, deferredPrompt: null, waiting: null };
let updating = false;           // vrai seulement quand l'utilisateur a demandé la mise à jour : évite de recharger au premier lancement

export const pwaStatus = () => ({
  ready: status.ready,
  mode: installMode({
    standalone: matchMedia("(display-mode: standalone)").matches || navigator.standalone === true,
    canPrompt: !!status.deferredPrompt,
    ios: isIOS(navigator.userAgent, navigator.platform, navigator.maxTouchPoints),
    secure: window.isSecureContext
  })
});

// Abonnement aux changements d'état (installation possible, mode hors ligne prêt) : la vue redessine sa carte sans recharger la page.
const listeners = [];
export const onPwaChange = fn => listeners.push(fn);
const refreshInstallCard = () => listeners.forEach(fn => fn());

export async function promptInstall() {
  const p = status.deferredPrompt;
  if (!p) return;
  status.deferredPrompt = null;
  p.prompt();
  try { await p.userChoice; } catch (e) { /* ignoré */ }
  refreshInstallCard();
}

function showUpdateBanner(worker) {
  status.waiting = worker;
  if (document.getElementById("update-banner")) return;
  const b = document.createElement("div");
  b.id = "update-banner"; b.className = "update-banner"; b.setAttribute("role", "status");
  b.innerHTML = `<span>Une nouvelle version est disponible. Ta progression est conservée.</span>
    <button class="btn btn-sm btn-primary" type="button" id="update-btn">Mettre à jour</button>
    <button class="btn btn-sm btn-ghost" type="button" id="update-later" aria-label="Plus tard">Plus tard</button>`;
  document.body.appendChild(b);
  document.getElementById("update-btn").addEventListener("click", () => {
    updating = true;
    b.querySelector("span").textContent = "Mise à jour…";
    worker.postMessage({ type: "SKIP_WAITING" });
  });
  document.getElementById("update-later").addEventListener("click", () => b.remove());
}

export function initPwa() {
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); status.deferredPrompt = e; refreshInstallCard(); });
  window.addEventListener("appinstalled", () => { status.deferredPrompt = null; refreshInstallCard(); });
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => { if (updating) location.reload(); });
  // `updateViaCache: "none"` : sw.js et precache-manifest.js sont toujours revérifiés (pas de cache HTTP), donc pas de mise à jour retardée.
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
    if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener("statechange", () => {
        if (w.state === "installed" && navigator.serviceWorker.controller) showUpdateBanner(w);   // pas au tout premier chargement
      });
    });
    // Application laissée ouverte (installée) : on revérifie quand elle redevient visible.
    document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => { /* pas de service worker (navigation privée, HTTP…) : l'application fonctionne quand même en ligne */ });

  navigator.serviceWorker.ready.then(() => { status.ready = true; refreshInstallCard(); }).catch(() => {});
}
