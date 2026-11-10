/* Répétition espacée : planning de révision par question. Logique pure (aucun DOM, aucun stockage).

   Une « carte » est l'entrée de `state.stats` pour une question :
     {
       n,         // nombre de réponses validées (toutes sessions)
       ok,        // dernier résultat : true = juste
       ease,      // facilité (multiplicateur d'intervalle), de SRS.minEase à SRS.maxEase
       interval,  // dernier intervalle, en jours
       reps,      // réussites consécutives depuis la dernière erreur
       due,       // prochaine révision, clé "AAAA-MM-JJ"
       last,      // date de la dernière réponse ("" si inconnue : donnée migrée)
       hist       // derniers résultats, du plus ancien au plus récent : 1 = juste, 0 = faux
     }
   Les champs `n` et `ok` existaient avant ce modèle : le reste est ajouté sans casser leurs lecteurs.

   Règles (SM-2 simplifié, réponse binaire) :
   - erreur : reps = 0, intervalle 1 jour, facilité - 0,32 (plancher 1,3). Pas de pénalité répétée le même jour.
   - réussite à l'échéance (ou nouvelle question) : intervalle 1, puis 6, puis intervalle × facilité, plafonné.
   - réussite avant l'échéance (entraînement libre, revue des erreurs) : comptée dans n/ok/hist, mais le planning
     ne bouge pas : on ne gagne pas d'intervalle en révisant trop tôt. */
import { SRS } from "./config.js";
import { addDays, daysBetween, isDateKey } from "./utils.js";

const round2 = x => Math.round(x * 100) / 100;
const int = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(v)));

// Vrai si l'entrée contient déjà un planning complet (sinon c'est une donnée d'avant la répétition espacée).
export const hasSchedule = c =>
  !!c && typeof c === "object" && isDateKey(c.due) && Number.isFinite(c.ease) && Number.isFinite(c.interval) && Number.isFinite(c.reps);

// Une question est à réviser quand son échéance est atteinte ; sans carte (jamais vue), elle n'est pas « due ».
export const isDue = (card, today) => !!card && card.due <= today;

// Met à jour la carte après une réponse validée ; renvoie une nouvelle carte (l'ancienne n'est pas modifiée).
export function reviewCard(prev, ok, today) {
  const base = prev || { n: 0, ok: false, ease: SRS.startEase, interval: 0, reps: 0, due: today, last: "", hist: [] };
  const next = { ...base, n: base.n + 1, ok: !!ok, last: today, hist: [...(base.hist || []), ok ? 1 : 0].slice(-SRS.historyMax) };
  if (!ok) {
    const alreadyFailedToday = prev && prev.last === today && !prev.ok;
    next.ease = alreadyFailedToday ? base.ease : round2(Math.max(SRS.minEase, base.ease + SRS.lapseEaseDelta));
    next.reps = 0; next.interval = 1; next.due = addDays(today, 1);
  } else if (!prev || base.due <= today) {
    next.reps = base.reps + 1;
    next.interval = base.reps === 0 ? 1 : base.reps === 1 ? SRS.secondInterval : Math.min(SRS.maxIntervalDays, Math.round(base.interval * base.ease));
    next.due = addDays(today, next.interval);
  }
  return next;
}

// Rend une entrée valide à partir de n'importe quelle donnée (stockage, import) ; null si elle est inutilisable.
// Une entrée d'avant la répétition espacée ({ n, ok }) est migrée : juste -> à revoir demain, fausse -> à revoir aujourd'hui.
export function normalizeCard(raw, today) {
  if (!raw || typeof raw !== "object" || !Number.isFinite(raw.n)) return null;
  const n = int(raw.n, 0, 1e6), ok = !!raw.ok;
  if (!hasSchedule(raw)) {
    return { n, ok, ease: SRS.startEase, interval: 1, reps: ok ? 1 : 0, due: ok ? addDays(today, 1) : today, last: "", hist: [ok ? 1 : 0] };
  }
  return {
    n, ok,
    ease: round2(Math.min(SRS.maxEase, Math.max(SRS.minEase, raw.ease))),
    interval: int(raw.interval, 1, SRS.maxIntervalDays),
    reps: int(raw.reps, 0, 1e4),
    due: raw.due,
    last: isDateKey(raw.last) ? raw.last : "",
    hist: Array.isArray(raw.hist) ? raw.hist.filter(h => h === 0 || h === 1).slice(-SRS.historyMax) : [ok ? 1 : 0]
  };
}

// Normalise toutes les cartes d'un objet { idQuestion: carte } ; `isKnownId` (optionnel) écarte les questions retirées.
export function normalizeStats(raw, today, isKnownId) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [id, v] of Object.entries(raw)) {
    if (isKnownId && !isKnownId(id)) continue;
    const card = normalizeCard(v, today);
    if (card) out[id] = card;
  }
  return out;
}

// Vrai si au moins une entrée est encore au format d'avant la répétition espacée (donc à migrer puis réenregistrer).
export const needsMigration = raw =>
  !!raw && typeof raw === "object" && Object.values(raw).some(v => v && typeof v === "object" && !hasSchedule(v));

/* ---------------- Révision du jour ---------------- */

// Identifiants des questions à réviser (échéance atteinte), les plus en retard d'abord ;
// à retard égal, les plus difficiles (facilité basse) puis l'ordre des identifiants. `isKnownId` écarte les questions retirées.
export function dueIds(stats, today, isKnownId) {
  return Object.entries(stats || {})
    .filter(([id, c]) => (!isKnownId || isKnownId(id)) && isDue(c, today))
    .sort(([ia, a], [ib, b]) => daysBetween(b.due, today) - daysBetween(a.due, today) || a.ease - b.ease || (ia < ib ? -1 : ia > ib ? 1 : 0))
    .map(([id]) => id);
}

// Questions d'une série de révision : les `limit` plus prioritaires.
export const pickReview = (stats, today, limit, isKnownId) => dueIds(stats, today, isKnownId).slice(0, Math.max(0, limit));

// Prochaine échéance après aujourd'hui : { date, days, count } (count = questions prévues ce jour-là), ou null.
export function nextReview(stats, today, isKnownId) {
  const future = Object.entries(stats || {}).filter(([id, c]) => (!isKnownId || isKnownId(id)) && c && c.due > today);
  if (!future.length) return null;
  const date = future.reduce((m, [, c]) => (c.due < m ? c.due : m), future[0][1].due);
  return { date, days: daysBetween(today, date), count: future.filter(([, c]) => c.due === date).length };
}

// Résumé affiché sur l'accueil et le tableau de bord : combien à réviser, taille de la prochaine série
// (plafonnée par l'objectif quotidien `daily`) et prochaine échéance.
export function reviewPlan(stats, today, daily, isKnownId) {
  const due = dueIds(stats, today, isKnownId).length;
  return { due, batch: Math.min(due, Math.max(1, daily)), next: nextReview(stats, today, isKnownId) };
}
