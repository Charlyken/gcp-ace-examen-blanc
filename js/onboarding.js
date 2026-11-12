/* Onboarding : accueil du premier lancement, test de niveau et plan personnalisé. Logique pure (aucun DOM).

   Déroulé : au tout premier lancement, un écran propose de fixer son objectif (date d'examen, score visé, questions par jour)
   puis de passer un test de niveau de 10 questions (2 par domaine). Tout est facultatif et ne revient jamais tout seul :
   dès que l'utilisateur choisit (faire le test ou passer), l'état `status` est enregistré.
   Le test est une session d'entraînement (`kind: "placement"`) : chaque réponse alimente les cartes de révision, donc la
   maîtrise par domaine du tableau de bord est initialisée par le test lui-même.
   L'état est { status: "" | "started" | "skipped" | "done", at, placement } où placement résume le résultat par domaine. */
import { PLACEMENT } from "./config.js";
import { DOMAINS } from "./data.js";
import { shuffle, addDays, daysBetween, isDateKey } from "./utils.js";

export const newOnboarding = () => ({ status: "", at: 0, placement: null });
const STATUSES = ["", "started", "skipped", "done"];

// Rend un état valide à partir de n'importe quelle donnée (stockage, import).
export function normalizeOnboarding(raw) {
  if (!raw || typeof raw !== "object") return newOnboarding();
  const status = STATUSES.includes(raw.status) ? raw.status : "";
  const at = Number.isFinite(raw.at) && raw.at > 0 ? Math.floor(raw.at) : 0;
  let placement = null;
  const p = raw.placement;
  if (p && typeof p === "object" && p.byDomain && typeof p.byDomain === "object") {
    const byDomain = {};
    for (const [d, v] of Object.entries(p.byDomain)) {
      if (DOMAINS[d] && v && Number.isInteger(v.total) && Number.isInteger(v.ok) && v.total > 0 && v.ok >= 0 && v.ok <= v.total && v.total <= 1000) byDomain[d] = { ok: v.ok, total: v.total };
    }
    const total = Object.values(byDomain).reduce((n, v) => n + v.total, 0), ok = Object.values(byDomain).reduce((n, v) => n + v.ok, 0);
    if (total >= PLACEMENT.minForLevel) placement = { pct: Math.round(ok / total * 100), total, byDomain, at: Number.isFinite(p.at) ? Math.floor(p.at) : 0 };
  }
  return { status, at, placement };
}

// Faut-il afficher l'accueil d'onboarding ? Seulement pour un tout nouvel utilisateur : jamais s'il a déjà choisi,
// ni s'il a déjà des données (statistiques, examens, activité) : un utilisateur existant n'est jamais dérangé.
export function shouldOnboard({ onboarding, stats, history, activity }) {
  const empty = o => !o || Object.keys(o).length === 0;
  return !onboarding.status && empty(stats) && (history || []).length === 0 && empty(activity);
}

/* ---------------- Choix des questions ---------------- */

// 10 questions : une part égale par domaine, dans chaque domaine une plus facile et une plus difficile quand c'est possible.
// Les questions jamais vues sont préférées (utile pour refaire le test plus tard).
export function pickPlacement({ questions, stats = {}, size = PLACEMENT.size }) {
  const domains = [...new Set(questions.map(q => q.domain))].sort((a, b) => a - b);
  if (!domains.length || size <= 0) return { ids: [] };
  const perDomain = Math.floor(size / domains.length);
  const unseenFirst = qs => shuffle(qs).sort((a, b) => (stats[a.id] ? 1 : 0) - (stats[b.id] ? 1 : 0));
  const picked = [], seen = new Set();
  const add = q => { if (q && !seen.has(q.id) && picked.length < size) { seen.add(q.id); picked.push(q.id); return true; } return false; };
  for (const d of domains) {
    const pool = unseenFirst(questions.filter(q => q.domain === d));
    let n = 0;
    if (perDomain > 0 && pool.length) { add(pool[0]); n++; }
    // la deuxième question est de difficulté différente de la première si possible
    const first = pool[0];
    const rest = pool.slice(1);
    const other = first && rest.find(q => q.difficulty !== first.difficulty);
    for (const q of [other, ...rest]) { if (n >= perDomain) break; if (q && add(q)) n++; }
  }
  for (const q of unseenFirst(questions)) { if (picked.length >= size) break; add(q); }   // complète si un domaine manquait de questions
  return { ids: shuffle(picked) };
}

/* ---------------- Niveau et plan ---------------- */

// Niveau estimé à partir du pourcentage de réussite au test (estimation sur peu de questions).
export function levelOf(pct) {
  return pct >= PLACEMENT.solidFrom ? { key: "solid", label: "Solide" } : pct >= PLACEMENT.buildingFrom ? { key: "building", label: "En construction" } : { key: "starter", label: "Découverte" };
}

// Résumé d'un test à partir des résultats de la session (voir compute dans logic.js) ; null si le test est trop court.
export function summarizePlacement(results) {
  if (!results || results.total < PLACEMENT.minForLevel) return null;
  const byDomain = {};
  for (const [d, v] of Object.entries(results.byDomain || {})) if (v.total > 0) byDomain[d] = { ok: v.ok, total: v.total };
  return { pct: results.pct, total: results.total, byDomain };
}

// État après un test terminé (ou trop court : il reste « started »).
export function completePlacement(onboarding, summary, now) {
  if (!summary) return onboarding.status === "" ? { ...onboarding, status: "started", at: now } : onboarding;
  return { status: "done", at: now, placement: { ...summary, at: now } };
}
export const markOnboarding = (onboarding, status, now) => onboarding.status === "done" ? onboarding : { ...onboarding, status, at: now };

const day = (key, opts) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString("fr-FR", opts); };
const plural = n => n > 1 ? "s" : "";

/* Plan personnalisé à partir du résultat du test, du profil et de l'avancement.
   `seen` = nombre de questions déjà répondues, `bankSize` = taille de la banque. Renvoie null sans résultat de test.
   { level, pct, weakest: [{ d, name, pct }], daysLeft, daysToCover, firstExamOn, steps: [{ key, text, action? }] } */
export function buildPlan({ placement, profile, today, bankSize, seen }) {
  if (!placement) return null;
  const level = levelOf(placement.pct);
  const ranked = Object.entries(placement.byDomain)
    .map(([d, v]) => ({ d: Number(d), name: DOMAINS[d].short, pct: Math.round(v.ok / v.total * 100), weight: DOMAINS[d].weight }))
    .sort((a, b) => a.pct - b.pct || b.weight - a.weight || a.d - b.d);
  const weakest = ranked.filter(r => r.pct < 100).slice(0, 2).map(({ d, name, pct }) => ({ d, name, pct }));
  const daysLeft = isDateKey(profile.examDate) ? daysBetween(today, profile.examDate) : null;   // null sans date ; négatif si passée
  const upcoming = daysLeft !== null && daysLeft > 0;
  const unseen = Math.max(0, bankSize - seen);
  const daily = Math.max(1, profile.daily || 1);
  const daysToCover = Math.ceil(unseen / daily);
  const firstExamOn = upcoming && daysLeft > 14 ? addDays(today, daysLeft - 14) : null;

  const steps = [{ key: "daily", text: `Chaque jour : ta révision du jour, puis une leçon courte (environ 5 minutes). Objectif : ${daily} question${plural(daily)} par jour.` }];
  if (weakest.length) {
    steps.push({ key: "focus", text: `Commence par ${weakest.map(w => `« ${w.name} »`).join(" et ")} : ce sont tes domaines les moins solides pour l'instant.`, action: { name: "practice-domain", d: weakest[0].d, label: `S'entraîner sur « ${weakest[0].name} »` } });
  } else {
    steps.push({ key: "focus", text: "Tous les domaines sont solides sur ce test : garde le rythme et passe vite à l'examen blanc pour confirmer." });
  }
  if (unseen > 0) {
    const tight = upcoming && daysToCover > Math.max(0, daysLeft - 7);
    steps.push({ key: "coverage", text: upcoming
      ? `Il te reste ${unseen} question${plural(unseen)} à découvrir : au rythme de ${daily} par jour, c'est ${daysToCover} jour${plural(daysToCover)} pour tout voir, et ton examen est dans ${daysLeft} jour${plural(daysLeft)}${tight ? ". Pense à augmenter ton objectif quotidien." : "."}`
      : `Il te reste ${unseen} question${plural(unseen)} à découvrir : au rythme de ${daily} par jour, tu auras tout vu en ${daysToCover} jour${plural(daysToCover)}.` });
  }
  steps.push({ key: "exam", text: !upcoming
    ? "Passe un premier examen blanc quand tes leçons dépassent régulièrement 70 %."
    : firstExamOn
      ? `Planifie ton premier examen blanc vers le ${day(firstExamOn, { day: "numeric", month: "long" })} (deux semaines avant l'examen).`
      : "Ton examen approche : passe un examen blanc dès cette semaine.", action: upcoming && !firstExamOn ? { name: "new-exam", label: "Lancer un examen blanc" } : undefined });
  return { level, pct: placement.pct, total: placement.total, weakest, daysLeft, daysToCover, firstExamOn, steps: steps.map(s => s.action ? s : { key: s.key, text: s.text }) };
}
