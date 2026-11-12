/* Navigation entre les vues. */
import { app } from "./dom.js";
import { state } from "./state.js";
import { stopTimer } from "./session.js";
import { renderHome } from "./views/home.js";
import { renderQuiz, renderReview } from "./views/quiz.js";
import { renderResults } from "./views/results.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderProfile } from "./views/profile.js";
import { renderWelcome } from "./views/onboarding.js";

export function go(v) {
  state.view = v;
  if (v !== "quiz" && v !== "review") stopTimer();
  render();
  window.scrollTo(0, 0);
}
export function render() {
  // En examen, l'interface passe en version dépouillée (classe .exam).
  app.className = state.session && state.session.mode === "exam" && (state.view === "quiz" || state.view === "review") ? "exam" : "";
  if (state.view === "quiz" && state.session) renderQuiz();
  else if (state.view === "review" && state.session) renderReview();
  else if (state.view === "results" && state.session) renderResults();
  else if (state.view === "dashboard") renderDashboard();
  else if (state.view === "profile") renderProfile();
  else if (state.view === "welcome") renderWelcome();
  else renderHome();
}
