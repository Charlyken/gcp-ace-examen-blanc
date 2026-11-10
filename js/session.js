/* Cycle de vie d'une session : chargement, sauvegarde, chronomètre, démarrage et fin. */
import { CONFIG, KEYS, HISTORY_MAX } from "./config.js";
import { QUESTIONS, Q_BY_ID } from "./data.js";
import { state, record, saveStats } from "./state.js";
import { store } from "./storage.js";
import { clock, shuffle, dayKey } from "./utils.js";
import { compute, drawExam, newSession, isSessionUsable } from "./logic.js";
import { pickReview } from "./srs.js";
import { closeDialog } from "./ui/dialog.js";
import { go, render } from "./router.js";

// Ignore une session sauvegardée dont des questions ont été retirées de la banque.
export function loadSession(mode) {
  const s = store.get(KEYS[mode]);
  return isSessionUsable(s) ? s : null;
}

export function save() {
  if (!state.session) return;
  if (state.session.mode === "exam" && !state.session.finished && state.endTime) state.session.remainingMs = Math.max(0, state.endTime - Date.now());
  store.set(KEYS[state.session.mode], state.session);
}

/* ---------------- Chronomètre ---------------- */
export function startTimer() {
  stopTimer();
  if (!state.session || state.session.mode !== "exam" || state.session.finished) return;
  state.endTime = Date.now() + state.session.remainingMs;
  let ticks = 0;
  state.timerId = setInterval(() => {
    const left = state.endTime - Date.now();
    const el = document.getElementById("timer"), txt = document.getElementById("timer-txt");
    if (txt) txt.textContent = clock(left);
    if (el) el.classList.toggle("low", left < CONFIG.lowTimeMs);
    if (++ticks % 5 === 0) save();
    if (left <= 0) finish(true);
  }, 1000);
}
export function stopTimer() { if (state.timerId) clearInterval(state.timerId); state.timerId = null; state.endTime = 0; }

export function finish(timeUp) {
  if (!state.session || state.session.finished) return;
  if (state.session.mode === "exam" && state.endTime) state.session.remainingMs = Math.max(0, state.endTime - Date.now());
  stopTimer();
  state.session.finished = true; state.session.timeUp = !!timeUp; state.session.finishedAt = Date.now();
  store.set(KEYS[state.session.mode], state.session);
  if (state.session.mode === "exam") {
    const r = compute(state.session);
    r.items.forEach(i => record(i.id, i.status === "ok")); saveStats();
    const h = store.get(KEYS.history) || [];
    h.unshift({ date: state.session.finishedAt, ok: r.ok, total: r.total, pct: r.pct, usedMs: CONFIG.examMinutes * 60000 - (state.session.remainingMs || 0) });
    store.set(KEYS.history, h.slice(0, HISTORY_MAX));
  }
  closeDialog();
  state.reviewFilter = "wrong"; state.celebrate = true;
  go("results");
}

export function startExam() {
  closeDialog();
  state.session = newSession("exam", drawExam());
  store.set(KEYS.exam, state.session);
  go("quiz"); startTimer();
}
export function startPractice(domains) {
  const qs = shuffle(QUESTIONS.filter(q => domains.includes(q.domain)));
  if (!qs.length) return;
  state.session = newSession("practice", qs, domains);
  store.set(KEYS.practice, state.session);
  go("quiz");
}
// Série de « Révision du jour » : les questions dont l'échéance est arrivée (les plus en retard d'abord),
// au plus `profile.daily`, présentées dans le désordre. C'est une session d'entraînement marquée `kind: "review"`.
export function startReview() {
  const ids = pickReview(state.stats, dayKey(), state.profile.daily, id => !!Q_BY_ID[id]);
  if (!ids.length) return;
  state.session = newSession("practice", shuffle(ids).map(id => Q_BY_ID[id]), null, "review");
  store.set(KEYS.practice, state.session);
  go("quiz");
}
export function move(i) {
  const to = Math.max(0, Math.min(state.session.ids.length - 1, i));
  state.slide = to > state.session.current ? "next" : to < state.session.current ? "prev" : "";
  state.session.current = to;
  state.view = "quiz"; save(); render(); window.scrollTo(0, 0);
}
