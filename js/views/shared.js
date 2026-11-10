/* Éléments communs aux vues principales : barre de navigation. */
import { state } from "../state.js";
import { esc } from "../utils.js";
import { initialsOf } from "../logic.js";
import { IC } from "../ui/icons.js";

const NAV = [["home", "Accueil"], ["dashboard", "Tableau de bord"], ["profile", "Profil"]];
export function appbarHTML(active) {
  const profile = state.profile;
  return `<div class="strip"></div>
    <nav class="appbar" aria-label="Navigation principale"><div class="appbar-in">
      <span class="brand">${IC.cloud}<span>GCP ACE</span></span>
      <div class="navlinks">${NAV.map(([v, l]) => `<button class="navlink${active === v ? " on" : ""}" data-action="nav" data-view="${v}"${active === v ? ' aria-current="page"' : ""}>${l}</button>`).join("")}</div>
      <button class="avatar-btn" data-action="nav" data-view="profile" aria-label="Ouvrir le profil"><span class="avatar d${profile.color}">${esc(initialsOf(profile.name))}</span></button>
    </div></nav>`;
}

// Lien vers la documentation officielle qui justifie la réponse (vide si la question n'en a pas).
export function docLinkHTML(q) {
  if (!q.doc) return "";
  return `<a class="doclink" href="${esc(q.doc)}" target="_blank" rel="noopener noreferrer">Voir la documentation officielle${IC.external}<span class="sr"> (s'ouvre dans un nouvel onglet)</span></a>`;
}
