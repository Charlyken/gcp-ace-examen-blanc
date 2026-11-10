#!/usr/bin/env node
/* Valide la banque de questions (questions.js). Sans dépendance : node scripts/validate-questions.js
   Code de sortie 1 s'il y a au moins une erreur ; les avertissements n'échouent pas.
   Les règles sont dans scripts/validation.js. */
import { DOMAINS, TOPICS, QUESTIONS } from "../questions.js";
import { validateBank } from "./validation.js";

const r = validateBank({ DOMAINS, TOPICS, QUESTIONS });
const domainIds = Object.keys(DOMAINS).map(Number);

console.log(`${r.total} questions — ${domainIds.map((d) => `D${d}: ${r.perDomain[d]}`).join(", ")}`);
console.log(`difficulté — ${Object.entries(r.perDifficulty).map(([d, n]) => `${d}: ${n}`).join(", ")}`);
console.log(`sujets — ${Object.entries(r.perTopic).map(([t, n]) => `${t}: ${n}`).join(", ")}`);
for (const w of r.warnings) console.warn(`avertissement  ${w}`);
for (const e of r.errors) console.error(`erreur         ${e}`);
console.log(r.errors.length ? `\n${r.errors.length} erreur(s)` : "\nBanque de questions valide");
process.exit(r.errors.length ? 1 : 0);
