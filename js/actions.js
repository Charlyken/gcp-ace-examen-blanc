/* Actions déclenchées par les attributs data-action. */
import { KEYS } from "./config.js";
import { DOMAINS, QUESTIONS, Q_BY_ID } from "./data.js";
import { state, saveStats, record } from "./state.js";
import { store } from "./storage.js";
import { shuffle, isCorrect } from "./utils.js";
import { newSession, counters } from "./logic.js";
import { newXp } from "./xp.js";
import { exportData } from "./data-io.js";
import { loadSession, save, startTimer, startExam, startPractice, startReview, startLesson, move, finish, beginSession, awardForAnswer } from "./session.js";
import { go } from "./router.js";
import { renderQuiz, refreshChrome } from "./views/quiz.js";
import { renderHome, selectedDomains, updatePracticeCount } from "./views/home.js";
import { openDialog, closeDialog, toast } from "./ui/dialog.js";

export const actions = {
  "new-exam": startExam,
  "ask-new-exam": () => openDialog("Abandonner l'examen en cours ?", "Tes réponses actuelles seront effacées et un nouveau tirage de questions commencera.", "Nouvel examen", "new-exam"),
  "new-practice": () => startPractice(selectedDomains()),
  "new-review": startReview,
  "new-lesson": startLesson,
  "practice-all": () => startPractice(Object.keys(DOMAINS).map(Number)),
  "practice-domain": el => startPractice([Number(el.dataset.d)]),
  "toggle-domains": () => {
    const boxes = document.querySelectorAll("#domain-chips input");
    const all = Array.from(boxes).every(b => b.checked);
    boxes.forEach(b => { b.checked = !all; });
    updatePracticeCount();
  },
  "new-errors": () => {                                    // rejoue les questions ratées à la dernière tentative
    const qs = shuffle(QUESTIONS.filter(q => state.stats[q.id] && !state.stats[q.id].ok));
    if (!qs.length) return;
    state.session = beginSession(newSession("practice", qs)); store.set(KEYS.practice, state.session); go("quiz");
  },
  "train-domain": el => startPractice([Number(el.dataset.domain)]),
  "resume": el => { state.session = loadSession(el.dataset.mode); if (!state.session || state.session.finished) { state.session = null; return renderHome(); } go("quiz"); startTimer(); },
  "show-results": el => { state.session = loadSession(el.dataset.mode); if (state.session) { state.reviewFilter = "wrong"; go("results"); } },
  "home": () => { state.session = null; go("home"); },
  "nav": el => { state.session = null; go(el.dataset.view); },
  "export": exportData,
  "import": () => { const f = document.getElementById("import-file"); if (f) { f.value = ""; f.click(); } },
  "ask-reset": () => openDialog("Réinitialiser la progression ?", "Statistiques, activité, points d'expérience, historique des examens et sessions en cours seront effacés. Ton profil est conservé.", "Réinitialiser", "reset"),
  "reset": () => {
    ["exam", "practice", "history", "stats", "activity", "xp"].forEach(k => store.del(KEYS[k]));
    state.stats = {}; state.activity = {}; state.xp = newXp(); state.session = null;
    closeDialog(); go("profile"); toast("Progression réinitialisée");
  },
  "quit": () => { save(); state.session = null; go("home"); },   // la session reste enregistrée pour être reprise
  "prev": () => move(state.session.current - 1),
  "next": () => move(state.session.current + 1),
  "goto": el => move(Number(el.dataset.i)),
  "flag": el => {
    const id = state.session.ids[state.session.current];
    if (state.session.flags[id]) delete state.session.flags[id]; else state.session.flags[id] = true;
    save();
    el.setAttribute("aria-pressed", String(!!state.session.flags[id]));
    el.querySelector("span").textContent = state.session.flags[id] ? "Marquée" : "À revoir";
    refreshChrome();
  },
  "validate": () => {
    const id = state.session.ids[state.session.current];
    if (!(state.session.answers[id] || []).length) return;
    state.session.validated[id] = true; (state.session.log = state.session.log || []).push(id);
    const ok = isCorrect(Q_BY_ID[id], state.session.answers[id]);
    record(id, ok); awardForAnswer(id, ok); saveStats();
    save(); renderQuiz();
  },
  "ask-finish": () => {
    if (state.session.mode === "exam") { state.preFilter = "all"; return go("review"); }
    const c = counters(state.session);
    if (state.session.mode === "practice" && !Object.keys(state.session.validated).length) { store.del(KEYS.practice); state.session = null; return go("home"); }
    const body = state.session.mode === "exam"
      ? (c.left ? `Il reste <strong>${c.left}</strong> question${c.left > 1 ? "s" : ""} sans réponse` : "Tu as répondu à toutes les questions") +
        (c.flagged ? ` et <strong>${c.flagged}</strong> marquée${c.flagged > 1 ? "s" : ""} à revoir` : "") + ". Tu ne pourras plus modifier tes réponses."
      : `Les résultats porteront sur les <strong>${c.done}</strong> question${c.done > 1 ? "s" : ""} validée${c.done > 1 ? "s" : ""}.`;
    openDialog(state.session.mode === "exam" ? "Terminer l'examen ?" : "Terminer la session ?", body, "Voir les résultats", "finish");
  },
  "back-quiz": () => go("quiz"),
  "ask-submit": () => {
    const c = counters(state.session);
    openDialog("Soumettre l'examen ?", (c.left ? `Il reste <strong>${c.left}</strong> question${c.left > 1 ? "s" : ""} sans réponse. ` : "") + "Tu ne pourras plus modifier tes réponses.", "Soumettre", "finish");
  },
  "finish": () => finish(false),
  "close-dialog": closeDialog
};
