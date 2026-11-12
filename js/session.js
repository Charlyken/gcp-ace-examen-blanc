/* Cycle de vie d'une session : chargement, sauvegarde, chronomètre, démarrage et fin. */
import { CONFIG, KEYS, HISTORY_MAX } from "./config.js";
import { QUESTIONS, Q_BY_ID } from "./data.js";
import { state, record, saveStats, saveOnboarding, awardXp } from "./state.js";
import { store } from "./storage.js";
import { clock, shuffle, dayKey } from "./utils.js";
import { compute, drawExam, newSession, isSessionUsable } from "./logic.js";
import { pickReview } from "./srs.js";
import { pickLesson } from "./lesson.js";
import { pickPlacement, summarizePlacement, completePlacement, markOnboarding } from "./onboarding.js";
import { newSessionXp, recordAnswerXp, settleSessionXp } from "./xp.js";
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

// Suivi d'XP d'une session ; les sessions sauvegardées avant l'XP n'en ont pas.
const ensureXp = s => (s.xp = s.xp && s.xp.gain ? s.xp : newSessionXp(state.xp.total));
// À appeler au démarrage d'une session : mémorise le total d'XP de départ (pour détecter un changement de niveau).
export function beginSession(s) { ensureXp(s).start = state.xp.total; return s; }

// XP d'une réponse validée en entraînement ; renvoie l'XP gagné.
export function awardForAnswer(id, ok) {
  const gained = awardXp(id, ok);
  state.session.xp = recordAnswerXp(ensureXp(state.session), id, gained);
  return gained;
}

export function finish(timeUp) {
  if (!state.session || state.session.finished) return;
  const s = state.session;
  if (s.mode === "exam" && state.endTime) s.remainingMs = Math.max(0, state.endTime - Date.now());
  stopTimer();
  s.finished = true; s.timeUp = !!timeUp; s.finishedAt = Date.now();
  const r = compute(s);
  const settled = settleSessionXp(state.xp, s, r, dayKey());
  state.xp = settled.xp; s.xp = settled.summary;
  if (s.kind === "placement") { state.onboarding = completePlacement(state.onboarding, summarizePlacement(r), Date.now()); saveOnboarding(); }
  store.set(KEYS[s.mode], s);
  if (s.mode === "exam") r.items.forEach(i => record(i.id, i.status === "ok"));
  saveStats();
  if (s.mode === "exam") {
    const h = store.get(KEYS.history) || [];
    h.unshift({ date: s.finishedAt, ok: r.ok, total: r.total, pct: r.pct, usedMs: CONFIG.examMinutes * 60000 - (s.remainingMs || 0) });
    store.set(KEYS.history, h.slice(0, HISTORY_MAX));
  }
  closeDialog();
  state.reviewFilter = "wrong"; state.celebrate = true;
  go("results");
}

export function startExam() {
  closeDialog();
  state.session = beginSession(newSession("exam", drawExam()));
  store.set(KEYS.exam, state.session);
  go("quiz"); startTimer();
}
export function startPractice(domains) {
  const qs = shuffle(QUESTIONS.filter(q => domains.includes(q.domain)));
  if (!qs.length) return;
  state.session = beginSession(newSession("practice", qs, domains));
  store.set(KEYS.practice, state.session);
  go("quiz");
}
// Test de niveau (onboarding) : 10 questions, 2 par domaine. Les réponses alimentent les cartes de révision, donc la maîtrise par domaine.
export function startPlacement() {
  const { ids } = pickPlacement({ questions: QUESTIONS, stats: state.stats });
  if (!ids.length) return;
  state.onboarding = markOnboarding(state.onboarding, "started", Date.now()); saveOnboarding();
  state.session = beginSession(newSession("practice", ids.map(id => Q_BY_ID[id]), null, "placement"));
  store.set(KEYS.practice, state.session);
  go("quiz");
}

// Leçon courte : un mélange de questions à réviser, à consolider et nouvelles (voir lesson.js).
export function startLesson() {
  const { ids } = pickLesson({ questions: QUESTIONS, stats: state.stats, today: dayKey() });
  if (!ids.length) return;
  state.session = beginSession(newSession("practice", ids.map(id => Q_BY_ID[id]), null, "lesson"));
  store.set(KEYS.practice, state.session);
  go("quiz");
}

// Série de « Révision du jour » : les questions dont l'échéance est arrivée (les plus en retard d'abord),
// au plus `profile.daily`, présentées dans le désordre. C'est une session d'entraînement marquée `kind: "review"`.
export function startReview() {
  const ids = pickReview(state.stats, dayKey(), state.profile.daily, id => !!Q_BY_ID[id]);
  if (!ids.length) return;
  state.session = beginSession(newSession("practice", shuffle(ids).map(id => Q_BY_ID[id]), null, "review"));
  store.set(KEYS.practice, state.session);
  go("quiz");
}
export function move(i) {
  const to = Math.max(0, Math.min(state.session.ids.length - 1, i));
  state.slide = to > state.session.current ? "next" : to < state.session.current ? "prev" : "";
  state.session.current = to;
  state.view = "quiz"; save(); render(); window.scrollTo(0, 0);
}
