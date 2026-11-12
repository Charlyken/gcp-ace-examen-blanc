/* Vue : profil (identité, objectifs, apparence, données). */
import { CONFIG, AVATAR_COLORS, THEMES } from "../config.js";
import { app } from "../dom.js";
import { state, saveProfile, applyTheme } from "../state.js";
import { esc } from "../utils.js";
import { sanitizeProfile, initialsOf } from "../logic.js";
import { IC } from "../ui/icons.js";
import { appbarHTML, levelSectionHTML, installCardHTML } from "./shared.js";

export function renderProfile() {
  const p = state.profile;
  app.innerHTML = `
  ${appbarHTML("profile")}
  <main class="wrap stagger">
    <header style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">
      <span class="tag">Profil</span>
      <h1>Ton profil</h1>
      <p class="muted">Personnalise ton espace et tes objectifs. Tout est enregistré automatiquement dans ce navigateur, sans compte ni serveur.</p>
    </header>
    ${levelSectionHTML()}
    <form id="profile-form" class="pform" autocomplete="off" novalidate>
      <section class="card" aria-labelledby="h-id">
        <h2 id="h-id">Identité</h2>
        <div class="prof-grid">
          <div class="avatar-pick">
            <span class="avatar xl d${p.color}" id="avatar-preview" aria-hidden="true">${esc(initialsOf(state.profile.name))}</span>
            <div class="swatches" role="radiogroup" aria-label="Couleur de l'avatar">
              ${AVATAR_COLORS.map(c => `<label class="swatch d${c}"><input type="radio" name="color" value="${c}" ${c === p.color ? "checked" : ""} aria-label="Couleur ${c}"><span></span></label>`).join("")}
            </div>
          </div>
          <div class="fields">
            <label class="field"><span>Prénom ou pseudo</span><input type="text" name="name" id="p-name" maxlength="30" value="${esc(p.name)}" placeholder="Ex. Alex"></label>
            <label class="field"><span>Date de l'examen</span><input type="date" name="examDate" value="${esc(p.examDate)}"><small>Le compte à rebours s'affiche sur l'accueil et le tableau de bord.</small></label>
          </div>
        </div>
      </section>
      <section class="card" aria-labelledby="h-obj">
        <h2 id="h-obj">Objectifs</h2>
        <div class="fields two">
          <label class="field"><span>Score visé (%)</span><input type="number" name="target" inputmode="numeric" min="50" max="100" step="1" value="${p.target}"><small>Le seuil indicatif de réussite reste à ${CONFIG.passPct} %.</small></label>
          <label class="field"><span>Questions par jour</span><input type="number" name="daily" inputmode="numeric" min="1" max="200" step="1" value="${p.daily}"><small>Objectif quotidien suivi sur le tableau de bord.</small></label>
        </div>
      </section>
      <section class="card" aria-labelledby="h-pref">
        <h2 id="h-pref">Apparence</h2>
        <div class="chips" role="radiogroup" aria-label="Thème">
          ${Object.entries(THEMES).map(([k, l]) => `<label class="chip"><input type="radio" name="theme" value="${k}" ${p.theme === k ? "checked" : ""}><span>${l}</span></label>`).join("")}
        </div>
        <p class="small muted">« Système » suit le réglage clair ou sombre de ton appareil.</p>
      </section>
    </form>
    ${installCardHTML()}
    <section class="card" aria-labelledby="h-data">
      <h2 id="h-data">Tes données</h2>
      <p class="small muted">Statistiques, historique et profil sont stockés uniquement dans ce navigateur. Exporte-les pour les sauvegarder ou les transférer sur un autre appareil.</p>
      <div class="row">
        <button class="btn" data-action="export">${IC.download} Exporter (JSON)</button>
        <button class="btn" data-action="import">${IC.upload} Importer un export</button>
        <input type="file" id="import-file" accept="application/json,.json" class="sr" tabindex="-1" aria-hidden="true">
        <button class="btn btn-danger" data-action="ask-reset">Réinitialiser la progression</button>
      </div>
    </section>
  </main>`;
}
// Lit le formulaire, nettoie, enregistre et répercute (thème, avatar, champs numériques corrigés).
export function readProfileForm() {
  const f = document.getElementById("profile-form"); if (!f) return;
  const v = n => f.elements[n] ? f.elements[n].value : undefined;
  state.profile = sanitizeProfile({ name: v("name"), color: v("color"), target: v("target"), examDate: v("examDate"), daily: v("daily"), theme: v("theme") });
  saveProfile(); applyTheme();
  if (f.elements.target) f.elements.target.value = state.profile.target;
  if (f.elements.daily) f.elements.daily.value = state.profile.daily;
  previewAvatar();
}
export function previewAvatar() {
  const f = document.getElementById("profile-form");
  const name = f && f.elements.name ? f.elements.name.value : state.profile.name;
  const color = f && f.elements.color && f.elements.color.value ? Number(f.elements.color.value) : state.profile.color;
  const ini = initialsOf(name);
  document.querySelectorAll("#avatar-preview, .appbar .avatar").forEach(a => { a.className = a.className.replace(/\bd\d\b/, "d" + color); a.textContent = ini; });
}
