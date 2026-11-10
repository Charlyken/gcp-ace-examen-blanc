/* Règles de validation de la banque de questions. Fonction pure (aucune lecture de fichier, aucun affichage) :
   importée par scripts/validate-questions.js et testée dans tests/validation.test.js. */

// Hôtes autorisés pour le champ `doc` (documentation officielle uniquement).
export const DOC_HOSTS = ["docs.cloud.google.com", "cloud.google.com", "kubernetes.io"];
export const DIFFICULTIES = [1, 2, 3];

const isStr = (s) => typeof s === "string" && s.trim() !== "";
const letterRef = /\b(?:option|réponse|choix|proposition)s?\s+[A-E]\b/i;

export function validateBank({ DOMAINS, TOPICS, QUESTIONS }) {
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

  // --- Sujets ---
  for (const [key, label] of Object.entries(TOPICS)) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)) err(`TOPICS.${key}`, "clé invalide (minuscules, chiffres et tirets)");
    if (!isStr(label)) err(`TOPICS.${key}`, "libellé vide");
  }

  // --- Questions ---
  const seen = new Set();
  for (const [i, q] of QUESTIONS.entries()) {
    const id = q && isStr(q.id) ? q.id : `#${i}`;
    if (!q || !isStr(q.id)) { err(id, "id manquant"); continue; }
    if (seen.has(q.id)) err(id, "id en double");
    seen.add(q.id);

    if (!Number.isInteger(q.domain) || !DOMAINS[q.domain]) err(id, `domain invalide (${q.domain})`);
    else if (!new RegExp(`^d${q.domain}-\\d+$`).test(q.id)) err(id, `l'id devrait suivre le motif d${q.domain}-NN`);

    // Métadonnées : sujet, difficulté, documentation.
    if (!isStr(q.topic)) err(id, "topic manquant");
    else if (!Object.hasOwn(TOPICS, q.topic)) err(id, `topic inconnu (${q.topic}) : à déclarer dans TOPICS`);
    if (!DIFFICULTIES.includes(q.difficulty)) err(id, `difficulty invalide (${q.difficulty}) : 1, 2 ou 3 attendu`);
    else if (Array.isArray(q.correct) && q.correct.length > 1 && q.difficulty === 1) err(id, "une question à réponses multiples est au moins de difficulté 2");
    if (!isStr(q.doc)) err(id, "doc manquant");
    else {
      let url = null;
      try { url = new URL(q.doc); } catch (e) { /* invalide */ }
      if (!url) err(id, `doc : URL invalide (${q.doc})`);
      else if (url.protocol !== "https:") err(id, "doc : https obligatoire");
      else if (!DOC_HOSTS.includes(url.hostname)) err(id, `doc : hôte non autorisé (${url.hostname}), attendu ${DOC_HOSTS.join(", ")}`);
      else if (url.pathname === "/" || url.pathname === "") err(id, "doc : doit pointer vers une page précise, pas vers la racine du site");
    }

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

  const perTopic = Object.fromEntries(Object.keys(TOPICS).map((t) => [t, QUESTIONS.filter((q) => q.topic === t).length]));
  for (const [t, n] of Object.entries(perTopic)) if (n === 0) warn(`sujet « ${t} » déclaré mais sans aucune question`);
  const perDifficulty = Object.fromEntries(DIFFICULTIES.map((d) => [d, QUESTIONS.filter((q) => q.difficulty === d).length]));
  for (const d of DIFFICULTIES) {
    if (QUESTIONS.length >= 30 && perDifficulty[d] / QUESTIONS.length < 0.15) warn(`difficulté ${d} : seulement ${perDifficulty[d]}/${QUESTIONS.length} questions (moins de 15 %)`);
  }

  return { errors, warnings, perDomain, perTopic, perDifficulty, total: QUESTIONS.length };
}
