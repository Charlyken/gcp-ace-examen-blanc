/* État partagé de l'application. Un seul objet mutable : les modules lisent et écrivent `state.xxx`. */
import { KEYS } from "./config.js";
import { store, migrateStorage } from "./storage.js";
import { sanitizeProfile } from "./logic.js";
import { dayKey } from "./utils.js";

migrateStorage();

export const state = {
  view: "home",            // home | dashboard | profile | quiz | review | results
  session: null,           // session en cours d'affichage
  timerId: null, endTime: 0,
  reviewFilter: "wrong",
  preFilter: "all",        // filtre de l'écran de vérification avant envoi
  slide: "",               // sens de l'animation de la prochaine question : "next" | "prev" | ""
  celebrate: false,        // lance compteur + confettis au premier affichage des résultats
  // Dernier résultat connu par question, toutes sessions confondues : { id: { n: essais, ok: bool } }
  stats: store.get(KEYS.stats) || {},
  // Activité par jour : { "AAAA-MM-JJ": { n: réponses validées, ok: bonnes réponses } }
  activity: store.get(KEYS.activity) || {},
  profile: sanitizeProfile(store.get(KEYS.profile))
};

export function record(id, ok) {
  const p = state.stats[id] || { n: 0 }; state.stats[id] = { n: p.n + 1, ok: !!ok };
  const k = dayKey(), a = state.activity[k] || { n: 0, ok: 0 }; a.n++; if (ok) a.ok++; state.activity[k] = a;
}
export const saveStats = () => { store.set(KEYS.stats, state.stats); store.set(KEYS.activity, state.activity); };
export const saveProfile = () => store.set(KEYS.profile, state.profile);
export function applyTheme() {
  if (state.profile.theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", state.profile.theme);
}
