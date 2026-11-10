/* État partagé de l'application. Un seul objet mutable : les modules lisent et écrivent `state.xxx`. */
import { KEYS } from "./config.js";
import { store, migrateStorage } from "./storage.js";
import { sanitizeProfile } from "./logic.js";
import { normalizeStats, needsMigration, reviewCard } from "./srs.js";
import { addActivity } from "./streak.js";
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
  profile: sanitizeProfile(store.get(KEYS.profile))
};

export function record(id, ok) {
  state.stats[id] = reviewCard(state.stats[id], ok, dayKey());
  const k = dayKey(); state.activity[k] = addActivity(state.activity[k], ok, state.profile.daily);
}
export const saveStats = () => { store.set(KEYS.stats, state.stats); store.set(KEYS.activity, state.activity); };
export const saveProfile = () => store.set(KEYS.profile, state.profile);
export function applyTheme() {
  if (state.profile.theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", state.profile.theme);
}

// Migration unique : on réenregistre tout de suite, pour que la date de départ du planning reste celle d'aujourd'hui.
if (needsMigration(savedStats)) saveStats();
