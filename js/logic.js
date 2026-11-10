/* Logique métier pure : tirage, correction, statistiques, profil.
   Aucune dépendance au DOM, au stockage ni à l'état global : importable (et testable) depuis Node. */
import { CONFIG, DEFAULT_PROFILE, AVATAR_COLORS, THEMES } from "./config.js";
import { DOMAINS, QUESTIONS, Q_BY_ID } from "./data.js";
import { shuffle, pct, isCorrect, num, dayKey } from "./utils.js";

/* ---------------- Tirage de l'examen ---------------- */
// Tirage de l'examen : réparti par domaine selon DOMAINS[*].weight (méthode du plus fort reste).
// Nombre de questions par domaine, selon les poids (méthode du plus fort reste) ; `lens` = taille de chaque réserve.
export function examQuota(lens) {
  const size = Math.min(CONFIG.examSize, QUESTIONS.length);
  const ids = Object.keys(DOMAINS).map(Number);
  const totalW = ids.reduce((s, d) => s + DOMAINS[d].weight, 0);
  const quota = {}; let used = 0;
  const rests = ids.map(d => {
    const exact = size * DOMAINS[d].weight / totalW;
    quota[d] = Math.min(Math.floor(exact), lens[d]); used += quota[d];
    return { d, r: exact - Math.floor(exact) };
  }).sort((a, b) => b.r - a.r);
  let guard = 0;
  while (used < size && guard++ < 500) {
    const { d } = rests[(guard - 1) % rests.length];
    if (quota[d] < lens[d]) { quota[d]++; used++; }
  }
  return quota;
}
export function drawExam() {
  const ids = Object.keys(DOMAINS).map(Number);
  const pools = Object.fromEntries(ids.map(d => [d, shuffle(QUESTIONS.filter(q => q.domain === d))]));
  const quota = examQuota(Object.fromEntries(ids.map(d => [d, pools[d].length])));
  return shuffle(ids.flatMap(d => pools[d].slice(0, quota[d])));
}

/* ---------------- Sessions ---------------- */
export function newSession(mode, questions, domains) {
  const order = {};
  questions.forEach(q => { order[q.id] = shuffle(q.options.map((_, i) => i)); });
  return {
    mode, ids: questions.map(q => q.id), order,
    answers: {}, validated: {}, flags: {}, current: 0,
    remainingMs: mode === "exam" ? CONFIG.examMinutes * 60000 : null,
    domains: domains || null, finished: false, startedAt: Date.now()
  };
}
// Une session sauvegardée est inutilisable si des questions ont été retirées de la banque.
export function isSessionUsable(s) {
  return !!s && Array.isArray(s.ids) && s.ids.length > 0 &&
    !s.ids.some(id => !Q_BY_ID[id] || !s.order || !s.order[id] || s.order[id].length !== Q_BY_ID[id].options.length);
}

// Compteurs de l'en-tête : réponses données (examen) ou validées (entraînement), restantes, marquées.
export function counters(s) {
  const done = s.mode === "exam"
    ? s.ids.filter(id => (s.answers[id] || []).length).length
    : s.ids.filter(id => s.validated[id]).length;
  return { done, left: s.ids.length - done, flagged: s.ids.filter(id => s.flags[id]).length };
}
// Entraînement : score courant et série de bonnes réponses consécutives.
export function streakInfo(s) {
  const log = s.log || [];
  const good = id => isCorrect(Q_BY_ID[id], s.answers[id]);
  let streak = 0; for (let i = log.length - 1; i >= 0 && good(log[i]); i--) streak++;
  return { done: log.length, ok: log.filter(good).length, streak };
}

/* ---------------- Calcul des résultats ---------------- */
export function compute(s) {
  // En entraînement, seules les questions validées comptent.
  const ids = s.mode === "exam" ? s.ids : s.ids.filter(id => s.validated[id]);
  const byDomain = {};
  Object.keys(DOMAINS).forEach(d => byDomain[d] = { ok: 0, total: 0 });
  const items = ids.map(id => {
    const q = Q_BY_ID[id], a = s.answers[id] || [];
    const status = !a.length ? "empty" : isCorrect(q, a) ? "ok" : "ko";
    byDomain[q.domain].total++; if (status === "ok") byDomain[q.domain].ok++;
    return { id, q, a, status, flagged: !!s.flags[id] };
  });
  const ok = items.filter(i => i.status === "ok").length;
  return { items, ok, total: items.length, pct: pct(ok, items.length), byDomain };
}

/* ---------------- Profil ---------------- */
// Ne conserve que des valeurs valides : utilisé au chargement, à la saisie et à l'import.
export function sanitizeProfile(p) {
  p = p && typeof p === "object" ? p : {};
  return {
    name: String(p.name || "").trim().slice(0, 30),
    color: AVATAR_COLORS.includes(Number(p.color)) ? Number(p.color) : DEFAULT_PROFILE.color,
    target: num(p.target, DEFAULT_PROFILE.target, 50, 100),
    examDate: /^\d{4}-\d{2}-\d{2}$/.test(p.examDate || "") ? p.examDate : "",
    daily: num(p.daily, DEFAULT_PROFILE.daily, 1, 200),
    theme: THEMES[p.theme] ? p.theme : "auto"
  };
}
export const initialsOf = name => (String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("") || "?").toUpperCase();

// Jours restants avant la date d'examen du profil (null si non renseignée, négatif si passée).
export function daysToExam(profile) {
  if (!profile.examDate) return null;
  return Math.round((new Date(profile.examDate + "T12:00:00") - new Date(dayKey() + "T12:00:00")) / 86400000);
}
export function countdownText(profile) {
  const d = daysToExam(profile);
  return d === null ? "" : d > 1 ? `J-${d} avant ton examen` : d === 1 ? "Examen demain" : d === 0 ? "Examen aujourd'hui" : `Examen passé il y a ${-d} jour${-d > 1 ? "s" : ""}`;
}

/* ---------------- Tableau de bord ---------------- */
export function dashData(stats, activity, history) {
  const doms = Object.keys(DOMAINS).map(d => {
    const qs = QUESTIONS.filter(q => q.domain == d), tried = qs.filter(q => stats[q.id]), ok = tried.filter(q => stats[q.id].ok);
    return { d, total: qs.length, tried: tried.length, ok: ok.length, rate: pct(ok.length, tried.length), mastery: pct(ok.length, qs.length) };
  });
  const tried = QUESTIONS.filter(q => stats[q.id]);
  const errs = tried.filter(q => !stats[q.id].ok).sort((a, b) => stats[b.id].n - stats[a.id].n);
  const days = Object.values(activity);
  const attempts = Object.values(stats).reduce((s, v) => s + (v.n || 0), 0);
  const actN = days.reduce((s, a) => s + a.n, 0), actOk = days.reduce((s, a) => s + a.ok, 0);
  const best = history.reduce((m, h) => Math.max(m, h.pct), 0);
  const avg = history.length ? Math.round(history.reduce((s, h) => s + h.pct, 0) / history.length) : 0;
  const today = activity[dayKey()] || { n: 0, ok: 0 };
  // Jours consécutifs avec au moins une réponse validée (aujourd'hui compris s'il est actif).
  let streak = 0;
  for (let i = 0; i < 400; i++) { const d = new Date(); d.setDate(d.getDate() - i); const a = activity[dayKey(d)]; if (a && a.n) streak++; else if (i) break; }
  return { history, doms, tried: tried.length, mastered: tried.length - errs.length, errs, attempts, actN, actOk, best, avg, today, streak };
}
