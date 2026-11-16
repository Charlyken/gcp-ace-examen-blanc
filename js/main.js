/* Point d'entrée : branche les écouteurs puis affiche la vue initiale. */
import { state, applyTheme } from "./state.js";
import { store } from "./storage.js";
import { KEYS } from "./config.js";
import { shouldOnboard } from "./onboarding.js";
import { render } from "./router.js";
import { initEvents } from "./events.js";
import { initEffects } from "./ui/effects.js";
import { initPwa } from "./pwa.js";

initEffects();
initEvents();
applyTheme();
// Tout nouvel utilisateur (aucune donnée, aucun choix déjà fait) commence par l'accueil d'onboarding ; personne d'autre n'y est conduit.
if (shouldOnboard({ onboarding: state.onboarding, stats: state.stats, history: store.get(KEYS.history), activity: state.activity })) state.view = "welcome";
render();
initPwa();
