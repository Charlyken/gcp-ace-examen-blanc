/* Vue : résultats d'une session. */
import { CONFIG } from "../config.js";
import { DOMAINS } from "../data.js";
import { app } from "../dom.js";
import { state } from "../state.js";
import { esc, fmt, clock, pct } from "../utils.js";
import { compute } from "../logic.js";
import { IC } from "../ui/icons.js";
import { countUp, confetti } from "../ui/effects.js";
import { docLinkHTML } from "./shared.js";

export function renderResults() {
  const s = state.session, r = compute(s);
  const passed = r.pct >= CONFIG.passPct;
  const usedMs = s.mode === "exam" ? CONFIG.examMinutes * 60000 - (s.remainingMs || 0) : 0;
  const empty = r.items.filter(i => i.status === "empty").length;
  const wrong = r.items.filter(i => i.status !== "ok");
  const flagged = r.items.filter(i => i.flagged);
  const list = state.reviewFilter === "wrong" ? wrong : state.reviewFilter === "flagged" ? flagged : r.items;
  const CIRC = 2 * Math.PI * 52;

  // Domaine le plus faible (parmi ceux qui ont des questions)
  const doms = Object.keys(DOMAINS).filter(d => r.byDomain[d].total);
  const weakest = doms.slice().sort((a, b) => pct(r.byDomain[a].ok, r.byDomain[a].total) - pct(r.byDomain[b].ok, r.byDomain[b].total))[0];
  const weakPct = weakest ? pct(r.byDomain[weakest].ok, r.byDomain[weakest].total) : 100;

  const reviewHTML = list.map(it => {
    const q = it.q, n = s.ids.indexOf(it.id) + 1;
    const opts = s.order[it.id].map(orig => {
      const chosen = it.a.includes(orig), right = q.correct.includes(orig);
      const cls = right ? "is-correct" : chosen ? "is-wrong" : "";
      const note = right ? (chosen ? "Bonne réponse, choisie" : "Bonne réponse") : chosen ? "Ton choix, incorrect" : "";
      return `<li class="${cls}">${note ? `<small>${note}</small>` : ""}${fmt(q.options[orig])}</li>`;
    }).join("");
    const st = it.status === "ok" ? ["ok", "Juste"] : it.status === "ko" ? ["ko", "Fausse"] : ["ko", "Sans réponse"];
    return `<details class="review-item">
      <summary><span class="num muted">${n}.</span><span style="flex:1">${fmt(q.q.length > 150 ? q.q.slice(0, 150) + "…" : q.q)}</span><span class="st ${st[0]}">${st[1]}${it.flagged ? " · à revoir" : ""}</span></summary>
      <div class="review-body">
        <span class="tag dtag d${q.domain}" style="align-self:flex-start">Domaine ${q.domain} · ${esc(DOMAINS[q.domain].short)}</span>
        <p>${fmt(q.q)}</p>
        <ul>${opts}</ul>
        <div class="feedback ${it.status === "ok" ? "ok" : "ko"}"><strong>Explication</strong><p>${fmt(q.explain)}</p>${docLinkHTML(q)}</div>
      </div>
    </details>`;
  }).join("");

  app.innerHTML = `
  <div class="strip"></div>
  <main class="wrap ${state.celebrate ? "stagger" : ""}">
    <header style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">
      <span class="tag">${s.mode === "exam" ? "Examen blanc" : "Entraînement libre"} · résultats</span>
      <h1>${s.timeUp ? "Temps écoulé" : passed ? "Bien joué" : "Session terminée"}</h1>
    </header>

    <section class="card" aria-label="Score global">
      <div class="score">
        <div class="ringbox">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="ring-bg" cx="60" cy="60" r="52"/>
            <circle class="ring-fg ${passed ? "ok" : "ko"}" cx="60" cy="60" r="52" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC * (1 - r.pct / 100)}" style="--c:${CIRC}"/>
          </svg>
          <span class="big" id="big-pct">${r.pct} %</span>
        </div>
        <div class="score-side">
          <span class="pill ${passed ? "ok" : "ko"}">${passed ? IC.check + "Au-dessus du seuil" : IC.cross + "Sous le seuil"} de ${CONFIG.passPct} %</span>
          <span style="font:500 1.3rem var(--font-display)"><span class="num">${r.ok} / ${r.total}</span> bonnes réponses</span>
          <div class="facts">
            ${s.mode === "exam" ? `<span class="fact">Temps utilisé <b>${clock(usedMs)}</b></span>` : ""}
            ${empty ? `<span class="fact"><b>${empty}</b> sans réponse</span>` : ""}
            <span class="fact"><b>${flagged.length}</b> à revoir</span>
          </div>
        </div>
      </div>
    </section>

    <section class="card" aria-labelledby="h-bydom">
      <div class="row spread"><h2 id="h-bydom">Performance par domaine</h2><span class="small muted">Trait vertical : seuil de ${CONFIG.passPct} %</span></div>
      ${doms.map(d => { const b = r.byDomain[d], p = pct(b.ok, b.total); return `
        <div class="dom d${d}">
          <span class="dnum">${d}</span>
          <span>${esc(DOMAINS[d].name)}${d === weakest && p < CONFIG.passPct ? ` <span class="pill ko" style="font-size:.75rem;padding:2px 10px">Point faible</span>` : ""}</span>
          <span class="num res">${b.ok}/${b.total} · ${p} %</span>
          <div class="bar"><i class="${p >= CONFIG.passPct ? "ok" : "ko"}" style="width:${p}%"></i></div>
        </div>`; }).join("")}
      ${weakest && weakPct < CONFIG.passPct
        ? `<div class="row"><button class="btn" data-action="train-domain" data-domain="${weakest}">${IC.target} S'entraîner sur le domaine ${weakest}</button></div>` : ""}
    </section>

    <section class="card" aria-labelledby="h-review">
      <h2 id="h-review">Correction</h2>
      <div class="chips" role="group" aria-label="Filtrer la correction">
        ${[["wrong", `Ratées (${wrong.length})`], ["flagged", `Marquées (${flagged.length})`], ["all", `Toutes (${r.items.length})`]].map(([k, l]) =>
          `<label class="chip"><input type="radio" name="rf" id="rf-${k}" value="${k}" ${state.reviewFilter === k ? "checked" : ""}><span>${l}</span></label>`).join("")}
      </div>
      ${list.length ? reviewHTML : `<p class="muted">${state.reviewFilter === "wrong" ? "Aucune erreur sur cette session." : "Aucune question dans ce filtre."}</p>`}
    </section>

    <div class="row">
      <button class="btn btn-primary" data-action="${s.mode === "exam" ? "new-exam" : "home"}">${s.mode === "exam" ? "Nouvel examen blanc" : "Nouvelle session"} ${IC.next}</button>
      <button class="btn" data-action="home">Retour à l'accueil</button>
    </div>
  </main>`;

  if (state.celebrate) {
    state.celebrate = false;
    countUp(document.getElementById("big-pct"), r.pct, " %");
    if (passed && r.total >= 5) confetti();
  }
}
