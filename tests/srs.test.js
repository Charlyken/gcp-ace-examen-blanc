import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SRS } from "../js/config.js";
import { reviewCard, isDue, hasSchedule, normalizeCard, normalizeStats, needsMigration, dueIds, pickReview, nextReview, reviewPlan } from "../js/srs.js";
import { addDays } from "../js/utils.js";

const D0 = "2026-11-10";
const card = (over = {}) => ({ n: 3, ok: true, ease: 2.5, interval: 6, reps: 2, due: "2026-11-20", last: "2026-11-14", hist: [1, 0, 1], ...over });

describe("reviewCard : réussites", () => {
  test("nouvelle question réussie : revue demain, première étape", () => {
    assert.deepEqual(reviewCard(undefined, true, D0), { n: 1, ok: true, ease: 2.5, interval: 1, reps: 1, due: "2026-11-11", last: D0, hist: [1] });
  });
  test("réussites consécutives à l'échéance : 1, 6, 15, 38, 95 puis plafond", () => {
    let c = undefined, day = D0;
    const intervals = [];
    for (let i = 0; i < 6; i++) { c = reviewCard(c, true, day); intervals.push(c.interval); day = c.due; }
    assert.deepEqual(intervals, [1, SRS.secondInterval, 15, 38, 95, SRS.maxIntervalDays]);
    assert.equal(c.reps, 6);
    assert.equal(c.ease, 2.5, "la facilité ne bouge pas tant qu'on réussit");
  });
  test("le plafond d'intervalle est respecté", () => {
    const c = reviewCard(card({ interval: 170, reps: 5, due: D0 }), true, D0);
    assert.equal(c.interval, SRS.maxIntervalDays);
    assert.equal(c.due, addDays(D0, SRS.maxIntervalDays));
  });
  test("réussite en retard : l'intervalle part de l'intervalle prévu, pas du retard", () => {
    const c = reviewCard(card({ interval: 6, reps: 2, due: "2026-10-31" }), true, D0);   // 10 jours de retard
    assert.equal(c.interval, 15);
    assert.equal(c.due, addDays(D0, 15));
  });
  test("réussite avant l'échéance : compte dans n/ok/hist mais le planning ne bouge pas", () => {
    const before = card({ due: "2026-11-20", ok: false });
    const c = reviewCard(before, true, D0);
    assert.equal(c.n, 4); assert.equal(c.ok, true); assert.equal(c.last, D0);
    assert.deepEqual(c.hist, [1, 0, 1, 1]);
    for (const k of ["ease", "interval", "reps", "due"]) assert.equal(c[k], before[k], k);
  });
});

describe("reviewCard : erreurs", () => {
  test("nouvelle question ratée : revue demain, facilité réduite", () => {
    const c = reviewCard(undefined, false, D0);
    assert.deepEqual(c, { n: 1, ok: false, ease: 2.18, interval: 1, reps: 0, due: "2026-11-11", last: D0, hist: [0] });
  });
  test("une erreur remet la série à zéro et ramène l'intervalle à 1 jour", () => {
    const c = reviewCard(card({ interval: 38, reps: 4, due: D0 }), false, D0);
    assert.equal(c.reps, 0); assert.equal(c.interval, 1); assert.equal(c.due, "2026-11-11"); assert.equal(c.ok, false);
    assert.equal(c.ease, 2.18);
  });
  test("la facilité ne descend jamais sous le plancher", () => {
    let c = card({ ease: 1.4, due: D0 });
    c = reviewCard(c, false, D0); assert.equal(c.ease, SRS.minEase);
    c = reviewCard(c, false, "2026-11-12"); assert.equal(c.ease, SRS.minEase);
  });
  test("deux erreurs le même jour ne pénalisent la facilité qu'une fois", () => {
    const a = reviewCard(card({ due: D0 }), false, D0);
    const b = reviewCard(a, false, D0);
    assert.equal(a.ease, 2.18); assert.equal(b.ease, 2.18);
    assert.equal(b.n, a.n + 1);
  });
  test("une erreur un autre jour pénalise à nouveau", () => {
    const a = reviewCard(card({ due: D0 }), false, D0);
    assert.equal(reviewCard(a, false, "2026-11-11").ease, 1.86);
  });
  test("erreur puis réussite le jour même (revue des erreurs) : le planning de demain est conservé", () => {
    const failed = reviewCard(card({ due: D0 }), false, D0);
    const fixed = reviewCard(failed, true, D0);
    assert.equal(fixed.due, "2026-11-11"); assert.equal(fixed.reps, 0); assert.equal(fixed.ok, true);
  });
  test("après une erreur, la progression repart de 1 puis 6 jours", () => {
    let c = reviewCard(card({ interval: 95, reps: 5, due: D0 }), false, D0);
    c = reviewCard(c, true, c.due); assert.equal(c.interval, 1);
    c = reviewCard(c, true, c.due); assert.equal(c.interval, 6);
    assert.ok(c.ease < 2.5, "la facilité reste réduite : les intervalles suivants seront plus courts");
    c = reviewCard(c, true, c.due); assert.equal(c.interval, Math.round(6 * 2.18));
  });
});

describe("reviewCard : propriétés générales", () => {
  test("ne modifie jamais la carte reçue", () => {
    const prev = Object.freeze({ ...card({ due: D0 }), hist: Object.freeze([1, 0, 1]) });
    assert.doesNotThrow(() => { reviewCard(prev, true, D0); reviewCard(prev, false, D0); });
    assert.deepEqual(prev.hist, [1, 0, 1]);
  });
  test("l'historique est limité aux derniers résultats", () => {
    let c = undefined;
    for (let i = 0; i < SRS.historyMax + 5; i++) c = reviewCard(c, i % 2 === 0, `2026-11-${String(10 + i).padStart(2, "0")}`);
    assert.equal(c.hist.length, SRS.historyMax);
    assert.equal(c.n, SRS.historyMax + 5);
  });
  test("tolère une carte sans historique", () => {
    const { hist, ...noHist } = card({ due: D0 });
    assert.deepEqual(reviewCard(noHist, true, D0).hist, [1]);
  });
  test("l'échéance traverse correctement un changement de mois et d'année", () => {
    assert.equal(reviewCard(undefined, true, "2026-12-31").due, "2027-01-01");
    assert.equal(reviewCard(card({ interval: 6, reps: 2, due: "2026-12-20" }), true, "2026-12-20").due, "2027-01-04");   // 20 déc. + 15 jours
  });
});

describe("isDue et hasSchedule", () => {
  test("isDue : échéance atteinte ou dépassée, jamais pour une question jamais vue", () => {
    assert.equal(isDue(card({ due: "2026-11-09" }), D0), true);
    assert.equal(isDue(card({ due: D0 }), D0), true);
    assert.equal(isDue(card({ due: "2026-11-11" }), D0), false);
    assert.equal(isDue(undefined, D0), false);
    assert.equal(isDue(null, D0), false);
  });
  test("hasSchedule distingue une carte complète d'une ancienne entrée { n, ok }", () => {
    assert.equal(hasSchedule(card()), true);
    assert.equal(hasSchedule({ n: 2, ok: true }), false);
    assert.equal(hasSchedule(card({ due: "2026-02-31" })), false, "date inexistante");
    assert.equal(hasSchedule(card({ ease: "x" })), false);
    assert.equal(hasSchedule(null), false);
  });
});

describe("normalizeCard : migration et nettoyage", () => {
  test("ancienne entrée juste : une réussite acquise, à revoir demain", () => {
    assert.deepEqual(normalizeCard({ n: 4, ok: true }, D0), { n: 4, ok: true, ease: 2.5, interval: 1, reps: 1, due: "2026-11-11", last: "", hist: [1] });
  });
  test("ancienne entrée fausse : à revoir aujourd'hui", () => {
    assert.deepEqual(normalizeCard({ n: 2, ok: false }, D0), { n: 2, ok: false, ease: 2.5, interval: 1, reps: 0, due: D0, last: "", hist: [0] });
  });
  test("la migration ne perd ni n ni ok", () => {
    for (const [n, ok] of [[1, true], [7, false], [0, true]]) {
      const c = normalizeCard({ n, ok }, D0);
      assert.equal(c.n, n); assert.equal(c.ok, ok);
    }
  });
  test("une carte valide est conservée telle quelle", () => {
    const c = card();
    assert.deepEqual(normalizeCard(c, D0), c);
  });
  test("entrées inutilisables : null", () => {
    for (const bad of [null, undefined, 5, "x", [], {}, { ok: true }, { n: "3", ok: true }, { n: NaN }, { n: Infinity }]) assert.equal(normalizeCard(bad, D0), null, JSON.stringify(bad));
  });
  test("bornes : facilité, intervalle, répétitions, historique, dernière date", () => {
    const c = normalizeCard(card({ ease: 99, interval: 9999, reps: -4, hist: [1, 2, "a", 0, 1], last: "n'importe quoi" }), D0);
    assert.equal(c.ease, SRS.maxEase); assert.equal(c.interval, SRS.maxIntervalDays); assert.equal(c.reps, 0);
    assert.deepEqual(c.hist, [1, 0, 1]); assert.equal(c.last, "");
    assert.equal(normalizeCard(card({ ease: 0.2, interval: 0 }), D0).ease, SRS.minEase);
    assert.equal(normalizeCard(card({ interval: 0 }), D0).interval, 1);
  });
  test("échéance invalide : traitée comme une ancienne entrée", () => {
    const c = normalizeCard(card({ due: "demain" }), D0);
    assert.equal(c.due, "2026-11-11"); assert.equal(c.reps, 1);
  });
});

describe("normalizeStats et needsMigration", () => {
  test("normalise toutes les entrées, écarte les invalides et les questions inconnues", () => {
    const raw = { a: { n: 1, ok: true }, b: card(), c: { n: "x" }, d: null, retiree: { n: 3, ok: false } };
    const out = normalizeStats(raw, D0, id => id !== "retiree");
    assert.deepEqual(Object.keys(out).sort(), ["a", "b"]);
    assert.equal(out.a.due, "2026-11-11");
  });
  test("sans filtre d'identifiants, garde toutes les questions valides", () => {
    assert.deepEqual(Object.keys(normalizeStats({ x: { n: 1, ok: true } }, D0)), ["x"]);
  });
  test("entrée non objet : objet vide", () => {
    for (const bad of [null, undefined, 3, "x"]) assert.deepEqual(normalizeStats(bad, D0), {});
  });
  test("est idempotent : normaliser deux fois ne change rien (la date de migration reste fixe)", () => {
    const once = normalizeStats({ a: { n: 1, ok: true }, b: { n: 2, ok: false } }, D0);
    assert.deepEqual(normalizeStats(once, "2027-05-05"), once);
  });
  test("needsMigration : vrai tant qu'une entrée est à l'ancien format", () => {
    assert.equal(needsMigration({ a: { n: 1, ok: true } }), true);
    assert.equal(needsMigration({ a: card(), b: { n: 1, ok: false } }), true);
    assert.equal(needsMigration({ a: card() }), false);
    assert.equal(needsMigration({}), false);
    assert.equal(needsMigration(null), false);
    assert.equal(needsMigration(normalizeStats({ a: { n: 1, ok: true } }, D0)), false);
  });
});

describe("dueIds : questions à réviser", () => {
  const stats = {
    futur:   card({ due: "2026-11-11" }),
    aujourd: card({ due: D0 }),
    retard3: card({ due: "2026-11-07" }),
    retard9: card({ due: "2026-11-01" }),
    retired: card({ due: "2026-10-01" })
  };
  test("ne garde que les échéances atteintes, les plus en retard d'abord", () => {
    assert.deepEqual(dueIds(stats, D0, id => id !== "retired"), ["retard9", "retard3", "aujourd"]);
  });
  test("écarte les questions retirées de la banque quand un filtre est fourni", () => {
    assert.ok(dueIds(stats, D0).includes("retired"));
    assert.ok(!dueIds(stats, D0, id => id !== "retired").includes("retired"));
  });
  test("à retard égal : facilité basse (plus difficile) d'abord, puis ordre des identifiants", () => {
    const s = { b: card({ due: D0, ease: 2.5 }), a: card({ due: D0, ease: 2.5 }), dur: card({ due: D0, ease: 1.4 }) };
    assert.deepEqual(dueIds(s, D0), ["dur", "a", "b"]);
  });
  test("renvoie une liste vide sans données, sans carte échue ou avec une entrée absente", () => {
    assert.deepEqual(dueIds({}, D0), []);
    assert.deepEqual(dueIds(null, D0), []);
    assert.deepEqual(dueIds({ x: card({ due: "2026-12-01" }) }, D0), []);
    assert.deepEqual(dueIds({ x: null }, D0), []);
  });
  test("une question tout juste ratée (revue demain) n'est pas à réviser aujourd'hui", () => {
    assert.deepEqual(dueIds({ x: reviewCard(undefined, false, D0) }, D0), []);
    assert.deepEqual(dueIds({ x: reviewCard(undefined, false, D0) }, "2026-11-11"), ["x"]);
  });
  test("après une réussite à l'échéance, la question sort de la liste du jour", () => {
    const s = { x: card({ due: D0 }) };
    assert.deepEqual(dueIds(s, D0), ["x"]);
    assert.deepEqual(dueIds({ x: reviewCard(s.x, true, D0) }, D0), []);
  });
});

describe("pickReview : série de révision plafonnée", () => {
  const s = { a: card({ due: "2026-11-01" }), b: card({ due: "2026-11-05" }), c: card({ due: "2026-11-08" }), d: card({ due: D0 }) };
  test("prend les plus prioritaires jusqu'à la limite", () => {
    assert.deepEqual(pickReview(s, D0, 2), ["a", "b"]);
    assert.deepEqual(pickReview(s, D0, 3), ["a", "b", "c"]);
  });
  test("limite supérieure au nombre de questions : toutes", () => {
    assert.equal(pickReview(s, D0, 100).length, 4);
  });
  test("limite nulle ou négative : aucune question", () => {
    assert.deepEqual(pickReview(s, D0, 0), []);
    assert.deepEqual(pickReview(s, D0, -3), []);
  });
});

describe("nextReview : prochaine échéance", () => {
  test("date la plus proche après aujourd'hui, nombre de questions ce jour-là et délai", () => {
    const s = { a: card({ due: "2026-11-14" }), b: card({ due: "2026-11-12" }), c: card({ due: "2026-11-12" }), d: card({ due: "2027-01-01" }), due: card({ due: D0 }), late: card({ due: "2026-11-01" }) };
    assert.deepEqual(nextReview(s, D0), { date: "2026-11-12", days: 2, count: 2 });
  });
  test("demain : days vaut 1", () => {
    assert.deepEqual(nextReview({ a: card({ due: "2026-11-11" }) }, D0), { date: "2026-11-11", days: 1, count: 1 });
  });
  test("ignore les échéances atteintes et les questions retirées ; null s'il n'y a rien de prévu", () => {
    assert.equal(nextReview({ a: card({ due: D0 }), b: card({ due: "2026-10-01" }) }, D0), null);
    assert.equal(nextReview({ a: card({ due: "2026-11-20" }) }, D0, () => false), null);
    assert.equal(nextReview({}, D0), null);
    assert.equal(nextReview(undefined, D0), null);
  });
  test("traverse un changement de mois et d'année", () => {
    assert.deepEqual(nextReview({ a: card({ due: "2027-01-03" }) }, "2026-12-30"), { date: "2027-01-03", days: 4, count: 1 });
  });
});

describe("reviewPlan : résumé accueil et tableau de bord", () => {
  const s = { a: card({ due: "2026-11-01" }), b: card({ due: "2026-11-05" }), c: card({ due: D0 }), d: card({ due: "2026-11-13" }) };
  test("nombre à réviser, taille de la série plafonnée par l'objectif quotidien, prochaine échéance", () => {
    assert.deepEqual(reviewPlan(s, D0, 2), { due: 3, batch: 2, next: { date: "2026-11-13", days: 3, count: 1 } });
    assert.deepEqual(reviewPlan(s, D0, 10), { due: 3, batch: 3, next: { date: "2026-11-13", days: 3, count: 1 } });
  });
  test("rien à réviser : série vide", () => {
    assert.deepEqual(reviewPlan({ a: card({ due: "2026-11-20" }) }, D0, 10), { due: 0, batch: 0, next: { date: "2026-11-20", days: 10, count: 1 } });
    assert.deepEqual(reviewPlan({}, D0, 10), { due: 0, batch: 0, next: null });
  });
  test("un objectif quotidien invalide (0) donne quand même au moins une question", () => {
    assert.equal(reviewPlan(s, D0, 0).batch, 1);
  });
});
