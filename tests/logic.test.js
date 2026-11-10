import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { CONFIG, DEFAULT_PROFILE } from "../js/config.js";
import { DOMAINS, QUESTIONS, Q_BY_ID } from "../js/data.js";
import {
  examQuota, drawExam, newSession, isSessionUsable, counters, streakInfo, compute,
  sanitizeProfile, initialsOf, daysToExam, countdownText, dashData
} from "../js/logic.js";
import { dayKey } from "../js/utils.js";
import { seedRandom, freezeDate } from "./helpers.js";

const domainIds = Object.keys(DOMAINS).map(Number);
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
const fullLens = () => Object.fromEntries(domainIds.map(d => [d, QUESTIONS.filter(q => q.domain === d).length]));
// Une réponse fausse garantie pour une question donnée.
const wrongFor = q => [q.options.map((_, i) => i).find(i => !q.correct.includes(i))];

describe("examQuota : répartition par domaine", () => {
  test("totalise la taille de l'examen quand la banque est assez fournie", () => {
    const q = examQuota(fullLens());
    assert.equal(sum(q), Math.min(CONFIG.examSize, QUESTIONS.length));
  });

  test("suit les poids des domaines (plus fort reste)", () => {
    const big = Object.fromEntries(domainIds.map(d => [d, 1000]));
    const q = examQuota(big);
    assert.equal(sum(q), CONFIG.examSize);
    const totalW = domainIds.reduce((s, d) => s + DOMAINS[d].weight, 0);
    for (const d of domainIds) {
      const exact = CONFIG.examSize * DOMAINS[d].weight / totalW;
      assert.ok(q[d] === Math.floor(exact) || q[d] === Math.ceil(exact), `domaine ${d} : ${q[d]} vs ${exact}`);
    }
  });

  test("ne dépasse jamais la réserve d'un domaine", () => {
    const lens = { 1: 3, 2: 100, 3: 100, 4: 100, 5: 100 };
    const q = examQuota(lens);
    assert.ok(q[1] <= 3);
    assert.equal(sum(q), CONFIG.examSize, "le reste est redistribué aux autres domaines");
  });

  test("plafonne au nombre de questions disponibles", () => {
    const q = examQuota({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 });
    assert.equal(sum(q), 10);
    for (const d of domainIds) assert.equal(q[d], 2);
  });

  test("réserves vides : aucun tirage et pas de boucle infinie", () => {
    const q = examQuota({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    assert.equal(sum(q), 0);
  });
});

describe("drawExam : tirage de l'examen", () => {
  test("tire le bon nombre de questions, sans doublon, toutes issues de la banque", t => {
    seedRandom(t, 11);
    const ids = drawExam().map(q => q.id);
    assert.equal(ids.length, Math.min(CONFIG.examSize, QUESTIONS.length));
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.ok(Q_BY_ID[id], id);
  });

  test("respecte le quota par domaine", t => {
    seedRandom(t, 12);
    const drawn = drawExam();
    const expected = examQuota(fullLens());
    for (const d of domainIds) assert.equal(drawn.filter(q => q.domain === d).length, expected[d], `domaine ${d}`);
  });

  test("deux tirages différents donnent des examens différents, un même tirage le même", t => {
    seedRandom(t, 1); const a = drawExam().map(q => q.id);
    t.mock.restoreAll(); seedRandom(t, 2); const b = drawExam().map(q => q.id);
    t.mock.restoreAll(); seedRandom(t, 1); const c = drawExam().map(q => q.id);
    assert.notDeepEqual(a, b);
    assert.deepEqual(a, c);
  });
});

describe("newSession et isSessionUsable", () => {
  test("session d'examen : chrono plein, ordre des options = permutation", t => {
    seedRandom(t, 5);
    freezeDate(t, 2026, 11, 10);
    const qs = QUESTIONS.slice(0, 5);
    const s = newSession("exam", qs);
    assert.equal(s.mode, "exam");
    assert.deepEqual(s.ids, qs.map(q => q.id));
    assert.equal(s.remainingMs, CONFIG.examMinutes * 60000);
    assert.equal(s.current, 0);
    assert.equal(s.finished, false);
    assert.equal(s.startedAt, new Date(2026, 10, 10, 12).getTime());
    assert.deepEqual(s.answers, {}); assert.deepEqual(s.validated, {}); assert.deepEqual(s.flags, {});
    for (const q of qs) assert.deepEqual(s.order[q.id].slice().sort((a, b) => a - b), q.options.map((_, i) => i));
  });

  test("session d'entraînement : pas de chrono, domaines conservés", () => {
    const s = newSession("practice", QUESTIONS.slice(0, 2), [1, 3]);
    assert.equal(s.remainingMs, null);
    assert.deepEqual(s.domains, [1, 3]);
    assert.equal(newSession("practice", QUESTIONS.slice(0, 2)).domains, null);
  });

  test("kind distingue la révision du jour de l'entraînement libre", () => {
    assert.equal(newSession("practice", QUESTIONS.slice(0, 2), null, "review").kind, "review");
    assert.equal(newSession("practice", QUESTIONS.slice(0, 2), [1]).kind, null);
    assert.equal(newSession("exam", QUESTIONS.slice(0, 2)).kind, null);
  });

  test("isSessionUsable accepte une session valide", () => {
    assert.equal(isSessionUsable(newSession("exam", QUESTIONS.slice(0, 3))), true);
  });

  test("isSessionUsable refuse les sessions inutilisables", () => {
    const good = () => newSession("exam", QUESTIONS.slice(0, 3));
    assert.equal(isSessionUsable(null), false);
    assert.equal(isSessionUsable(undefined), false);
    assert.equal(isSessionUsable({}), false);
    assert.equal(isSessionUsable({ ...good(), ids: [] }), false, "aucune question");
    assert.equal(isSessionUsable({ ...good(), ids: "x" }), false);
    const unknown = good(); unknown.ids[0] = "question-supprimee"; assert.equal(isSessionUsable(unknown), false);
    const noOrder = good(); delete noOrder.order; assert.equal(isSessionUsable(noOrder), false);
    const badLen = good(); badLen.order[badLen.ids[0]] = [0, 1]; assert.equal(isSessionUsable(badLen), false, "nombre d'options modifié");
  });
});

describe("counters et streakInfo", () => {
  const qs = QUESTIONS.slice(0, 4);
  test("examen : compte les questions répondues, pas les validées", () => {
    const s = newSession("exam", qs);
    s.answers[qs[0].id] = [0]; s.answers[qs[1].id] = []; s.flags[qs[2].id] = true;
    assert.deepEqual(counters(s), { done: 1, left: 3, flagged: 1 });
  });
  test("entraînement : compte les questions validées", () => {
    const s = newSession("practice", qs);
    s.answers[qs[0].id] = [0]; s.validated[qs[1].id] = true;
    assert.deepEqual(counters(s), { done: 1, left: 3, flagged: 0 });
  });
  test("streakInfo : série de bonnes réponses en fin de journal", () => {
    const s = newSession("practice", qs);
    s.log = [qs[0].id, qs[1].id, qs[2].id];
    s.answers[qs[0].id] = wrongFor(qs[0]);
    s.answers[qs[1].id] = qs[1].correct.slice();
    s.answers[qs[2].id] = qs[2].correct.slice();
    assert.deepEqual(streakInfo(s), { done: 3, ok: 2, streak: 2 });
  });
  test("streakInfo : tout le journal juste, y compris la première réponse", () => {
    const s = newSession("practice", qs);
    s.log = [qs[0].id];
    s.answers[qs[0].id] = qs[0].correct.slice();
    assert.deepEqual(streakInfo(s), { done: 1, ok: 1, streak: 1 });
    s.log = [qs[0].id, qs[1].id, qs[2].id];
    s.answers[qs[1].id] = qs[1].correct.slice(); s.answers[qs[2].id] = qs[2].correct.slice();
    assert.deepEqual(streakInfo(s), { done: 3, ok: 3, streak: 3 });
  });
  test("streakInfo : une erreur récente remet la série à zéro ; journal absent toléré", () => {
    const s = newSession("practice", qs);
    assert.deepEqual(streakInfo(s), { done: 0, ok: 0, streak: 0 });
    s.log = [qs[0].id, qs[1].id];
    s.answers[qs[0].id] = qs[0].correct.slice();
    s.answers[qs[1].id] = wrongFor(qs[1]);
    assert.deepEqual(streakInfo(s), { done: 2, ok: 1, streak: 0 });
  });
});

describe("compute : calcul des résultats", () => {
  test("examen : compte justes, fausses et sans réponse, par domaine", () => {
    const qs = [QUESTIONS.find(q => q.domain === 1), QUESTIONS.find(q => q.domain === 2), QUESTIONS.find(q => q.domain === 3), QUESTIONS.find(q => q.domain === 3 && q.id !== QUESTIONS.find(x => x.domain === 3).id)];
    const s = newSession("exam", qs);
    s.answers[qs[0].id] = qs[0].correct.slice();   // juste
    s.answers[qs[1].id] = wrongFor(qs[1]);         // fausse
    s.answers[qs[2].id] = qs[2].correct.slice();   // juste
    /* qs[3] : sans réponse */
    s.flags[qs[1].id] = true;
    const r = compute(s);
    assert.equal(r.total, 4); assert.equal(r.ok, 2); assert.equal(r.pct, 50);
    assert.deepEqual(r.items.map(i => i.status), ["ok", "ko", "ok", "empty"]);
    assert.deepEqual(r.items.map(i => i.flagged), [false, true, false, false]);
    assert.deepEqual(r.byDomain[1], { ok: 1, total: 1 });
    assert.deepEqual(r.byDomain[2], { ok: 0, total: 1 });
    assert.deepEqual(r.byDomain[3], { ok: 1, total: 2 });
    assert.deepEqual(r.byDomain[4], { ok: 0, total: 0 });
  });

  test("entraînement : seules les questions validées comptent", () => {
    const qs = QUESTIONS.slice(0, 3);
    const s = newSession("practice", qs);
    s.answers[qs[0].id] = qs[0].correct.slice(); s.validated[qs[0].id] = true;
    s.answers[qs[1].id] = qs[1].correct.slice();            // répondue mais non validée
    const r = compute(s);
    assert.equal(r.total, 1); assert.equal(r.ok, 1); assert.equal(r.pct, 100);
  });

  test("réponse multiple : tout ou rien", () => {
    const q = QUESTIONS.find(x => x.correct.length > 1);
    const s = newSession("exam", [q]);
    s.answers[q.id] = [q.correct[0]];
    assert.equal(compute(s).items[0].status, "ko", "réponse partielle");
    s.answers[q.id] = q.correct.slice().reverse();
    assert.equal(compute(s).items[0].status, "ok", "ordre sans importance");
  });

  test("session vide : 0 % sans erreur", () => {
    const r = compute(newSession("practice", QUESTIONS.slice(0, 2)));
    assert.deepEqual([r.total, r.ok, r.pct], [0, 0, 0]);
  });
});

describe("sanitizeProfile", () => {
  test("valeurs par défaut pour une entrée invalide", () => {
    for (const bad of [null, undefined, 42, "texte", []]) assert.deepEqual(sanitizeProfile(bad), DEFAULT_PROFILE);
  });
  test("nettoie le prénom : espaces retirés, 30 caractères maximum", () => {
    assert.equal(sanitizeProfile({ name: "  Alex  " }).name, "Alex");
    assert.equal(sanitizeProfile({ name: "x".repeat(50) }).name.length, 30);
    assert.equal(sanitizeProfile({ name: null }).name, "");
  });
  test("borne le score visé (50-100) et l'objectif quotidien (1-200)", () => {
    assert.equal(sanitizeProfile({ target: 10 }).target, 50);
    assert.equal(sanitizeProfile({ target: 999 }).target, 100);
    assert.equal(sanitizeProfile({ target: "85" }).target, 85);
    assert.equal(sanitizeProfile({ target: "abc" }).target, DEFAULT_PROFILE.target);
    assert.equal(sanitizeProfile({ daily: 0 }).daily, 1);
    assert.equal(sanitizeProfile({ daily: 500 }).daily, 200);
  });
  test("couleur, thème et date d'examen : valeurs invalides ignorées", () => {
    assert.equal(sanitizeProfile({ color: "3" }).color, 3);
    assert.equal(sanitizeProfile({ color: 9 }).color, DEFAULT_PROFILE.color);
    assert.equal(sanitizeProfile({ theme: "dark" }).theme, "dark");
    assert.equal(sanitizeProfile({ theme: "neon" }).theme, "auto");
    assert.equal(sanitizeProfile({ examDate: "2026-12-01" }).examDate, "2026-12-01");
    assert.equal(sanitizeProfile({ examDate: "01/12/2026" }).examDate, "");
    assert.equal(sanitizeProfile({ examDate: 20261201 }).examDate, "");
  });
  test("est idempotent", () => {
    const p = sanitizeProfile({ name: " Zoé ", color: 4, target: 90, examDate: "2027-02-03", daily: 20, theme: "light" });
    assert.deepEqual(sanitizeProfile(p), p);
  });
});

describe("initialsOf", () => {
  test("deux initiales au plus, en majuscules, « ? » si vide", () => {
    assert.equal(initialsOf("alex martin"), "AM");
    assert.equal(initialsOf("Jean Pierre Dupont"), "JP");
    assert.equal(initialsOf("  zoé  "), "Z");
    assert.equal(initialsOf(""), "?");
    assert.equal(initialsOf("   "), "?");
  });
});

describe("daysToExam et countdownText", () => {
  test("sans date : null et texte vide", () => {
    assert.equal(daysToExam({ examDate: "" }), null);
    assert.equal(countdownText({ examDate: "" }), "");
  });
  test("compte les jours restants à partir d'aujourd'hui", t => {
    freezeDate(t, 2026, 11, 10, 23);                       // tard le soir : le décompte reste en jours entiers
    assert.equal(daysToExam({ examDate: "2026-11-15" }), 5);
    assert.equal(daysToExam({ examDate: "2026-11-10" }), 0);
    assert.equal(daysToExam({ examDate: "2026-11-09" }), -1);
    assert.equal(countdownText({ examDate: "2026-11-15" }), "J-5 avant ton examen");
    assert.equal(countdownText({ examDate: "2026-11-11" }), "Examen demain");
    assert.equal(countdownText({ examDate: "2026-11-10" }), "Examen aujourd'hui");
    assert.equal(countdownText({ examDate: "2026-11-09" }), "Examen passé il y a 1 jour");
    assert.equal(countdownText({ examDate: "2026-11-05" }), "Examen passé il y a 5 jours");
  });
  test("traverse un changement d'heure sans décalage d'un jour", t => {
    freezeDate(t, 2026, 3, 27, 12);
    assert.equal(daysToExam({ examDate: "2026-03-30" }), 3);
  });
});

describe("dashData", () => {
  const A = QUESTIONS[0], B = QUESTIONS[1], C = QUESTIONS[2];
  test("sans données : tout à zéro", t => {
    freezeDate(t, 2026, 11, 10);
    const d = dashData({}, {}, []);
    assert.equal(d.tried, 0); assert.equal(d.mastered, 0); assert.equal(d.errs.length, 0);
    assert.equal(d.attempts, 0); assert.equal(d.streak, 0); assert.equal(d.best, 0); assert.equal(d.avg, 0);
    assert.deepEqual(d.today, { n: 0, ok: 0 });
    assert.equal(d.doms.length, domainIds.length);
  });
  test("statistiques par question : abordées, maîtrisées, à retravailler triées par essais", t => {
    freezeDate(t, 2026, 11, 10);
    const stats = { [A.id]: { n: 1, ok: true }, [B.id]: { n: 2, ok: false }, [C.id]: { n: 5, ok: false } };
    const d = dashData(stats, {}, []);
    assert.equal(d.tried, 3); assert.equal(d.mastered, 1);
    assert.deepEqual(d.errs.map(q => q.id), [C.id, B.id], "les plus ratées d'abord");
    assert.equal(d.attempts, 8);
    const dom = d.doms.find(x => x.d == A.domain);
    assert.ok(dom.tried >= 1 && dom.total === QUESTIONS.filter(q => q.domain === A.domain).length);
  });
  test("historique : meilleur score et moyenne", t => {
    freezeDate(t, 2026, 11, 10);
    const h = [{ pct: 60 }, { pct: 80 }, { pct: 70 }];
    const d = dashData({}, {}, h);
    assert.equal(d.best, 80); assert.equal(d.avg, 70);
  });
  test("activité : réponses du jour et totaux", t => {
    freezeDate(t, 2026, 11, 10);
    const act = { "2026-11-10": { n: 4, ok: 3 }, "2026-11-09": { n: 6, ok: 2 } };
    const d = dashData({}, act, []);
    assert.deepEqual(d.today, { n: 4, ok: 3 });
    assert.equal(d.actN, 10); assert.equal(d.actOk, 5);
  });
  test("série de jours : consécutifs, aujourd'hui compris", t => {
    freezeDate(t, 2026, 11, 10);
    const act = { "2026-11-10": { n: 1, ok: 1 }, "2026-11-09": { n: 2, ok: 1 }, "2026-11-08": { n: 3, ok: 3 }, "2026-11-06": { n: 5, ok: 5 } };
    assert.equal(dashData({}, act, []).streak, 3, "le trou du 7 interrompt la série");
  });
  test("série de jours : pas encore actif aujourd'hui ne casse pas la série d'hier", t => {
    freezeDate(t, 2026, 11, 10);
    const act = { "2026-11-09": { n: 2, ok: 1 }, "2026-11-08": { n: 3, ok: 3 } };
    assert.equal(dashData({}, act, []).streak, 2);
  });
  test("série de jours : aucune activité récente = 0 ; jours à zéro réponse ignorés", t => {
    freezeDate(t, 2026, 11, 10);
    assert.equal(dashData({}, { "2026-11-01": { n: 3, ok: 3 } }, []).streak, 0);
    assert.equal(dashData({}, { "2026-11-09": { n: 0, ok: 0 } }, []).streak, 0);
  });
  test("dayKey de la série suit la date locale", t => {
    freezeDate(t, 2026, 1, 1);
    assert.equal(dayKey(), "2026-01-01");
  });
});
