#!/usr/bin/env node
/* Vérifie que les liens `doc` de la banque répondent (réseau nécessaire, donc hors CI) : npm run check-links
   Échoue (code 1) si un lien ne répond pas en 2xx. Signale en avertissement les redirections qui changent de page,
   avec l'URL finale à utiliser. Node 18+, aucune dépendance. */
import { QUESTIONS } from "../questions.js";

const CONCURRENCY = 8, TIMEOUT_MS = 25000;
const path = (u) => new URL(u).pathname.replace(/\/$/, "");
const urls = [...new Set(QUESTIONS.map((q) => q.doc).filter(Boolean))];
const usedBy = (u) => QUESTIONS.filter((q) => q.doc === u).map((q) => q.id).join(", ");

async function check(url) {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": "gcp-ace-examen-blanc link-check" } });
    await res.body?.cancel();
    return { url, status: res.status, final: res.url };
  } catch (e) {
    return { url, status: 0, error: e.cause?.code || e.message };
  }
}

const results = [];
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < urls.length) results.push(await check(urls[next++]));
}));

let failed = 0, moved = 0;
for (const r of results.sort((a, b) => a.url.localeCompare(b.url))) {
  if (r.status < 200 || r.status >= 300) { failed++; console.error(`erreur         ${r.status || r.error}  ${r.url}  (${usedBy(r.url)})`); }
  else if (path(r.final) !== path(r.url)) { moved++; console.warn(`avertissement  redirigé : ${r.url}\n               -> ${r.final}  (${usedBy(r.url)})`); }
}
console.log(`\n${urls.length} liens vérifiés : ${urls.length - failed} répondent, ${failed} en erreur, ${moved} redirigés vers une autre page.`);
process.exit(failed ? 1 : 0);
