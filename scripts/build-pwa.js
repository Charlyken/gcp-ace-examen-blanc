#!/usr/bin/env node
/* Régénère precache-manifest.js (version du cache et fichiers précachés par le service worker).
     npm run build:pwa        écrit le fichier
     npm run check-pwa        échoue (code 1) s'il n'est pas à jour : lancé par `npm test` et la CI */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderManifest, isUpToDate, precacheFiles, MANIFEST_FILE } from "./pwa.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv.includes("--check")) {
  if (isUpToDate(root)) { console.log(`${MANIFEST_FILE} à jour (${precacheFiles(root).length} fichiers précachés).`); process.exit(0); }
  console.error(`${MANIFEST_FILE} n'est pas à jour : un fichier de l'application a changé.\nLance \`npm run build:pwa\` puis ajoute ${MANIFEST_FILE} au commit.`);
  process.exit(1);
}
writeFileSync(join(root, MANIFEST_FILE), renderManifest(root));
console.log(`${MANIFEST_FILE} régénéré (${precacheFiles(root).length} fichiers précachés).`);
