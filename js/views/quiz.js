/* Vues : questions (examen et entraînement) et vérification avant envoi. */
import { CONFIG, LETTERS } from "../config.js";
import { DOMAINS, Q_BY_ID } from "../data.js";
import { app } from "../dom.js";
import { state } from "../state.js";
import { esc, fmt, clock, pct, isCorrect } from "../utils.js";
import { counters, streakInfo } from "../logic.js";
import { IC } from "../ui/icons.js";
import { docLinkHTML } from "./shared.js";

function topbarHTML() {
  const s = state.session;
  return `
    <div class="row spread topline">
      <strong class="ttl">${s.mode === "exam" ? "Examen blanc" : s.kind === "review" ? "Révision du jour" : "Entraînement"}</strong>
      ${s.mode === "exam" ? `<span class="timer ${s.remainingMs < CONFIG.lowTimeMs ? "low" : ""}" id="timer" aria-label="Temps restant">${IC.clock}<span id="timer-txt">${clock(state.endTime ? state.endTime - Date.now() : s.remainingMs)}</span></span>` : ""}
      <span class="row tools">
        <button class="btn btn-ghost" data-action="quit">Quitter</button>
        <button class="btn" data-action="ask-finish">${s.mode === "exam" ? `Vérifier<span class="hide-sm"> et terminer</span>` : "Terminer"}</button>
      </span>
    </div>
    <div class="bar" id="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="${s.ids.length}" aria-label="Progression"><i id="pfill"></i></div>
    <div class="row spread small muted">
      <span>Question <span class="num" id="pcur"></span> sur <span class="num">${s.ids.length}</span></span>
      <span id="pleft"></span>
    </div>`;
}
function navHTML() {
  const s = state.session;
  return s.ids.map((id, i) => {
    const cls = [];
    if (s.mode === "practice" && s.validated[id]) cls.push(isCorrect(Q_BY_ID[id], s.answers[id]) ? "ok" : "ko");
    else if ((s.answers[id] || []).length) cls.push("answered");
    if (s.flags[id]) cls.push("flagged");
    if (i === s.current) cls.push("current");
    return `<button class="${cls.join(" ")}" data-action="goto" data-i="${i}" aria-label="Question ${i + 1}${s.flags[id] ? ", à revoir" : ""}"${i === s.current ? ' aria-current="true"' : ""}>${i + 1}</button>`;
  }).join("");
}
export function refreshChrome() {     // met à jour bandeau + grille sans toucher à la question (garde le focus)
  const s = state.session, c = counters(s), $ = id => document.getElementById(id);
  if ($("pfill")) {
    $("pfill").style.width = pct(c.done, s.ids.length) + "%";
    $("pbar").setAttribute("aria-valuenow", c.done);
    $("pcur").textContent = s.current + 1;
    const base = `<span class="num">${c.left}</span> restante${c.left > 1 ? "s" : ""}${c.flagged ? ` · <span class="num">${c.flagged}</span> à revoir` : ""}`;
    const st = s.mode === "practice" ? streakInfo(s) : null;
    $("pleft").innerHTML = st && st.done
      ? `<span class="num">${st.ok}/${st.done}</span> justes${st.streak >= 2 ? ` · série de <span class="num">${st.streak}</span>` : ""} · ${base}` : base;
  }
  if ($("nav-grid")) $("nav-grid").innerHTML = navHTML();
}
export function renderQuiz() {
  const s = state.session, id = s.ids[s.current], q = Q_BY_ID[id];
  const multi = q.correct.length > 1;
  const sel = s.answers[id] || [];
  const locked = s.mode === "practice" && !!s.validated[id];
  const last = s.current === s.ids.length - 1;
  const good = locked && isCorrect(q, sel);

  const options = s.order[id].map((orig, pos) => {
    const chosen = sel.includes(orig), right = q.correct.includes(orig);
    let cls = "opt" + (multi ? " sq" : ""), verdict = "", mark = LETTERS[pos];
    if (locked) {
      cls += " locked";
      if (right) { cls += " is-correct"; mark = IC.check; verdict = `<span class="verdict">${chosen ? "Bonne réponse, tu l'as choisie" : "Bonne réponse"}</span>`; }
      else if (chosen) { cls += " is-wrong"; mark = IC.cross; verdict = `<span class="verdict">Ton choix, incorrect</span>`; }
    }
    return `<label class="${cls}">
      <input class="sr" type="${multi ? "checkbox" : "radio"}" name="opt" id="opt-${pos}" value="${orig}" aria-label="Option ${LETTERS[pos]}" ${chosen ? "checked" : ""} ${locked ? "disabled" : ""}>
      <span class="letter">${mark}</span>
      <span>${fmt(q.options[orig])}${verdict}</span>
    </label>`;
  }).join("");

  // Le squelette (bandeau + grille) n'est créé qu'une fois par session affichée.
  if (!document.getElementById("qslot")) {
    app.innerHTML = `
    <div class="topbar"><div class="strip"></div><div class="topbar-in">${topbarHTML()}</div></div>
    <main class="wrap">
      <div id="qslot"></div>
      <details class="card"${window.matchMedia("(max-width: 640px)").matches ? "" : " open"}>
        <summary>Toutes les questions</summary>
        <div class="nav-grid" id="nav-grid"></div>
        <div class="legend">
          ${s.mode === "exam"
            ? `<span><i class="sw-answered"></i>Répondue</span>`
            : `<span><i class="sw-ok"></i>Juste ✓</span><span><i class="sw-ko"></i>Fausse ✕</span>`}
          <span><i class="sw-current"></i>En cours</span>
          <span><i class="sw-flag"></i>À revoir</span>
        </div>
      </details>
    </main>`;
  }

  document.getElementById("qslot").innerHTML = `
    <article class="card qcard ${state.slide ? "enter-" + state.slide : ""}">
      <div class="row">
        ${s.mode === "exam" ? "" : `<span class="tag dtag d${q.domain}">Domaine ${q.domain} · ${esc(DOMAINS[q.domain].short)}</span>`}
        ${multi ? `<span class="tag multi">Choisis ${q.correct.length} réponses</span>` : `<span class="tag">Une seule réponse</span>`}
      </div>
      <p class="qtext" id="qtext">${fmt(q.q)}</p>
      <fieldset class="options" aria-labelledby="qtext">${options}</fieldset>
      ${locked ? `<div class="feedback ${good ? "ok" : "ko"}" role="status">
          <strong>${good ? IC.check + "Correct" + (streakInfo(s).streak >= 3 ? " · " + streakInfo(s).streak + " d'affilée" : "") : IC.cross + "Pas tout à fait"}</strong>
          <p>${fmt(q.explain)}</p>${docLinkHTML(q)}</div>` : ""}
      <div class="row spread actions sticky-bar">
        <button class="btn btn-ghost" data-action="prev" aria-label="Question précédente" ${s.current === 0 ? "disabled" : ""}>${IC.prev}<span class="hide-sm">Précédente</span></button>
        <button class="btn btn-flag" data-action="flag" aria-pressed="${!!s.flags[id]}">${IC.flag}<span>${s.flags[id] ? "Marquée" : "À revoir"}</span></button>
        ${s.mode === "practice" && !locked
          ? `<button class="btn btn-primary" data-action="validate" id="btn-validate" ${sel.length ? "" : "disabled"}>Valider ${IC.check}</button>`
          : last
            ? `<button class="btn btn-primary" data-action="ask-finish">Terminer ${IC.check}</button>`
            : `<button class="btn btn-primary" data-action="next">Suivante ${IC.next}</button>`}
      </div>
      <p class="small muted kbd-hint">Clavier : A à E pour répondre, Entrée pour ${s.mode === "practice" && !locked ? "valider" : "continuer"}, flèches pour naviguer.</p>
    </article>`;
  state.slide = "";
  refreshChrome();
}
export function renderReview() {
  const s = state.session, c = counters(s);
  const rows = s.ids.map((id, i) => ({ i, answered: (s.answers[id] || []).length > 0, flagged: !!s.flags[id] }));
  const list = state.preFilter === "empty" ? rows.filter(r => !r.answered) : state.preFilter === "flagged" ? rows.filter(r => r.flagged) : rows;
  app.innerHTML = `
  <div class="topbar"><div class="topbar-in"><div class="row spread">
    <strong>Vérification avant envoi</strong>
    <span class="timer ${s.remainingMs < CONFIG.lowTimeMs ? "low" : ""}" id="timer" aria-label="Temps restant">${IC.clock}<span id="timer-txt">${clock(state.endTime ? state.endTime - Date.now() : s.remainingMs)}</span></span>
  </div></div></div>
  <main class="wrap">
    <section class="card">
      <div class="facts"><span class="fact"><b>${c.done}</b> répondues</span><span class="fact${c.left ? " warn" : ""}"><b>${c.left}</b> sans réponse</span><span class="fact"><b>${c.flagged}</b> marquées</span></div>
      <p class="small muted">Clique sur une question pour y revenir. Une fois l'examen soumis, les réponses ne sont plus modifiables.</p>
      <div class="chips" role="group" aria-label="Filtrer les questions">
        ${[["all", "Toutes"], ["empty", "Sans réponse"], ["flagged", "Marquées"]].map(([k, l]) =>
          `<label class="chip"><input type="radio" name="pf" id="pf-${k}" value="${k}" ${state.preFilter === k ? "checked" : ""}><span>${l}</span></label>`).join("")}
      </div>
      <div class="legend" aria-hidden="true">
        <span><i class="sw-answered"></i>Répondue</span>
        <span><i class="dash"></i>Sans réponse</span>
        <span><i class="sw-flag"></i>Marquée</span>
      </div>
      ${list.length ? `<ul class="plist">${list.map(r => `<li><button class="${r.answered ? "answered" : "empty"}${r.flagged ? " flagged" : ""}" data-action="goto" data-i="${r.i}" aria-label="Question ${r.i + 1}, ${r.answered ? "répondue" : "sans réponse"}${r.flagged ? ", marquée" : ""}"><span class="num">${r.i + 1}</span>${r.flagged ? IC.flag : ""}</button></li>`).join("")}</ul>`
        : `<p class="muted">Aucune question dans ce filtre.</p>`}
      <div class="row spread sticky-bar">
        <button class="btn" data-action="back-quiz">${IC.prev} Revenir<span class="hide-sm"> aux questions</span></button>
        <button class="btn btn-primary" data-action="ask-submit">Soumettre l'examen</button>
      </div>
    </section>
  </main>`;
}
