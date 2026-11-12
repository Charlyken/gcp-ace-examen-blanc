/* État partagé de l'application. Un seul objet mutable : les modules lisent et écrivent `state.xxx`. */
import { KEYS } from "./config.js";
import { store, migrateStorage } from "./storage.js";
import { sanitizeProfile } from "./logic.js";
import { normalizeStats, needsMigration, reviewCard } from "./srs.js";
import { addActivity } from "./streak.js";
import { normalizeXp, awardAnswer } from "./xp.js";
import { normalizeOnboarding } from "./onboarding.js";
import { dayKey } from "./utils.js";

migrateStorage();
const savedStats = store.get(KEYS.stats) || {};

export const state = {
  view: "home",            // home | dashboard | profile | quiz | review | results
  session: null,           // session en cours d'affichage
  timerId: null, endTime: 0,
  reviewFilter: "wrong",
  preFilter: "all",        // filtre de l'écran de vérification avant envoi
  slide: "",               // sens de l'animation de la prochaine question : "next" | "prev" | ""
  celebrate: false,        // lance compteur + confettis au premier affichage des résultats
  // Une carte de révision par question vue, toutes sessions confondues : { id: { n, ok, ease, interval, reps, due, last, hist } }
  // (détail dans srs.js). Les entrées d'avant la répétition espacée ({ n, ok }) sont migrées ci-dessous.
  stats: normalizeStats(savedStats, dayKey()),
  // Activité par jour : { "AAAA-MM-JJ": { n: réponses validées, ok: bonnes réponses, goal: objectif quotidien du jour } }
  // (la série de jours en est déduite, voir streak.js)
  activity: store.get(KEYS.activity) || {},
  profile: sanitizeProfile(store.get(KEYS.profile)),
  // Points d'expérience : { total, day, ids } (ids = questions déjà récompensées le jour `day`), voir xp.js
  xp: normalizeXp(store.get(KEYS.xp), dayKey()),
  // Onboarding : { status, at, placement } (voir onboarding.js)
  onboarding: normalizeOnboarding(store.get(KEYS.onboarding))
};

export function record(id, ok) {
  state.stats[id] = reviewCard(state.stats[id], ok, dayKey());
  const k = dayKey(); state.activity[k] = addActivity(state.activity[k], ok, state.profile.daily);
}
// XP d'une réponse validée : met à jour l'état et renvoie l'XP gagné (0 si fausse ou déjà récompensée aujourd'hui).
export function awardXp(id, ok) {
  const r = awardAnswer(state.xp, id, ok, dayKey());
  state.xp = r.xp;
  return r.gained;
}
// Enregistre la progression : statistiques, activité et points d'expérience.
export const saveStats = () => { store.set(KEYS.stats, state.stats); store.set(KEYS.activity, state.activity); store.set(KEYS.xp, state.xp); };
export const saveProfile = () => store.set(KEYS.profile, state.profile);
export const saveOnboarding = () => store.set(KEYS.onboarding, state.onboarding);
export function applyTheme() {
  if (state.profile.theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", state.profile.theme);
}

// Migration unique : on réenregistre tout de suite, pour que la date de départ du planning reste celle d'aujourd'hui.
if (needsMigration(savedStats)) saveStats();
