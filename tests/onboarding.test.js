import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PLACEMENT } from "../js/config.js";
import { DOMAINS, QUESTIONS } from "../js/data.js";
import {
  newOnboarding, normalizeOnboarding, shouldOnboard, pickPlacement, levelOf, summarizePlacement,
  completePlacement, markOnboarding, buildPlan
} from "../js/onboarding.js";
import { reviewCard } from "../js/srs.js";
import { seedRandom } from "./helpers.js";

const TODAY = "2026-11-12";
const domainOf = id => QUESTIONS.find(q => q.id === id).domain;
const diffOf = id => QUESTIONS.find(q => q.id === id).difficulty;
const placement = (byDomain) => { const total = Object.values(byDomain).reduce((n, v) => n + v.total, 0), ok = Object.values(byDomain).reduce((n, v) => n + v.ok, 0); return { pct: Math.round(ok / total * 100), total, byDomain }; };
const P60 = placement({ 1: { ok: 2, total: 2 }, 2: { ok: 1, total: 2 }, 3: { ok: 0, total: 2 }, 4: { ok: 2, total: 2 }, 5: { ok: 1, total: 2 } });
const profile = (over = {}) => ({ name: "", color: 1, target: 80, examDate: "", daily: 10, theme: "auto", ...over });

describe("normalizeOnboarding", () => {
  test("entrée inutilisable : état vide", () => {
    for (const bad of [null, undefined, 5, "x", []]) assert.deepEqual(normalizeOnboarding(bad), newOnboarding());
  });
  test("statut limité aux valeurs connues", () => {
    for (const s of ["", "started", "skipped", "done"]) assert.equal(normalizeOnboarding({ status: s }).status, s);
    assert.equal(normalizeOnboarding({ status: "autre" }).status, "");
  });
  test("date d'enregistrement : entier positif sinon 0", () => {
    assert.equal(normalizeOnboarding({ status: "done", at: 1762000000000.9 }).at, 1762000000000);
    for (const bad of [-1, NaN, "x", null]) assert.equal(normalizeOnboarding({ at: bad }).at, 0);
  });
  test("résultat du test : pourcentage recalculé depuis les domaines (valeur importée ignorée)", () => {
    const n = normalizeOnboarding({ status: "done", placement: { pct: 99, byDomain: P60.byDomain, at: 5 } });
    assert.equal(n.placement.pct, 60); assert.equal(n.placement.total, 10); assert.equal(n.placement.at, 5);
  });
  test("domaines inconnus, comptes invalides ou incohérents écartés", () => {
    const n = normalizeOnboarding({ placement: { byDomain: { 1: { ok: 2, total: 2 }, 2: { ok: 3, total: 2 }, 3: { ok: -1, total: 2 }, 4: { ok: 1.5, total: 2 }, 9: { ok: 1, total: 1 }, 5: { ok: 1, total: 0 }, x: { ok: 1, total: 1 } } } });
    assert.equal(n.placement, null, "il ne reste qu'un domaine de 2 questions : trop court pour un niveau");
    const m = normalizeOnboarding({ placement: { byDomain: { ...P60.byDomain, 9: { ok: 1, total: 1 }, 2: { ok: 5, total: 2 } } } });
    assert.deepEqual(Object.keys(m.placement.byDomain).sort(), ["1", "3", "4", "5"]);
  });
  test("test trop court (moins du minimum de questions) : pas de résultat", () => {
    assert.equal(normalizeOnboarding({ placement: { byDomain: { 1: { ok: 1, total: PLACEMENT.minForLevel - 1 } } } }).placement, null);
    assert.notEqual(normalizeOnboarding({ placement: { byDomain: { 1: { ok: 1, total: PLACEMENT.minForLevel } } } }).placement, null);
  });
  test("est idempotent", () => {
    const once = normalizeOnboarding({ status: "done", at: 10, placement: { ...P60, at: 9 } });
    assert.deepEqual(normalizeOnboarding(once), once);
  });
});

describe("shouldOnboard : jamais pour quelqu'un qui a déjà des données ou qui a déjà choisi", () => {
  const fresh = () => ({ onboarding: newOnboarding(), stats: {}, history: [], activity: {} });
  test("tout nouvel utilisateur", () => { assert.equal(shouldOnboard(fresh()), true); });
  test("tolère des valeurs absentes", () => {
    assert.equal(shouldOnboard({ onboarding: newOnboarding(), stats: undefined, history: null, activity: undefined }), true);
  });
  test("un choix déjà fait (test commencé, passé ou terminé) ne revient jamais", () => {
    for (const status of ["started", "skipped", "done"]) assert.equal(shouldOnboard({ ...fresh(), onboarding: { status } }), false, status);
  });
  test("un utilisateur existant (statistiques, examens ou activité) n'est jamais dérangé", () => {
    assert.equal(shouldOnboard({ ...fresh(), stats: { a: { n: 1 } } }), false);
    assert.equal(shouldOnboard({ ...fresh(), history: [{ pct: 50 }] }), false);
    assert.equal(shouldOnboard({ ...fresh(), activity: { "2026-11-10": { n: 1 } } }), false);
  });
});

describe("pickPlacement : le test de niveau", () => {
  test("10 questions sans doublon, 2 par domaine", t => {
    seedRandom(t, 1);
    const { ids } = pickPlacement({ questions: QUESTIONS });
    assert.equal(ids.length, PLACEMENT.size); assert.equal(new Set(ids).size, ids.length);
    for (const d of Object.keys(DOMAINS)) assert.equal(ids.filter(id => domainOf(id) === Number(d)).length, 2, `domaine ${d}`);
  });
  test("dans chaque domaine, une question plus facile et une plus difficile (difficultés différentes)", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const orig = Math.random; let a = seed; Math.random = () => { a = (a * 1664525 + 1013904223) % 4294967296; return a / 4294967296; };
      try {
        const { ids } = pickPlacement({ questions: QUESTIONS });
        for (const d of Object.keys(DOMAINS)) {
          const diffs = ids.filter(id => domainOf(id) === Number(d)).map(diffOf);
          assert.notEqual(diffs[0], diffs[1], `graine ${seed}, domaine ${d} : ${diffs}`);
        }
      } finally { Math.random = orig; }
    }
  });
  test("l'ordre est mélangé (les domaines ne sont pas groupés)", t => {
    let grouped = 0;
    for (let seed = 1; seed <= 20; seed++) { t.mock.restoreAll(); seedRandom(t, seed); const doms = pickPlacement({ questions: QUESTIONS }).ids.map(domainOf); if (doms.every((d, i) => i % 2 === 0 || d === doms[i - 1])) grouped++; }
    assert.ok(grouped < 3, `${grouped} tirages sur 20 sont groupés par domaine`);
  });
  test("préfère les questions jamais vues (refaire le test apporte du neuf)", t => {
    seedRandom(t, 2);
    const stats = {}; QUESTIONS.forEach((q, i) => { if (i % 4 !== 0) stats[q.id] = reviewCard(undefined, true, TODAY); });   // 1 question sur 4 jamais vue
    const unseen = new Set(QUESTIONS.filter(q => !stats[q.id]).map(q => q.id));
    const { ids } = pickPlacement({ questions: QUESTIONS, stats });
    assert.ok(ids.filter(id => unseen.has(id)).length >= 8, "au moins 8 questions jamais vues sur 10");
  });
  test("reproductible avec le même tirage, différent avec un autre", t => {
    seedRandom(t, 3); const a = pickPlacement({ questions: QUESTIONS }).ids;
    t.mock.restoreAll(); seedRandom(t, 3); const b = pickPlacement({ questions: QUESTIONS }).ids;
    t.mock.restoreAll(); seedRandom(t, 4); const c = pickPlacement({ questions: QUESTIONS }).ids;
    assert.deepEqual(a, b); assert.notDeepEqual(a, c);
  });
  test("taille non multiple du nombre de domaines : chaque domaine est représenté, aucun n'est privé de questions", () => {
    for (const size of [5, 7, 8, 12]) {
      const { ids } = pickPlacement({ questions: QUESTIONS, size });
      assert.equal(ids.length, size);
      for (const d of Object.keys(DOMAINS)) assert.ok(ids.some(id => domainOf(id) === Number(d)), `taille ${size} : domaine ${d} absent`);
    }
  });
  test("taille personnalisée, taille nulle, banque vide", () => {
    assert.equal(pickPlacement({ questions: QUESTIONS, size: 5 }).ids.length, 5);
    assert.equal(pickPlacement({ questions: QUESTIONS, size: 15 }).ids.length, 15);
    assert.deepEqual(pickPlacement({ questions: QUESTIONS, size: 0 }).ids, []);
    assert.deepEqual(pickPlacement({ questions: [] }).ids, []);
  });
  test("un domaine trop pauvre en questions est compensé par les autres", () => {
    const qs = QUESTIONS.filter(q => q.domain !== 3 || q.id === "d3-01");                    // domaine 3 : une seule question
    const { ids } = pickPlacement({ questions: qs });
    assert.equal(ids.length, 10); assert.equal(ids.filter(id => domainOf(id) === 3).length, 1);
  });
  test("banque plus petite que la taille : toutes les questions", () => {
    assert.equal(pickPlacement({ questions: QUESTIONS.slice(0, 4) }).ids.length, 4);
  });
});

describe("niveau, résumé et état du test", () => {
  test("levelOf : seuils 40 % et 70 %", () => {
    assert.equal(levelOf(0).key, "starter"); assert.equal(levelOf(39).key, "starter");
    assert.equal(levelOf(40).key, "building"); assert.equal(levelOf(69).key, "building");
    assert.equal(levelOf(70).key, "solid"); assert.equal(levelOf(100).key, "solid");
    assert.equal(levelOf(70).label, "Solide");
  });
  test("summarizePlacement : résumé par domaine, null si trop court ou absent", () => {
    const r = { total: 10, ok: 6, pct: 60, byDomain: { 1: { ok: 2, total: 2 }, 2: { ok: 0, total: 0 }, 3: { ok: 4, total: 8 } } };
    assert.deepEqual(summarizePlacement(r), { pct: 60, total: 10, byDomain: { 1: { ok: 2, total: 2 }, 3: { ok: 4, total: 8 } } });
    assert.equal(summarizePlacement({ ...r, total: 4 }), null);
    assert.equal(summarizePlacement(null), null); assert.equal(summarizePlacement(undefined), null);
  });
  test("completePlacement : test terminé = done avec résultat ; trop court = started sans résultat", () => {
    const s = summarizePlacement({ total: 10, ok: 6, pct: 60, byDomain: P60.byDomain });
    const done = completePlacement(newOnboarding(), s, 123);
    assert.equal(done.status, "done"); assert.equal(done.at, 123); assert.equal(done.placement.pct, 60); assert.equal(done.placement.at, 123);
    assert.equal(completePlacement(newOnboarding(), null, 5).status, "started");
    assert.equal(completePlacement({ status: "skipped", at: 1, placement: null }, null, 5).status, "skipped", "un choix déjà fait n'est pas écrasé");
  });
  test("refaire le test remplace le résultat précédent", () => {
    const first = completePlacement(newOnboarding(), { pct: 40, total: 10, byDomain: { 1: { ok: 4, total: 10 } } }, 1);
    const second = completePlacement(first, { pct: 80, total: 10, byDomain: { 1: { ok: 8, total: 10 } } }, 2);
    assert.equal(second.placement.pct, 80); assert.equal(second.status, "done");
  });
  test("markOnboarding : change le statut sauf s'il est déjà « done »", () => {
    assert.equal(markOnboarding(newOnboarding(), "skipped", 7).status, "skipped");
    assert.equal(markOnboarding({ status: "started", at: 1, placement: null }, "skipped", 7).status, "skipped");
    const done = { status: "done", at: 1, placement: P60 };
    assert.equal(markOnboarding(done, "skipped", 7), done);
  });
});

describe("buildPlan : plan personnalisé", () => {
  const plan = (over = {}) => buildPlan({ placement: P60, profile: profile(), today: TODAY, bankSize: 64, seen: 10, ...over });
  test("pas de résultat de test : pas de plan", () => { assert.equal(plan({ placement: null }), null); });
  test("niveau estimé", () => {
    assert.equal(plan().level.key, "building"); assert.equal(plan().pct, 60);
    assert.equal(plan({ placement: placement({ 1: { ok: 1, total: 2 }, 2: { ok: 0, total: 2 }, 3: { ok: 0, total: 2 } }) }).level.key, "starter");
  });
  test("domaines prioritaires : les moins réussis d'abord, jamais ceux à 100 %", () => {
    const w = plan().weakest;
    assert.deepEqual(w.map(x => x.d), [3, 5], "0 % (domaine 3), puis 50 % : domaine 5 (poids 20) avant domaine 2 (poids 17,5)");
    assert.equal(w[0].pct, 0); assert.equal(w[1].pct, 50);
    assert.ok(w.every(x => x.pct < 100) && w.length <= 2);
  });
  test("à score égal, le domaine le plus lourd à l'examen passe en premier", () => {
    const pl = placement({ 1: { ok: 0, total: 2 }, 3: { ok: 0, total: 2 }, 4: { ok: 2, total: 2 } });    // poids : D1 17,5 ; D3 25
    assert.deepEqual(plan({ placement: pl }).weakest.map(x => x.d), [3, 1]);
  });
  test("tout est solide : message dédié, pas de bouton d'entraînement ciblé", () => {
    const perfect = placement({ 1: { ok: 2, total: 2 }, 2: { ok: 2, total: 2 }, 3: { ok: 2, total: 2 }, 4: { ok: 2, total: 2 }, 5: { ok: 2, total: 2 } });
    const p = plan({ placement: perfect });
    assert.deepEqual(p.weakest, []);
    const focus = p.steps.find(s => s.key === "focus");
    assert.match(focus.text, /solides/); assert.equal(focus.action, undefined);
  });
  test("étape « domaines prioritaires » : bouton vers le domaine le plus faible", () => {
    const focus = plan().steps.find(s => s.key === "focus");
    assert.deepEqual([focus.action.name, focus.action.d], ["practice-domain", 3]);
    assert.match(focus.text, /« Déploiement »/);
  });
  test("rythme quotidien repris du profil (au moins 1)", () => {
    assert.match(plan({ profile: profile({ daily: 25 }) }).steps[0].text, /25 questions par jour/);
    assert.match(plan({ profile: profile({ daily: 1 }) }).steps[0].text, /1 question par jour/);
    assert.match(plan({ profile: profile({ daily: 0 }) }).steps[0].text, /1 question par jour/);
  });
  test("sans date d'examen : couverture de la banque et examen blanc générique", () => {
    const p = plan();
    assert.equal(p.daysLeft, null); assert.equal(p.firstExamOn, null);
    assert.match(p.steps.find(s => s.key === "coverage").text, /54 questions à découvrir.*6 jours/);
    const exam = p.steps.find(s => s.key === "exam");
    assert.match(exam.text, /70 %/); assert.equal(exam.action, undefined);
  });
  test("examen lointain : premier examen blanc deux semaines avant", () => {
    const p = plan({ profile: profile({ examDate: "2027-01-15" }) });
    assert.equal(p.daysLeft, 64); assert.equal(p.firstExamOn, "2027-01-01");
    assert.match(p.steps.find(s => s.key === "exam").text, /janvier/);
    assert.match(p.steps.find(s => s.key === "coverage").text, /examen est dans 64 jours\.$/);
  });
  test("examen dans moins de deux semaines : examen blanc dès cette semaine, avec bouton", () => {
    const p = plan({ profile: profile({ examDate: "2026-11-20" }) });
    assert.equal(p.daysLeft, 8); assert.equal(p.firstExamOn, null);
    const exam = p.steps.find(s => s.key === "exam");
    assert.match(exam.text, /dès cette semaine/); assert.equal(exam.action.name, "new-exam");
  });
  test("examen exactement dans 14 jours : dès cette semaine ; dans 15 jours : planifié demain", () => {
    assert.equal(plan({ profile: profile({ examDate: "2026-11-26" }) }).firstExamOn, null);
    assert.equal(plan({ profile: profile({ examDate: "2026-11-27" }) }).firstExamOn, "2026-11-13");
  });
  test("rythme trop lent pour tout voir avant l'examen : conseil d'augmenter l'objectif", () => {
    const p = plan({ profile: profile({ examDate: "2026-11-20", daily: 2 }) });          // 54 questions, 2 par jour = 27 jours, examen dans 8
    assert.match(p.steps.find(s => s.key === "coverage").text, /augmenter ton objectif quotidien/);
    const ok = plan({ profile: profile({ examDate: "2027-03-01", daily: 10 }) });
    assert.ok(!/augmenter/.test(ok.steps.find(s => s.key === "coverage").text));
  });
  test("date d'examen passée : traitée comme sans date", () => {
    const p = plan({ profile: profile({ examDate: "2026-10-01" }) });
    assert.equal(p.firstExamOn, null);
    assert.doesNotMatch(p.steps.find(s => s.key === "coverage").text, /examen est dans/);
    assert.match(p.steps.find(s => s.key === "exam").text, /70 %/);
  });
  test("date d'examen invalide ignorée", () => {
    assert.equal(plan({ profile: profile({ examDate: "demain" }) }).daysLeft, null);
  });
  test("toute la banque déjà vue : pas d'étape de couverture", () => {
    assert.ok(!plan({ seen: 64 }).steps.some(s => s.key === "coverage"));
    assert.ok(!plan({ seen: 100 }).steps.some(s => s.key === "coverage"));
  });
  test("pluriels : 1 jour, 1 question", () => {
    const p = plan({ seen: 63, profile: profile({ examDate: "2026-11-13", daily: 10 }) });
    assert.match(p.steps.find(s => s.key === "coverage").text, /1 question à découvrir.*1 jour pour tout voir.*dans 1 jour/);
  });
  test("le plan ne dépend que de ses arguments (même résultat deux fois, entrées non modifiées)", () => {
    const pr = Object.freeze(profile({ examDate: "2027-01-15" })), pl = Object.freeze({ ...P60, byDomain: Object.freeze({ ...P60.byDomain }) });
    assert.deepEqual(buildPlan({ placement: pl, profile: pr, today: TODAY, bankSize: 64, seen: 10 }), buildPlan({ placement: pl, profile: pr, today: TODAY, bankSize: 64, seen: 10 }));
  });
});
