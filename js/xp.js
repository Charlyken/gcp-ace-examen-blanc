/* Points d'expérience (XP) et niveaux. Logique pure (aucun DOM, aucun stockage).

   Barème (voir XP_RULES dans config.js) :
   - bonne réponse : +10 XP, une seule fois par question et par jour (rejouer en boucle la même question ne rapporte rien) ;
   - leçon parfaite : +20 XP pour une session d'entraînement d'au moins 5 questions, toutes justes ;
   - révision terminée : +15 XP quand toutes les questions de la série de la « Révision du jour » sont validées ;
   - les deux bonus exigent qu'au moins 5 questions de la session aient rapporté de l'XP : rejouer des questions déjà
     récompensées aujourd'hui ne déclenche aucun bonus ;
   - examen blanc : l'XP des bonnes réponses, sans bonus.
   Niveaux : le niveau n commence à levelBase × n × (n - 1) XP (niveau 2 à 100, 3 à 300, 4 à 600, 5 à 1000…).

   L'état est { total, day, ids } : le total d'XP, le jour courant et les questions déjà récompensées ce jour-là. */
import { XP_RULES, XP_MAX } from "./config.js";
import { isDateKey } from "./utils.js";

export const newXp = () => ({ total: 0, day: "", ids: [] });

/* ---------------- Niveaux ---------------- */

// XP total à partir duquel commence le niveau n (niveau 1 = 0).
export const xpForLevel = n => XP_RULES.levelBase * n * (n - 1);

// Niveau et progression pour un total d'XP : { level, base, next, into, need, pct }.
export function levelFor(total) {
  const t = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0));
  // Résolution de levelBase × n × (n - 1) <= t ; exacte sur toute la plage utile (testé à chaque frontière).
  const level = Math.max(1, Math.floor((1 + Math.sqrt(1 + 4 * t / XP_RULES.levelBase)) / 2));
  const base = xpForLevel(level), next = xpForLevel(level + 1);
  return { level, base, next, into: t - base, need: next - base, pct: Math.floor((t - base) / (next - base) * 100) };
}

/* ---------------- Attribution ---------------- */

// Rend un état valide à partir de n'importe quelle donnée (stockage, import).
export function normalizeXp(raw, today) {
  if (!raw || typeof raw !== "object") return newXp();
  const total = Number.isFinite(raw.total) ? Math.min(XP_MAX, Math.max(0, Math.floor(raw.total))) : 0;
  const day = isDateKey(raw.day) ? raw.day : "";
  const ids = day === today && Array.isArray(raw.ids) ? [...new Set(raw.ids.filter(id => typeof id === "string" && id))].slice(0, 5000) : [];
  return { total, day: day === today ? day : "", ids };
}

// XP d'une réponse validée. Renvoie le nouvel état et l'XP gagné (0 si fausse, ou si la question a déjà rapporté de l'XP aujourd'hui).
export function awardAnswer(xp, id, ok, today) {
  const sameDay = xp.day === today;
  const ids = sameDay ? xp.ids : [];
  if (!ok || ids.includes(id)) return { xp: { ...xp, day: today, ids }, gained: 0 };
  return { xp: { total: Math.min(XP_MAX, xp.total + XP_RULES.answer), day: today, ids: [...ids, id] }, gained: XP_RULES.answer };
}

// Ajoute des XP (bonus) sans toucher au suivi des questions.
export const addXp = (xp, amount) => ({ ...xp, total: Math.min(XP_MAX, xp.total + Math.max(0, Math.floor(amount) || 0)) });

// Bonus d'une session d'entraînement terminée.
//   s = { mode, kind, total (questions de la session), validated, correct, earned (questions ayant rapporté de l'XP) }
export function sessionBonuses(s) {
  if (s.mode !== "practice") return [];
  const out = [];
  if (s.kind === "review" && s.total > 0 && s.validated >= s.total) out.push({ key: "review", label: "Révision terminée", xp: XP_RULES.review });
  // `earned` <= nombre de réponses justes validées : earned >= perfectMin implique donc au moins perfectMin questions.
  if (s.correct === s.validated && s.earned >= XP_RULES.perfectMin) out.push({ key: "perfect", label: "Leçon parfaite", xp: XP_RULES.perfect });
  return out;
}

/* ---------------- Suivi d'XP d'une session ---------------- */

// { start: total d'XP au départ, answers: XP des réponses, earned: nombre de questions qui ont rapporté de l'XP,
//   gain: XP par question, bonuses: bonus de fin, total: XP de la session, end: total d'XP à la fin }
export const newSessionXp = (start = 0) => ({ start, answers: 0, earned: 0, gain: {}, bonuses: [], total: 0, end: 0 });

// Ajoute le résultat d'une réponse validée au suivi de session (sans modifier l'original).
export function recordAnswerXp(summary, id, gained) {
  return { ...summary, answers: summary.answers + gained, earned: summary.earned + (gained > 0 ? 1 : 0), gain: { ...summary.gain, [id]: gained } };
}

// Règle la fin d'une session. `results` = { items: [{ id, status }], ok, total } (voir compute dans logic.js).
// Examen : XP des bonnes réponses, sans bonus. Entraînement : bonus (les XP des réponses ont été attribués une à une).
// Renvoie { xp: nouvel état global, summary: suivi de session complété }.
export function settleSessionXp(xpState, session, results, today) {
  let xp = xpState, summary = { ...(session.xp || newSessionXp(xpState.total)) };
  if (session.mode === "exam") {
    for (const item of results.items) {
      const r = awardAnswer(xp, item.id, item.status === "ok", today);
      xp = r.xp; summary = recordAnswerXp(summary, item.id, r.gained);
    }
  } else {
    summary.bonuses = sessionBonuses({ mode: session.mode, kind: session.kind, total: session.ids.length, validated: results.total, correct: results.ok, earned: summary.earned });
    xp = addXp(xp, summary.bonuses.reduce((n, b) => n + b.xp, 0));
  }
  summary.total = summary.answers + summary.bonuses.reduce((n, b) => n + b.xp, 0);
  summary.end = xp.total;
  return { xp, summary };
}

// Lignes du barème affichées dans l'application (une seule source : XP_RULES).
export const xpRulesText = () => [
  `+${XP_RULES.answer} XP par bonne réponse, une fois par question et par jour`,
  `+${XP_RULES.perfect} XP pour une leçon parfaite (au moins ${XP_RULES.perfectMin} questions, toutes justes)`,
  `+${XP_RULES.review} XP quand une révision du jour est terminée`,
  `Les bonus demandent au moins ${XP_RULES.perfectMin} questions qui rapportent de l'XP : rejouer les mêmes questions n'en rapporte pas`
];
