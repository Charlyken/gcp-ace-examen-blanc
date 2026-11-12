/* Point d'entrée : branche les écouteurs puis affiche la vue initiale. */
import { applyTheme } from "./state.js";
import { render } from "./router.js";
import { initEvents } from "./events.js";
import { initEffects } from "./ui/effects.js";
import { initPwa } from "./pwa.js";

initEffects();
initEvents();
applyTheme();
render();
initPwa();
