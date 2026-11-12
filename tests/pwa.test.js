import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { precacheFiles, cacheVersion, renderManifest, isUpToDate, SW_FILE, MANIFEST_FILE } from "../scripts/pwa.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = f => readFileSync(join(ROOT, f), "utf8");
const manifest = JSON.parse(read("manifest.webmanifest"));
const png = f => { const b = readFileSync(join(ROOT, f)); assert.equal(b.subarray(1, 4).toString(), "PNG", f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

describe("manifeste de l'application", () => {
  test("champs requis pour l'installation", () => {
    for (const k of ["name", "short_name", "start_url", "scope", "display", "icons", "background_color", "theme_color"]) assert.ok(manifest[k], k);
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.start_url, "./", "relatif : fonctionne aussi dans un sous-dossier");
    assert.equal(manifest.scope, "./");
    assert.ok(manifest.short_name.length <= 12, "nom court lisible sous l'icône");
    assert.equal(manifest.lang, "fr");
  });
  test("icônes : fichiers présents, dimensions déclarées exactes, 192 et 512 px, une icône maskable", () => {
    for (const icon of manifest.icons) {
      assert.ok(existsSync(join(ROOT, icon.src)), `${icon.src} existe`);
      if (icon.type === "image/png") {
        const [w, h] = png(icon.src);
        assert.equal(icon.sizes, `${w}x${h}`, `${icon.src} : ${w}x${h}`);
      }
    }
    const sizes = manifest.icons.filter(i => i.purpose === "any" && i.type === "image/png").map(i => i.sizes);
    assert.ok(sizes.includes("192x192") && sizes.includes("512x512"));
    assert.ok(manifest.icons.some(i => i.purpose === "maskable" && i.sizes === "512x512"), "icône maskable 512");
  });
  test("couleur du thème cohérente avec la page", () => {
    assert.match(read("index.html"), new RegExp(`<meta name="theme-color" content="${manifest.theme_color}"`));
  });
});

describe("index.html", () => {
  const html = read("index.html");
  test("référence le manifeste, les icônes et les balises iOS, avec des chemins relatifs", () => {
    assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
    assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png">/);
    assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes">/);
    assert.match(html, /<meta name="viewport"[^>]*viewport-fit=cover/);
    const local = [...html.matchAll(/(?:href|src)="([^"#?]+)"/g)].map(m => m[1]).filter(u => !/^(https?:|\/\/|data:)/.test(u));
    for (const u of local) { assert.ok(!u.startsWith("/"), `${u} : chemin absolu interdit`); assert.ok(existsSync(join(ROOT, u)), `${u} existe`); }
  });
});

describe("précache : le shell complet est disponible hors ligne", () => {
  const files = precacheFiles(ROOT);
  test("contient la page, les styles, les questions, le manifeste, les icônes et tous les modules", () => {
    for (const f of ["index.html", "styles.css", "questions.js", "manifest.webmanifest", "js/main.js", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "icons/icon.svg"]) assert.ok(files.includes(f), f);
    const modules = (function walk(d) { return readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : p.endsWith(".js") ? [relative(ROOT, p).split(sep).join("/")] : []; }); })(join(ROOT, "js"));
    for (const m of modules) assert.ok(files.includes(m), `${m} précaché`);
  });
  test("ne contient ni le service worker, ni son manifeste, ni tests, scripts ou documentation", () => {
    assert.ok(!files.includes(SW_FILE) && !files.includes(MANIFEST_FILE));
    assert.ok(files.every(f => !/^(tests|scripts|\.github)\//.test(f) && !/\.md$/.test(f)));
  });
  test("tout fichier importé par le code ou la page est précaché (sinon l'application casse hors ligne)", () => {
    const missing = [];
    const check = (from, spec) => {
      if (!spec.startsWith(".")) return;
      const target = relative(ROOT, resolve(ROOT, dirname(from), spec)).split(sep).join("/");
      if (!files.includes(target)) missing.push(`${from} -> ${target}`);
    };
    for (const f of files.filter(f => f.endsWith(".js"))) for (const m of read(f).matchAll(/(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g)) check(f, m[1]);
    for (const m of read("index.html").matchAll(/(?:href|src)="([^"#?:]+)"/g)) check("index.html", "./" + m[1]);
    assert.deepEqual(missing, []);
  });
  test("tous les fichiers listés existent", () => { for (const f of files) assert.ok(existsSync(join(ROOT, f)), f); });
  test("liste triée et sans doublon", () => {
    assert.deepEqual(files, [...new Set(files)].sort());
  });
  test("precache-manifest.js est à jour (sinon : npm run build:pwa)", () => {
    assert.ok(isUpToDate(ROOT), "precache-manifest.js périmé : lance `npm run build:pwa`");
  });
  test("le manifeste de précache déclare la version et la liste lues par le service worker", () => {
    const src = read(MANIFEST_FILE);
    assert.match(src, /^\/\* Fichier GÉNÉRÉ/);
    const data = JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
    assert.deepEqual(data.files, files);
    assert.match(data.version, /^[0-9a-f]{12}$/);
  });
});

describe("version du cache et manifeste généré (sur un site factice)", () => {
  let dir;
  const put = (f, c) => { mkdirSync(dirname(join(dir, f)), { recursive: true }); writeFileSync(join(dir, f), c); };
  before(() => { dir = mkdtempSync(join(tmpdir(), "ace-pwa-")); put("index.html", "<html>"); put("styles.css", "a{}"); put("js/main.js", "1"); put("js/ui/x.js", "2"); put("icons/a.png", "png"); put("icons/b.svg", "<svg/>"); put("icons/notes.txt", "x"); put("js/notes.txt", "x"); put("js/data.json", "{}"); put("README.md", "x"); put("sw.js", "sw"); put("tests/a.test.js", "t"); });
  after(() => rmSync(dir, { recursive: true, force: true }));

  test("liste : racine, js/** et icônes png/svg, triée ; ignore le reste ; tolère un fichier racine absent", () => {
    assert.deepEqual(precacheFiles(dir), ["icons/a.png", "icons/b.svg", "index.html", "js/main.js", "js/ui/x.js", "styles.css"]);
  });
  test("la version est stable et ne dépend que du contenu du shell et du service worker", () => {
    const v = cacheVersion(dir);
    assert.match(v, /^[0-9a-f]{12}$/);
    assert.equal(cacheVersion(dir), v);
    put("README.md", "autre"); put("tests/a.test.js", "autre"); put("icons/notes.txt", "autre"); put("js/notes.txt", "autre");
    assert.equal(cacheVersion(dir), v, "fichiers hors shell : aucun effet");
  });
  test("la version change quand un fichier du shell change, est ajouté, ou quand le service worker change", () => {
    const v0 = cacheVersion(dir);
    put("js/main.js", "modifié"); const v1 = cacheVersion(dir); assert.notEqual(v1, v0);
    put("js/new.js", "nouveau"); const v2 = cacheVersion(dir); assert.notEqual(v2, v1);
    put("sw.js", "sw v2"); const v3 = cacheVersion(dir); assert.notEqual(v3, v2);
    put("js/main.js", "1"); rmSync(join(dir, "js/new.js")); put("sw.js", "sw");
    assert.equal(cacheVersion(dir), v0, "retour à l'état initial : même version");
  });
  test("un fichier renommé change la version même à contenu identique", () => {
    const v = cacheVersion(dir);
    rmSync(join(dir, "styles.css")); put("style2.css", "a{}");               // même contenu, autre nom
    assert.notEqual(cacheVersion(dir), v);
    rmSync(join(dir, "style2.css")); put("styles.css", "a{}");
    assert.equal(cacheVersion(dir), v, "retour au nom d'origine : même version");
  });
  test("deux fichiers dont les contenus sont permutés donnent une version différente", () => {
    const v = cacheVersion(dir);
    put("js/main.js", "2"); put("js/ui/x.js", "1");                          // contenus échangés
    assert.notEqual(cacheVersion(dir), v);
    put("js/main.js", "1"); put("js/ui/x.js", "2");
    assert.equal(cacheVersion(dir), v);
  });
  test("isUpToDate : faux sans manifeste ou périmé, vrai après génération", () => {
    assert.equal(isUpToDate(dir), false);
    writeFileSync(join(dir, MANIFEST_FILE), renderManifest(dir)); assert.equal(isUpToDate(dir), true);
    put("styles.css", "b{}"); assert.equal(isUpToDate(dir), false, "un fichier a changé");
    writeFileSync(join(dir, MANIFEST_FILE), renderManifest(dir)); assert.equal(isUpToDate(dir), true);
    put("sw.js", "autre sw"); assert.equal(isUpToDate(dir), false, "le service worker a changé");
  });
  test("le manifeste généré est du JavaScript exécutable qui définit self.PRECACHE", () => {
    const src = renderManifest(dir), self = {};
    new Function("self", src)(self);
    assert.deepEqual(self.PRECACHE.files, precacheFiles(dir));
    assert.equal(self.PRECACHE.version, cacheVersion(dir));
  });
});

describe("service worker (garde-fous statiques ; le comportement est vérifié dans un navigateur)", () => {
  const sw = read(SW_FILE);
  test("charge le manifeste de précache et utilise une version dans le nom du cache", () => {
    assert.match(sw, /importScripts\("precache-manifest\.js"\)/);
    assert.match(sw, /ace-shell-\$\{version\}/);
  });
  test("n'active pas la nouvelle version tout seul : skipWaiting uniquement sur demande de la page", () => {
    assert.equal((sw.match(/skipWaiting\(\)/g) || []).length, 1);
    assert.match(sw, /addEventListener\("message"[^\n]*SKIP_WAITING[^\n]*skipWaiting\(\)/);
  });
  test("précache en contournant le cache HTTP et échoue si un fichier est introuvable", () => {
    assert.match(sw, /cache:\s*"reload"/);
    assert.match(sw, /if \(!res\.ok\) throw/);
  });
  test("ne traite que les requêtes GET, supprime les anciens caches et prend le contrôle à l'activation", () => {
    assert.match(sw, /req\.method !== "GET"/);
    assert.match(sw, /caches\.delete/);
    assert.match(sw, /clients\.claim\(\)/);
  });
  test("chemins relatifs à la portée du service worker (sous-dossier possible)", () => {
    assert.match(sw, /self\.registration\.scope/);
    assert.ok(!/["'`]\/(?:index|styles|js|icons)/.test(sw), "aucun chemin absolu vers l'application");
  });
});
