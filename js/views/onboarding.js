/* Vue : accueil du premier lancement (objectif, puis test de niveau facultatif). */
import { app } from "../dom.js";
import { state, saveProfile } from "../state.js";
import { esc } from "../utils.js";
import { sanitizeProfile } from "../logic.js";
import { PLACEMENT } from "../config.js";
import { IC } from "../ui/icons.js";

export function renderWelcome() {
  const p = state.profile;
  app.innerHTML = `
  <div class="strip"></div>
  <main class="wrap welcome stagger">
    <header class="welcome-head">
      <span class="brand">${IC.cloud}<span>GCP ACE</span></span>
      <h1>Bienvenue</h1>
      <p class="muted">Deux minutes pour personnaliser ton entraînement. Tout est facultatif : tu pourras tout modifier plus tard dans ton profil.</p>
    </header>
    <form id="welcome-form" class="pform" autocomplete="off" novalidate>
      <section class="card" aria-labelledby="h-goal">
        <h2 id="h-goal">1. Ton objectif</h2>
        <div class="fields two">
          <label class="field"><span>Prénom ou pseudo</span><input type="text" name="name" maxlength="30" value="${esc(p.name)}" placeholder="Ex. Alex"></label>
          <label class="field"><span>Date de l'examen</span><input type="date" name="examDate" value="${esc(p.examDate)}"><small>Facultatif. Sert au compte à rebours et à ton plan.</small></label>
          <label class="field"><span>Score visé (%)</span><input type="number" name="target" inputmode="numeric" min="50" max="100" step="1" value="${p.target}"></label>
          <label class="field"><span>Questions par jour</span><input type="number" name="daily" inputmode="numeric" min="1" max="200" step="1" value="${p.daily}"><small>Ton objectif quotidien.</small></label>
        </div>
      </section>
      <section class="card" aria-labelledby="h-test">
        <h2 id="h-test">2. Test de niveau <span class="tag">facultatif</span></h2>
        <p class="small muted">${PLACEMENT.size} questions, 2 par domaine, environ 5 minutes. Tu vois la correction après chaque réponse. Il repère tes points forts et faibles, prépare ton tableau de bord et construit ton plan. Il ne compte pas comme un examen blanc.</p>
        <div class="row">
          <button class="btn btn-primary" type="button" data-action="onboarding-start">Faire le test de niveau ${IC.next}</button>
          <button class="btn" type="button" data-action="onboarding-skip">Passer pour l'instant</button>
        </div>
      </section>
    </form>
  </main>`;
}

// Enregistre l'objectif saisi (valeurs nettoyées : bornes, date valide…).
export function saveWelcomeForm() {
  const f = document.getElementById("welcome-form");
  if (!f) return;
  const v = n => f.elements[n] ? f.elements[n].value : undefined;
  state.profile = sanitizeProfile({ ...state.profile, name: v("name"), examDate: v("examDate"), target: v("target"), daily: v("daily") });
  saveProfile();
}
