/* Outils PWA purs (sans réseau) : liste des fichiers du « shell » précachés par le service worker et version du cache.
   Utilisés par scripts/build-pwa.js et testés dans tests/pwa.test.js. */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

// Fichiers à la racine précachés (le reste : js/** et icons/**).
export const ROOT_FILES = ["index.html", "styles.css", "questions.js", "manifest.webmanifest"];
export const SW_FILE = "sw.js";
export const MANIFEST_FILE = "precache-manifest.js";

const walk = (dir, root, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, root, out);
    else out.push(relative(root, p).split(sep).join("/"));
  }
  return out;
};

// Chemins (relatifs à la racine du site, séparateur /) précachés, triés. Le service worker et son manifeste n'en font pas partie.
export function precacheFiles(root) {
  const files = [
    ...ROOT_FILES.filter(f => existsSync(join(root, f))),
    ...walk(join(root, "js"), root).filter(f => f.endsWith(".js")),
    ...walk(join(root, "icons"), root).filter(f => /\.(png|svg)$/.test(f))
  ];
  return [...new Set(files)].sort();
}

// Version du cache : empreinte du contenu de tous les fichiers précachés et du service worker.
// Elle change dès qu'un fichier de l'application change, ce qui déclenche la mise à jour chez l'utilisateur.
export function cacheVersion(root, files = precacheFiles(root)) {
  const h = createHash("sha256");
  for (const f of [...files, SW_FILE]) {
    h.update(f); h.update("\0");
    h.update(readFileSync(join(root, f))); h.update("\0");
  }
  return h.digest("hex").slice(0, 12);
}

// Contenu du fichier généré precache-manifest.js, importé par sw.js.
export function renderManifest(root) {
  const files = precacheFiles(root);
  return `/* Fichier GÉNÉRÉ par \`npm run build:pwa\` : ne pas modifier à la main.
   Version du cache et liste des fichiers précachés par sw.js. À régénérer après toute modification de l'application. */
self.PRECACHE = ${JSON.stringify({ version: cacheVersion(root, files), files }, null, 2)};
`;
}

// Vrai si precache-manifest.js est à jour.
export function isUpToDate(root) {
  const file = join(root, MANIFEST_FILE);
  return existsSync(file) && readFileSync(file, "utf8") === renderManifest(root);
}
