#!/usr/bin/env node
/* Génère les icônes PNG de l'application à partir des SVG de icons/ (à relancer si le dessin change).
   Nécessite Playwright (non installé par le projet, donc hors CI) : npx playwright install chromium && node scripts/make-icons.js
   Le résultat est versionné ; ensuite, lancer `npm run build:pwa`. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");   // require : fonctionne avec une installation locale ou globale

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "icons");
const jobs = [
  ["icon.svg", "icon-192.png", 192, true],                  // icône classique, coins arrondis transparents
  ["icon.svg", "icon-512.png", 512, true],
  ["icon-maskable.svg", "icon-maskable-512.png", 512, false],   // pleine page : Android applique son propre masque
  ["icon-maskable.svg", "apple-touch-icon.png", 180, false]     // iOS arrondit lui-même
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [src, out, size, transparent] of jobs) {
  const svg = readFileSync(join(dir, src), "utf8");
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: join(dir, out), omitBackground: transparent });
  console.log(out);
}
await browser.close();
