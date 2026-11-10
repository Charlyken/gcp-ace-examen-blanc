/* Éléments communs aux vues principales : barre de navigation. */
import { state } from "../state.js";
import { Q_BY_ID } from "../data.js";
import { esc, dayKey, whenText } from "../utils.js";
import { initialsOf } from "../logic.js";
import { reviewPlan } from "../srs.js";
import { loadSession } from "../session.js";
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

// Questions à réviser aujourd'hui selon le planning de répétition espacée (voir srs.js).
export const currentReviewPlan = () => reviewPlan(state.stats, dayKey(), state.profile.daily, id => !!Q_BY_ID[id]);
const s_ = n => n > 1 ? "s" : "";

// Carte « Révision du jour » : série en cours, questions à réviser, ou état vide avec la prochaine échéance.
export function reviewSectionHTML() {
  const plan = currentReviewPlan();
  const prac = loadSession("practice");
  const live = prac && !prac.finished && prac.kind === "review";
  let title = "Révision du jour", text, cta = "";
  if (live) {
    const done = Object.keys(prac.validated).length;
    text = `Série en cours : <b class="num">${done}</b> sur <b class="num">${prac.ids.length}</b> questions validées.`;
    cta = `<button class="btn btn-primary" data-action="resume" data-mode="practice">Reprendre la révision ${IC.next}</button>`;
  } else if (plan.due > 0) {
    title += ` · ${plan.due} question${s_(plan.due)}`;
    text = `Les questions dont l'échéance est arrivée, les plus en retard d'abord.${plan.batch < plan.due ? ` Par séries de ${plan.batch} (ton objectif quotidien).` : ""}`;
    cta = `<button class="btn btn-primary" data-action="new-review">Réviser ${plan.batch} question${s_(plan.batch)} ${IC.next}</button>`;
  } else if (plan.next) {
    text = `<strong>Rien à réviser aujourd'hui.</strong> Prochaine révision ${whenText(plan.next.days)} : <b class="num">${plan.next.count}</b> question${s_(plan.next.count)}.`;
  } else {
    text = `<strong>Aucune question à réviser pour l'instant.</strong> Réponds à quelques questions en entraînement : elles reviendront ici au bon moment, à des intervalles de plus en plus longs.`;
  }
  return `<section class="card review" aria-labelledby="h-rev">
    <div class="review-main">
      <span class="mode-ic">${IC.cal}</span>
      <div class="review-text"><h2 id="h-rev">${title}</h2><p class="small muted">${text}</p></div>
      ${cta ? `<div class="review-cta">${cta}</div>` : ""}
    </div>
  </section>`;
}
