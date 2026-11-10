#!/usr/bin/env node
/* Valide la banque de questions (questions.js). Sans dépendance : node scripts/validate-questions.js
   Code de sortie 1 s'il y a au moins une erreur ; les avertissements n'échouent pas. */
"use strict";
const path = require("path");
const { DOMAINS, QUESTIONS } = require(path.join(__dirname, "..", "questions.js"));

const errors = [], warnings = [];
const err = (id, msg) => errors.push(`[${id}] ${msg}`);
const warn = (msg) => warnings.push(msg);

// --- Domaines ---
const domainIds = Object.keys(DOMAINS).map(Number);
const totalWeight = domainIds.reduce((s, d) => s + DOMAINS[d].weight, 0);
if (Math.abs(totalWeight - 100) > 0.001) err("DOMAINS", `la somme des poids vaut ${totalWeight}, attendu 100`);
for (const d of domainIds) {
  const { name, short, weight } = DOMAINS[d];
  if (!name || !short) err(`DOMAINS.${d}`, "name/short manquant");
  if (!(weight > 0)) err(`DOMAINS.${d}`, "weight doit être > 0");
}

// --- Questions ---
const seen = new Set();
const isStr = (s) => typeof s === "string" && s.trim() !== "";
const letterRef = /\b(?:option|réponse|choix|proposition)s?\s+[A-E]\b/i;

for (const [i, q] of QUESTIONS.entries()) {
  const id = q && isStr(q.id) ? q.id : `#${i}`;
  if (!q || !isStr(q.id)) { err(id, "id manquant"); continue; }
  if (seen.has(q.id)) err(id, "id en double");
  seen.add(q.id);

  if (!Number.isInteger(q.domain) || !DOMAINS[q.domain]) err(id, `domain invalide (${q.domain})`);
  else if (!new RegExp(`^d${q.domain}-\\d+$`).test(q.id)) err(id, `l'id devrait suivre le motif d${q.domain}-NN`);

  if (!isStr(q.q)) err(id, "énoncé (q) vide");
  if (!isStr(q.explain)) err(id, "explication (explain) vide");

  const opts = q.options;
  if (!Array.isArray(opts) || opts.length < 4 || opts.length > 5) { err(id, "options : 4 ou 5 attendues"); continue; }
  if (opts.some((o) => !isStr(o))) err(id, "option vide ou non textuelle");
  const norm = opts.map((o) => String(o).trim().toLowerCase());
  if (new Set(norm).size !== norm.length) err(id, "options en double");

  const c = q.correct;
  if (!Array.isArray(c) || c.length === 0) { err(id, "correct doit être un tableau non vide"); continue; }
  if (c.some((x) => !Number.isInteger(x) || x < 0 || x >= opts.length)) err(id, "correct : index hors bornes");
  if (new Set(c).size !== c.length) err(id, "correct : index en double");
  if (c.length >= opts.length) err(id, "correct : toutes les options ne peuvent pas être justes");

  for (const field of ["q", "explain"]) {
    if (isStr(q[field]) && (q[field].split("`").length - 1) % 2 !== 0) err(id, `${field} : backtick non fermé`);
  }
  if (isStr(q.explain) && letterRef.test(q.explain)) err(id, "explain référence une option par sa lettre (l'ordre est mélangé)");
}

// --- Équilibre de la banque ---
const perDomain = Object.fromEntries(domainIds.map((d) => [d, QUESTIONS.filter((q) => q.domain === d).length]));
for (const d of domainIds) {
  if (perDomain[d] === 0) err(`DOMAINS.${d}`, "aucune question");
  else if (perDomain[d] < 10) warn(`domaine ${d} : seulement ${perDomain[d]} questions`);
}
const single = QUESTIONS.filter((q) => Array.isArray(q.correct) && q.correct.length === 1 && Array.isArray(q.options));
const longest = single.filter((q) => {
  const len = q.options.map((o) => String(o).length);
  return len[q.correct[0]] === Math.max(...len);
}).length;
const ratio = single.length ? longest / single.length : 0;
if (ratio > 0.5) warn(`biais de longueur : la bonne réponse est la plus longue dans ${longest}/${single.length} questions (${Math.round(ratio * 100)} %)`);

// --- Rapport ---
console.log(`${QUESTIONS.length} questions — ${domainIds.map((d) => `D${d}: ${perDomain[d]}`).join(", ")}`);
for (const w of warnings) console.warn(`avertissement  ${w}`);
for (const e of errors) console.error(`erreur         ${e}`);
console.log(errors.length ? `\n${errors.length} erreur(s)` : "\nBanque de questions valide");
process.exit(errors.length ? 1 : 0);
