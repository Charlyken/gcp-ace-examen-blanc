/* Écouteurs globaux : clics, clavier, changements de formulaire, sauvegarde en quittant la page. */
import { overlay } from "./dom.js";
import { state } from "./state.js";
import { actions } from "./actions.js";
import { save } from "./session.js";
import { closeDialog, toast } from "./ui/dialog.js";
import { renderReview, refreshChrome } from "./views/quiz.js";
import { renderResults } from "./views/results.js";
import { updatePracticeCount } from "./views/home.js";
import { readProfileForm, previewAvatar } from "./views/profile.js";
import { importData } from "./data-io.js";
import { REDUCED } from "./ui/effects.js";

// Boutons marqués data-delay : l'action part après ce délai, pour laisser voir l'onde au clic avant le changement d'écran.
const CLICK_DELAY_MS = 120;
let pending = false;

export function initEvents() {
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-action]");
    if (el && !el.disabled && actions[el.dataset.action]) {
      if (!el.hasAttribute("data-delay") || REDUCED) return void actions[el.dataset.action](el);
      if (pending) return;                                  // double-clic : une seule navigation
      pending = true;
      setTimeout(() => { pending = false; if (el.isConnected && !el.disabled) actions[el.dataset.action](el); }, CLICK_DELAY_MS);
    } else if (e.target === overlay) closeDialog();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !overlay.hidden) closeDialog(); });

  // Raccourcis clavier pendant les questions : A-E ou 1-5, Entrée, flèches.
  document.addEventListener("keydown", e => {
    if (state.view !== "quiz" || !state.session || !overlay.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target.tagName, k = e.key.toLowerCase();
    if (k.length === 1) {
      const pos = "abcde".indexOf(k) >= 0 ? "abcde".indexOf(k) : "12345".indexOf(k);
      const input = document.querySelectorAll('input[name="opt"]')[pos];
      if (pos >= 0 && input && !input.disabled) { input.click(); e.preventDefault(); }
    } else if (k === "enter" && tag !== "BUTTON" && tag !== "SUMMARY") {
      const b = document.querySelector('#qslot [data-action="validate"]:not(:disabled), #qslot [data-action="next"]');
      if (b) { b.click(); e.preventDefault(); }
    } else if (tag !== "INPUT" && k === "arrowright") actions.next();
    else if (tag !== "INPUT" && k === "arrowleft") actions.prev();
  });

  document.addEventListener("change", e => {
    const t = e.target;
    if (t.name === "opt" && state.session && state.view === "quiz") {            // sélection d'une réponse
      const id = state.session.ids[state.session.current];
      state.session.answers[id] = Array.from(document.querySelectorAll('input[name="opt"]:checked')).map(i => Number(i.value));
      save(); refreshChrome();
      const v = document.getElementById("btn-validate"); if (v) v.disabled = !state.session.answers[id].length;
    } else if (t.closest && t.closest("#domain-chips")) updatePracticeCount();   // filtre par domaine
    else if (t.name === "pf") { state.preFilter = t.value; renderReview(); }           // filtre de vérification
    else if (t.name === "rf") { state.reviewFilter = t.value; renderResults(); }      // filtre de correction
    else if (t.id === "import-file") importData(t.files && t.files[0]);          // import d'une sauvegarde
    else if (t.closest && t.closest("#profile-form")) { readProfileForm(); toast("Profil enregistré"); }   // profil : enregistrement automatique
  });
  document.addEventListener("input", e => { if (e.target.id === "p-name") previewAvatar(); });   // aperçu des initiales en direct
  document.addEventListener("submit", e => { if (e.target.id === "profile-form") e.preventDefault(); });

  // Sauvegarde du temps restant quand l'onglet est quitté ou masqué.
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
}
