/* Série de jours consécutifs (« streak ») et jour de repos. Logique pure (aucun DOM, aucun stockage).

   La série se calcule à partir de l'activité par jour (`state.activity`, déjà exportée avec la progression) :
   { "AAAA-MM-JJ": { n: réponses validées, ok: justes, goal: objectif quotidien du jour } }.

   Règles :
   - Un jour compte quand n >= son objectif. L'objectif est celui enregistré ce jour-là (`goal`), pour qu'un changement
     d'objectif ne réécrive pas le passé ; une donnée d'avant cette règle (sans `goal`) compte dès 1 réponse.
     Pour aujourd'hui, on utilise l'objectif actuel du profil.
   - Aujourd'hui non atteint ne casse pas la série : la journée n'est pas finie.
   - Un jour de repos : un jour manqué est pardonné s'il n'y a pas d'autre jour de repos dans les 6 jours qui l'entourent,
     soit au plus un par période de 7 jours. Il ne compte pas dans la série mais ne la casse pas. Deux jours manqués de suite
     (ou un second jour manqué dans la semaine) cassent la série. Rien n'est stocké : tout se déduit de l'activité.
   - Les jours sont des dates locales ; les changements d'heure n'ont pas d'effet (voir addDays dans utils.js). */
import { addDays } from "./utils.js";

export const REST_GAP = 7;        // distance minimale, en jours, entre deux jours de repos
const MAX_DAYS = 3660;            // garde-fou : dix ans de remontée au plus

const goalOf = a => Number.isFinite(a && a.goal) && a.goal >= 1 ? Math.floor(a.goal) : 1;
const plural = n => n > 1 ? "s" : "";

// Entrée d'activité après une réponse validée (ne modifie pas l'entrée reçue).
export function addActivity(entry, ok, goal) {
  const e = entry || {};
  return { n: (e.n || 0) + 1, ok: (e.ok || 0) + (ok ? 1 : 0), goal: Math.max(1, Math.floor(goal) || 1) };
}

/* Série à la date `today` ("AAAA-MM-JJ") pour l'objectif actuel `todayGoal`. Renvoie :
   count          jours d'affilée (aujourd'hui compris s'il est atteint ; jours de repos exclus)
   todayN, todayGoal, todayDone, remaining   avancement du jour
   rests          jours de repos utilisés dans la série en cours ("AAAA-MM-JJ")
   restAvailable  un jour manqué serait-il pardonné aujourd'hui ?
   nextRestIn     jours avant qu'un nouveau jour de repos soit disponible (0 s'il l'est déjà)
   atRisk         série à protéger : à jouer aujourd'hui, et plus de repos disponible
                  (sans série, il n'y a aucun repos utilisé : jamais à risque) */
export function dayStreak(activity, today, todayGoal) {
  const act = activity && typeof activity === "object" ? activity : {};
  const goalToday = Math.max(1, Math.floor(todayGoal) || 1);
  const met = (k, goal) => { const a = act[k]; return !!a && Number.isFinite(a.n) && a.n >= goal; };   // goal >= 1 : n > 0 implicite
  const todayN = act[today] && Number.isFinite(act[today].n) ? Math.max(0, act[today].n) : 0;

  let count = 0, lastMetIdx = -1;
  const restIdx = [];
  for (let i = 0; i < MAX_DAYS; i++) {
    const k = addDays(today, -i);
    if (met(k, i === 0 ? goalToday : goalOf(act[k]))) { count++; lastMetIdx = i; continue; }
    if (i === 0) continue;                                    // aujourd'hui : la journée n'est pas finie
    const lastRest = restIdx.length ? restIdx[restIdx.length - 1] : -Infinity;
    if (i - lastRest >= REST_GAP) { restIdx.push(i); continue; }   // jour de repos
    break;                                                     // deuxième jour manqué trop proche : la série s'arrête
  }
  // Un jour de repos au bout de la série (rien avant) n'en fait pas partie.
  const rests = restIdx.filter(i => i < lastMetIdx);
  const restAvailable = rests.every(i => i >= REST_GAP);
  const todayDone = todayN >= goalToday;
  return {
    count, todayN, todayGoal: goalToday, todayDone, remaining: Math.max(0, goalToday - todayN),
    rests: rests.map(i => addDays(today, -i)).reverse(),
    restAvailable,
    nextRestIn: restAvailable ? 0 : REST_GAP - Math.min(...rests),
    atRisk: !todayDone && !restAvailable
  };
}

// Textes d'affichage (accueil et tableau de bord) : { title, sub, rest }.
export function streakSummary(info) {
  const { count, todayN, todayGoal, todayDone, remaining, restAvailable, nextRestIn, atRisk } = info;
  const q = n => `${n} question${plural(n)}`;
  let title, sub;
  if (count > 0) {
    title = `${count} jour${plural(count)} d'affilée`;
    sub = todayDone ? `Objectif du jour atteint (${todayN}/${todayGoal}). Reviens demain !`
      : atRisk ? `Valide encore ${q(remaining)} aujourd'hui pour garder ta série.`
      : `Encore ${q(remaining)} aujourd'hui pour prolonger ta série.`;
  } else {
    title = "Pas de série en cours";
    sub = todayN > 0 ? `Encore ${q(remaining)} aujourd'hui pour lancer ta série.` : `Valide ${q(todayGoal)} aujourd'hui pour lancer ta série.`;
  }
  const rest = count === 0 ? ""
    : restAvailable ? "Un jour de repos par semaine protège ta série : il est disponible."
    : `Jour de repos utilisé : le prochain sera disponible dans ${nextRestIn} jour${plural(nextRestIn)}.`;
  return { title, sub, rest };
}
