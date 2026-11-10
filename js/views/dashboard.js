/* Vue : tableau de bord. */
import { CONFIG, KEYS, HISTORY_MAX } from "../config.js";
import { DOMAINS, QUESTIONS } from "../data.js";
import { app } from "../dom.js";
import { state } from "../state.js";
import { store } from "../storage.js";
import { esc, fmt, clock, pct, dayKey } from "../utils.js";
import { dashData, daysToExam, countdownText, initialsOf } from "../logic.js";
import { IC } from "../ui/icons.js";
import { appbarHTML } from "./shared.js";

function scoreChart(history) {
  const pts = history.slice(0, 10).reverse();
  const W = 640, H = 230, L = 40, R = 16, T = 24, B = 36;
  const x = i => pts.length < 2 ? (L + W - R) / 2 : L + i * (W - L - R) / (pts.length - 1);
  const y = v => T + (H - T - B) * (1 - v / 100);
  const line = pts.map((h, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(h.pct).toFixed(1)).join(" ");
  const area = `${line} L${x(pts.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const fdate = t => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Scores des ${pts.length} derniers examens blancs">
    ${[0, 25, 50, 75, 100].map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
    <line class="thr" x1="${L}" x2="${W - R}" y1="${y(CONFIG.passPct)}" y2="${y(CONFIG.passPct)}"/><text class="axis thr-t" x="${W - R}" y="${y(CONFIG.passPct) - 5}" text-anchor="end">Seuil ${CONFIG.passPct} %</text>
    ${state.profile.target !== CONFIG.passPct ? `<line class="tgt" x1="${L}" x2="${W - R}" y1="${y(state.profile.target)}" y2="${y(state.profile.target)}"/><text class="axis tgt-t" x="${L + 4}" y="${y(state.profile.target) - 5}">Objectif ${state.profile.target} %</text>` : ""}
    ${pts.length > 1 ? `<path class="area" d="${area}"/><path class="line" d="${line}"/>` : ""}
    ${pts.map((h, i) => `<circle class="dot ${h.pct >= CONFIG.passPct ? "ok" : "ko"}" cx="${x(i).toFixed(1)}" cy="${y(h.pct).toFixed(1)}" r="5"><title>${fdate(h.date)} : ${h.pct} %</title></circle>
      <text class="val" x="${x(i).toFixed(1)}" y="${(y(h.pct) - 11).toFixed(1)}" text-anchor="middle">${h.pct}</text>
      <text class="axis" x="${x(i).toFixed(1)}" y="${H - 12}" text-anchor="middle">${fdate(h.date)}</text>`).join("")}
  </svg>`;
}
function activityStrip() {
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return { d, a: state.activity[dayKey(d)] || { n: 0, ok: 0 } }; });
  const max = Math.max(1, ...days.map(x => x.a.n));
  return `<div class="actstrip" role="img" aria-label="Réponses validées sur les 14 derniers jours">
    ${days.map(({ d, a }, i) => `<div class="actday${i === 13 ? " today" : ""}" title="${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} : ${a.n} réponse${a.n > 1 ? "s" : ""}, ${a.ok} juste${a.ok > 1 ? "s" : ""}">
      <span class="actbar"><i style="height:${a.n ? Math.max(6, Math.round(a.n / max * 100)) : 0}%"><b style="height:${a.n ? Math.round(a.ok / a.n * 100) : 0}%"></b></i></span>
      <span class="actlbl">${"DLMMJVS"[d.getDay()]}</span></div>`).join("")}
  </div>`;
}
export function renderDashboard() {
  const d = dashData(state.stats, state.activity, store.get(KEYS.history) || []);
  const last = d.history[0], prev = d.history[1];
  const trend = last && prev ? last.pct - prev.pct : null;
  const daysLeft = daysToExam(state.profile), countdown = countdownText(state.profile);
  const left = Math.max(0, state.profile.daily - d.today.n);
  const rate = d.actN ? pct(d.actOk, d.actN) : pct(d.mastered, d.tried);
  const n = d.history.length, nShown = Math.min(10, n);
  const fdate = t => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  app.innerHTML = `
  ${appbarHTML("dashboard")}
  <main class="wrap stagger">
    <header class="card dash-head">
      <span class="avatar xl d${state.profile.color}" aria-hidden="true">${esc(initialsOf(state.profile.name))}</span>
      <div class="dash-id">
        <span class="tag">Tableau de bord</span>
        <h1>${state.profile.name ? `Bonjour ${esc(state.profile.name)}` : "Ta progression"}</h1>
        <div class="facts">
          <span class="fact${daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 ? " warn" : ""}">${IC.cal}${countdown || "Date d'examen non renseignée"}</span>
          <span class="fact">${IC.fire}<b>${d.streak}</b> jour${d.streak > 1 ? "s" : ""} d'affilée</span>
          <span class="fact">${IC.target}Score visé <b>${state.profile.target} %</b></span>
        </div>
      </div>
      <button class="btn btn-sm dash-edit" data-action="nav" data-view="profile">${IC.edit} Modifier le profil</button>
      <div class="goal">
        <div class="row spread"><strong class="small">Objectif du jour</strong><span class="small num muted">${d.today.n}/${state.profile.daily} questions</span></div>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${state.profile.daily}" aria-valuenow="${Math.min(d.today.n, state.profile.daily)}" aria-label="Objectif quotidien"><i class="${left ? "" : "ok"}" style="width:${pct(Math.min(d.today.n, state.profile.daily), state.profile.daily)}%"></i></div>
        <p class="small muted">${left ? `Encore ${left} question${left > 1 ? "s" : ""} à valider aujourd'hui.` : "Objectif quotidien atteint, bravo !"}</p>
      </div>
    </header>

    <section class="kpis" aria-label="Chiffres clés">
      <div class="kpi accent"><span class="lbl">Examens blancs</span><span class="val num">${n}</span><span class="sub">${n ? `Meilleur score : <b class="num">${d.best} %</b> · moyenne <b class="num">${d.avg} %</b>` : "Aucun examen passé"}</span></div>
      <div class="kpi${last ? (last.pct >= CONFIG.passPct ? " good" : " bad") : ""}"><span class="lbl">Dernier score</span><span class="val num">${last ? last.pct + " %" : "–"}</span><span class="sub">${trend === null ? (last ? `${last.ok}/${last.total} bonnes réponses` : "Lance un premier examen blanc") : trend > 0 ? `↗ +${trend} pts par rapport au précédent` : trend < 0 ? `↘ ${trend} pts par rapport au précédent` : "Stable par rapport au précédent"}</span></div>
      <div class="kpi"><span class="lbl">Questions maîtrisées</span><span class="val num">${d.mastered}<span class="den">/${QUESTIONS.length}</span></span><span class="sub">${d.tried ? `${d.tried} abordée${d.tried > 1 ? "s" : ""} · ${d.errs.length} à retravailler` : "Aucune question abordée"}</span></div>
      <div class="kpi"><span class="lbl">Réponses validées</span><span class="val num">${d.attempts}</span><span class="sub">${d.attempts ? `Taux de réussite : <b class="num">${rate} %</b>` : "En entraînement et en examen"}</span></div>
    </section>

    <section class="card" aria-labelledby="h-chart">
      <div class="row spread"><h2 id="h-chart">Évolution des scores</h2>${n ? `<span class="small muted">${nShown} dernier${nShown > 1 ? "s" : ""} examen${nShown > 1 ? "s" : ""} blanc${nShown > 1 ? "s" : ""}</span>` : ""}</div>
      ${n ? scoreChart(d.history) + `<div class="legend"><span><i class="sw-ok"></i>Au-dessus du seuil</span><span><i class="sw-ko"></i>Sous le seuil</span><span><i class="ln-thr"></i>Seuil ${CONFIG.passPct} %</span>${state.profile.target !== CONFIG.passPct ? `<span><i class="ln-tgt"></i>Objectif ${state.profile.target} %</span>` : ""}</div>`
        : `<div class="note empty"><p class="small"><strong>Aucun examen blanc pour l'instant.</strong> Passe un premier examen : ta courbe de progression apparaîtra ici.</p><div class="row"><button class="btn btn-primary btn-sm" data-action="new-exam">Lancer un examen blanc ${IC.next}</button></div></div>`}
    </section>

    <section class="card" aria-labelledby="h-act">
      <div class="row spread"><h2 id="h-act">Activité des 14 derniers jours</h2><span class="small muted">Réponses validées par jour, bonnes réponses en couleur</span></div>
      ${activityStrip()}
      ${d.actN ? "" : `<p class="small muted">L'activité est comptée à partir de maintenant, à chaque réponse validée en entraînement ou en examen.</p>`}
    </section>

    <section class="card" aria-labelledby="h-dtab">
      <div class="row spread"><h2 id="h-dtab">Maîtrise par domaine</h2><span class="small muted">Dernière tentative sur chaque question</span></div>
      <div class="tscroll"><table class="dtable">
        <thead><tr><th>Domaine</th><th class="r">Poids</th><th class="r">Abordées</th><th class="r">Réussies</th><th class="r">Taux</th><th>Maîtrise</th><th></th></tr></thead>
        <tbody>${d.doms.map(x => `<tr class="d${x.d}">
          <td><span class="dcell"><span class="dnum">${x.d}</span><span>${esc(DOMAINS[x.d].name)}</span></span></td>
          <td class="r num muted">${DOMAINS[x.d].weight} %</td>
          <td class="r num">${x.tried}/${x.total}</td>
          <td class="r num">${x.ok}</td>
          <td class="r">${x.tried ? `<span class="pill ${x.rate >= CONFIG.passPct ? "ok" : "ko"} mini num">${x.rate} %</span>` : `<span class="muted">–</span>`}</td>
          <td><span class="wbar" title="${x.mastery} % des questions du domaine réussies"><i style="width:${x.mastery}%"></i></span></td>
          <td class="r"><button class="btn btn-ghost btn-sm" data-action="practice-domain" data-d="${x.d}">S'entraîner</button></td>
        </tr>`).join("")}</tbody>
        <tfoot><tr><td>Total</td><td class="r num muted">100 %</td><td class="r num">${d.tried}/${QUESTIONS.length}</td><td class="r num">${d.mastered}</td><td class="r num">${d.tried ? `${pct(d.mastered, d.tried)} %` : "–"}</td><td><span class="wbar"><i style="width:${pct(d.mastered, QUESTIONS.length)}%"></i></span></td><td></td></tr></tfoot>
      </table></div>
    </section>

    <section class="card" aria-labelledby="h-err">
      <div class="row spread"><h2 id="h-err">Questions à retravailler</h2>${d.errs.length ? `<button class="btn btn-sm" data-action="new-errors">Revoir mes erreurs (${d.errs.length}) ${IC.next}</button>` : ""}</div>
      ${d.errs.length ? `<ul class="errlist">${d.errs.slice(0, 6).map(q => `<li><span class="tag dtag d${q.domain}">${esc(DOMAINS[q.domain].short)}</span><span>${fmt(q.q.length > 140 ? q.q.slice(0, 140) + "…" : q.q)}</span><span class="small muted num">${state.stats[q.id].n} essai${state.stats[q.id].n > 1 ? "s" : ""}</span></li>`).join("")}</ul>${d.errs.length > 6 ? `<p class="small muted">… et ${d.errs.length - 6} autre${d.errs.length - 6 > 1 ? "s" : ""}.</p>` : ""}`
        : `<p class="muted">${d.tried ? "Aucune erreur en attente : toutes les questions abordées ont été réussies à la dernière tentative." : "Commence un entraînement : tes erreurs apparaîtront ici pour être rejouées."}</p>`}
    </section>

    <section class="card" aria-labelledby="h-hist2">
      <div class="row spread"><h2 id="h-hist2">Historique des examens blancs</h2>${n ? `<span class="small muted">${n} examen${n > 1 ? "s" : ""} · ${HISTORY_MAX} conservés au maximum</span>` : ""}</div>
      ${n ? `<div class="tscroll"><table>
        <thead><tr><th>#</th><th>Date</th><th class="r">Score</th><th class="r">Réussite</th><th class="r">Durée</th><th>Résultat</th></tr></thead>
        <tbody>${d.history.map((h, i) => `<tr><td class="num muted">${n - i}</td><td>${fdate(h.date)}</td><td class="r num">${h.ok}/${h.total}</td><td class="r num"><b>${h.pct} %</b></td><td class="r num">${h.usedMs != null ? clock(h.usedMs) : "–"}</td><td class="row" style="gap:6px"><span class="pill ${h.pct >= CONFIG.passPct ? "ok" : "ko"} mini">${h.pct >= CONFIG.passPct ? "Au-dessus du seuil" : "Sous le seuil"}</span>${h.pct >= state.profile.target ? `<span class="pill ok mini">Objectif atteint</span>` : ""}</td></tr>`).join("")}</tbody>
      </table></div>` : `<p class="muted">Aucun examen blanc terminé pour l'instant.</p>`}
    </section>
  </main>`;
}
