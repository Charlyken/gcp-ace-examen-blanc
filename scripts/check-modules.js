#!/usr/bin/env node
/* Vérifie les modules de l'application, sans dépendance :
   1. chaque fichier de js/ passe `node --check` (syntaxe) ;
   2. les modules purs (sans DOM) s'importent depuis Node, ce qui garantit qu'ils restent testables. */
import { readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p); else if (name.endsWith(".js")) files.push(p);
  }
})(join(root, "js"));

let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) { failed++; console.error(`Erreur de syntaxe : ${f}\n${r.stderr}`); }
}

// Modules qui ne doivent pas toucher au DOM à l'import.
const PURE = ["config", "data", "utils", "logic", "srs", "backup", "storage", "state"];
for (const name of PURE) {
  try { await import(pathToFileURL(join(root, "js", name + ".js")).href); }
  catch (e) { failed++; console.error(`Import impossible depuis Node : js/${name}.js (${e.message})`); }
}

console.log(`${files.length} fichiers vérifiés, ${PURE.length} modules purs importables.`);
process.exit(failed ? 1 : 0);
