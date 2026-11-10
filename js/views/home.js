/* Vue : accueil. */
import { CONFIG, KEYS } from "../config.js";
import { DOMAINS, QUESTIONS } from "../data.js";
import { app } from "../dom.js";
import { state } from "../state.js";
import { store } from "../storage.js";
import { esc, clock, pct } from "../utils.js";
import { examQuota, countdownText } from "../logic.js";
import { loadSession } from "../session.js";
import { IC } from "../ui/icons.js";
import { appbarHTML, reviewSectionHTML, streakSectionHTML, currentReviewPlan } from "./shared.js";

export function renderHome() {
  const exam = loadSession("exam"), prac = loadSession("practice");
  const history = store.get(KEYS.history) || [];
  const dkeys = Object.keys(DOMAINS);
  const counts = dkeys.map(d => QUESTIONS.filter(q => q.domain == d).length);
  const mast = dkeys.map(d => QUESTIONS.filter(q => q.domain == d && state.stats[q.id] && state.stats[q.id].ok).length);
  const errs = QUESTIONS.filter(q => state.stats[q.id] && !state.stats[q.id].ok);
  const multi = QUESTIONS.filter(q => q.correct.length > 1).length;
  const examSize = Math.min(CONFIG.examSize, QUESTIONS.length);
  const examLive = exam && !exam.finished, pracLive = prac && !prac.finished;
  const tried = dkeys.map(d => QUESTIONS.filter(q => q.domain == d && state.stats[q.id]).length);
  const hasStats = tried.some(n => n > 0);
  const quota = examQuota(Object.fromEntries(dkeys.map((d, i) => [d, counts[i]])));
  // Domaine à travailler en priorité : plus faible taux de réussite parmi ceux déjà abordés.
  let weak = -1;
  dkeys.forEach((d, i) => { if (tried[i] && (weak < 0 || mast[i] / counts[i] < mast[weak] / counts[weak])) weak = i; });
  const plan = currentReviewPlan();
  // Action recommandée affichée dans le bandeau (un seul bouton principal).
  const hero = examLive ? { a: "resume", m: "exam", t: "Reprendre l'examen" }
    : pracLive ? { a: "resume", m: "practice", t: prac.kind === "review" ? "Reprendre la révision" : "Reprendre l'entraînement" }
    : !hasStats ? { a: "practice-all", m: "", t: "Commencer l'entraînement" }
    : plan.due ? { a: "new-review", m: "", t: `Révision du jour (${plan.due})` }
    : errs.length ? { a: "new-errors", m: "", t: `Revoir mes erreurs (${errs.length})` }
    : { a: "new-exam", m: "", t: "Lancer un examen blanc" };

  const examBlock = examLive
    ? `<div class="note"><p class="small"><strong>Examen en cours</strong> : ${Object.keys(exam.answers).filter(k => exam.answers[k].length).length} réponse(s) sur ${exam.ids.length}, <span class="num">${clock(exam.remainingMs)}</span> restantes.</p>
       <div class="row"><button class="btn btn-primary" data-action="resume" data-mode="exam">Reprendre ${IC.next}</button>
       <button class="btn" data-action="ask-new-exam">Nouvel examen</button></div></div>`
    : `<div class="row"><button class="btn btn-primary" data-action="new-exam">Démarrer l'examen ${IC.next}</button>
       ${exam && exam.finished ? `<button class="btn" data-action="show-results" data-mode="exam">Dernier résultat</button>` : ""}</div>`;

  const countdown = countdownText(state.profile);
  app.innerHTML = `
  ${appbarHTML("home")}
  <main class="wrap stagger">
    <header class="hero" id="hero">
      <div class="hero-text">
        <span class="badge-top"><i></i>${state.profile.name ? `Bonjour ${esc(state.profile.name)}` : "Entraînement non officiel"}${countdown ? ` · ${countdown}` : ""}</span>
        <h1>Prépare ton Associate Cloud Engineer</h1>
        <p class="muted">${QUESTIONS.length} questions sur les 5 domaines de l'examen Google Cloud, dont ${multi} à réponses multiples. Ta progression reste enregistrée dans ce navigateur.</p>
        <div class="row">
          <button class="btn btn-primary" data-action="${hero.a}"${hero.m ? ` data-mode="${hero.m}"` : ""}>${hero.t} ${IC.next}</button>
        </div>
      </div>
      <div class="art" aria-hidden="true"><span class="shape s1"></span><span class="shape s2"></span><span class="shape s3"></span><span class="shape s4"></span><span class="shape s5"></span></div>
    </header>

    <div class="modes daily-row">
      ${streakSectionHTML()}
      ${reviewSectionHTML()}
    </div>

    <div class="modes">
      <section class="card mode" aria-labelledby="h-exam">
        <span class="mode-ic">${IC.clock}</span>
        <h2 id="h-exam">Examen blanc</h2>
        <div class="facts"><span class="fact"><b>${examSize}</b> questions</span><span class="fact"><b>${CONFIG.examMinutes / 60} h</b> chrono</span><span class="fact">seuil <b>${CONFIG.passPct} %</b></span></div>
        <p class="small muted">Interface dépouillée comme le jour J : pas d'indication de domaine, aucune correction avant la fin, écran de vérification avant l'envoi.</p>
        <div class="mix" aria-label="Répartition des questions par domaine">
          <div class="mixbar" aria-hidden="true">${dkeys.map(d => `<i class="d${d}" style="flex:${quota[d]}"></i>`).join("")}</div>
          <ul class="mixlist">${dkeys.map(d => `<li class="d${d}"><b class="num">${quota[d]}</b> ${esc(DOMAINS[d].short)}</li>`).join("")}</ul>
        </div>
        <div class="mode-cta">${examBlock}</div>
      </section>

      <section class="card mode" aria-labelledby="h-prac">
        <span class="mode-ic green">${IC.target}</span>
        <h2 id="h-prac">Entraînement libre</h2>
        <p class="small muted">Correction et explication après chaque réponse. Choisis les domaines à travailler.</p>
        <div class="chips" id="domain-chips">
          ${dkeys.map((d, i) => `<label class="chip d${d}"><input type="checkbox" id="dom-${d}" value="${d}" checked><span>${esc(DOMAINS[d].short)} <span class="num">${counts[i]}</span></span></label>`).join("")}
        </div>
        <button class="btn btn-ghost btn-sm" data-action="toggle-domains" id="btn-toggle-domains" type="button">Tout désélectionner</button>
        <div class="row mode-cta"><button class="btn btn-primary" data-action="new-practice" id="btn-practice">Commencer</button>
        ${pracLive ? `<button class="btn" data-action="resume" data-mode="practice">${prac.kind === "review" ? "Reprendre la révision" : "Reprendre"} (${Object.keys(prac.validated).length}/${prac.ids.length})</button>` : ""}
        ${errs.length ? `<button class="btn" data-action="new-errors">Revoir mes erreurs (${errs.length})</button>` : ""}</div>
      </section>
    </div>

    <section class="card" aria-labelledby="h-dom">
      <div class="row spread"><h2 id="h-dom">Ta maîtrise par domaine</h2>${hasStats ? `<span class="small muted">Questions réussies à ta dernière tentative</span>` : ""}</div>
      ${hasStats ? `<div class="note focus"><p class="small"><strong>À travailler en priorité :</strong> ${esc(DOMAINS[dkeys[weak]].name)} <span class="num muted">(${mast[weak]}/${counts[weak]})</span></p>
        <button class="btn btn-primary btn-sm" data-action="practice-domain" data-d="${dkeys[weak]}">S'entraîner sur ce domaine ${IC.next}</button></div>`
      : `<div class="note empty"><p class="small"><strong>Pas encore de données.</strong> Fais un premier entraînement : ta progression par domaine s'affichera ici, avec le domaine à travailler en priorité.</p></div>`}
      <ul class="dlist${hasStats ? "" : " idle"}">
        ${dkeys.map((d, i) => `<li class="drow d${d}"><span class="dnum">${d}</span><span>${esc(DOMAINS[d].name)}</span>
          <span class="num small muted">${hasStats ? `${mast[i]}/${counts[i]}` : `${counts[i]} questions`}</span>
          <span class="wbar"><i style="width:${pct(mast[i], counts[i])}%"></i></span></li>`).join("")}
      </ul>
    </section>

    ${history.length ? `<section class="card" aria-labelledby="h-hist">
      <div class="row spread"><h2 id="h-hist">Derniers examens blancs</h2><button class="btn btn-sm" data-action="nav" data-view="dashboard">Tableau de bord ${IC.next}</button></div>
      <div class="tscroll"><table>
        <thead><tr><th>Date</th><th class="r">Score</th><th class="r">Réussite</th><th>Résultat</th></tr></thead>
        <tbody>${history.slice(0, 5).map(h => `<tr><td>${new Date(h.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td class="r num">${h.ok}/${h.total}</td><td class="r num">${h.pct} %</td><td><span class="pill ${h.pct >= CONFIG.passPct ? "ok" : "ko"} mini">${h.pct >= CONFIG.passPct ? "Au-dessus du seuil" : "Sous le seuil"}</span></td></tr>`).join("")}</tbody>
      </table></div>
    </section>` : ""}

    <p class="small muted">Outil d'entraînement personnel, sans lien avec Google. Questions originales, non issues de l'examen officiel. Le seuil de ${CONFIG.passPct} % est indicatif : Google ne publie pas la note de passage.</p>
  </main>`;
  updatePracticeCount();
}
export function selectedDomains() { return Array.from(document.querySelectorAll("#domain-chips input:checked")).map(i => Number(i.value)); }
export function updatePracticeCount() {
  const btn = document.getElementById("btn-practice"); if (!btn) return;
  const doms = selectedDomains();
  const n = QUESTIONS.filter(q => doms.includes(q.domain)).length;
  btn.textContent = n ? `Commencer (${n} questions)` : "Choisis au moins un domaine";
  btn.disabled = !n;
  const t = document.getElementById("btn-toggle-domains");
  if (t) t.textContent = doms.length === Object.keys(DOMAINS).length ? "Tout désélectionner" : "Tout sélectionner";
}
