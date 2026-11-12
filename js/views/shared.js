/* Éléments communs aux vues principales : barre de navigation. */
import { state } from "../state.js";
import { Q_BY_ID } from "../data.js";
import { esc, dayKey, whenText } from "../utils.js";
import { initialsOf } from "../logic.js";
import { reviewPlan } from "../srs.js";
import { dayStreak, streakSummary } from "../streak.js";
import { levelFor, xpRulesText } from "../xp.js";
import { installText } from "../install.js";
import { buildPlan } from "../onboarding.js";
import { QUESTIONS } from "../data.js";
import { pwaStatus, onPwaChange } from "../pwa.js";
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

// Série de jours à la date du jour, selon l'objectif quotidien actuel du profil (voir streak.js).
export const currentStreak = () => dayStreak(state.activity, dayKey(), state.profile.daily);

// Carte « série » de l'accueil : jours d'affilée, avancement de l'objectif du jour, jour de repos.
export function streakSectionHTML() {
  const info = currentStreak(), t = streakSummary(info);
  const p = Math.min(info.todayN, info.todayGoal);
  return `<section class="card streak" aria-labelledby="h-streak">
    <div class="review-main">
      <span class="mode-ic fire">${IC.fire}</span>
      <div class="review-text">
        <h2 id="h-streak">${t.title}</h2>
        <p class="small muted">${t.sub}</p>
        ${t.rest ? `<p class="small muted">${t.rest}</p>` : ""}
      </div>
    </div>
    <div class="goal-line">
      <div class="row spread"><strong class="small">Objectif du jour</strong><span class="small num muted">${info.todayN}/${info.todayGoal} questions</span></div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${info.todayGoal}" aria-valuenow="${p}" aria-label="Objectif quotidien"><i class="${info.todayDone ? "ok" : ""}" style="width:${Math.round(p / info.todayGoal * 100)}%"></i></div>
    </div>
  </section>`;
}

// Carte « niveau » (tableau de bord et profil) : niveau, XP total, progression vers le niveau suivant, barème.
export function levelSectionHTML() {
  const total = state.xp.total, L = levelFor(total);
  return `<section class="card level" aria-labelledby="h-level">
    <div class="review-main">
      <span class="mode-ic xp">${IC.star}</span>
      <div class="review-text">
        <h2 id="h-level">Niveau ${L.level}</h2>
        <p class="small muted"><b class="num">${total}</b> XP au total · encore <b class="num">${L.need - L.into}</b> XP pour le niveau ${L.level + 1}</p>
      </div>
    </div>
    <div class="goal-line">
      <div class="row spread"><strong class="small">Vers le niveau ${L.level + 1}</strong><span class="small num muted">${L.into}/${L.need} XP</span></div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${L.need}" aria-valuenow="${L.into}" aria-label="Progression vers le niveau ${L.level + 1}"><i style="width:${L.pct}%"></i></div>
    </div>
    <details class="xp-rules"><summary class="small">Comment gagner de l'XP ?</summary><ul class="small muted">${xpRulesText().map(t => `<li>${esc(t)}</li>`).join("")}</ul></details>
  </section>`;
}

// Carte « Installer l'application » (profil) : installation, mode hors ligne, étapes pour iOS.
export function installCardHTML() {
  const { mode, ready } = pwaStatus(), t = installText(mode, ready);
  return `<section class="card" id="install-card" aria-labelledby="h-install">
    <h2 id="h-install">${esc(t.title)}</h2>
    <p class="small muted">${esc(t.text)}</p>
    ${t.steps.length ? `<ol class="small muted install-steps">${t.steps.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
    ${t.button ? `<div class="row"><button class="btn btn-primary" data-action="install" type="button">${esc(t.button)}</button></div>` : ""}
  </section>`;
}
// Quand l'état PWA change (invite d'installation reçue, hors ligne prêt), on remplace la carte si elle est affichée.
onPwaChange(() => { const el = document.getElementById("install-card"); if (el) el.outerHTML = installCardHTML(); });

// Plan personnalisé issu du test de niveau (voir onboarding.js) ; null si le test n'a pas été fait.
export const currentPlan = () => buildPlan({ placement: state.onboarding.placement, profile: state.profile, today: dayKey(), bankSize: QUESTIONS.length, seen: Object.keys(state.stats).length });

// Carte « Ton plan » : niveau estimé et étapes ; sans test, invitation à le passer (le tableau de bord n'est jamais vide de conseil).
export function planSectionHTML() {
  const plan = currentPlan();
  if (!plan) {
    return `<section class="card" aria-labelledby="h-plan0">
      <div class="review-main">
        <span class="mode-ic">${IC.target}</span>
        <div class="review-text"><h2 id="h-plan0">Premiers pas</h2><p class="small muted">Passe le test de niveau (10 questions, environ 5 minutes) : il initialise ta maîtrise par domaine et construit ton plan d'entraînement.</p></div>
        <div class="review-cta"><button class="btn btn-primary" data-action="retake-placement">Faire le test de niveau ${IC.next}</button></div>
      </div>
    </section>`;
  }
  return `<section class="card" aria-labelledby="h-plan">
    <div class="row spread"><h2 id="h-plan">Ton plan</h2><span class="pill mini ${plan.level.key === "solid" ? "ok" : ""}">Niveau estimé : ${esc(plan.level.label)} · <span class="num">${plan.pct} %</span></span></div>
    <ol class="plan-steps">${plan.steps.map(st => `<li><span>${esc(st.text)}</span>${st.action ? `<button class="btn btn-sm" data-action="${st.action.name}"${st.action.d ? ` data-d="${st.action.d}"` : ""}>${esc(st.action.label)}</button>` : ""}</li>`).join("")}</ol>
    <p class="small muted">Estimation faite sur ${plan.total} questions du test de niveau. <button class="btn btn-ghost btn-sm" data-action="retake-placement" type="button">Refaire le test</button></p>
  </section>`;
}
