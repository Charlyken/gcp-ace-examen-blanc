import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { XP_RULES, XP_MAX } from "../js/config.js";
import {
  newXp, xpForLevel, levelFor, normalizeXp, awardAnswer, addXp, sessionBonuses,
  newSessionXp, recordAnswerXp, settleSessionXp, xpRulesText
} from "../js/xp.js";

const D0 = "2026-11-10", D1 = "2026-11-11";

describe("niveaux", () => {
  test("seuils : le niveau n commence à 50 × n × (n - 1) XP", () => {
    assert.deepEqual([1, 2, 3, 4, 5, 10].map(xpForLevel), [0, 100, 300, 600, 1000, 4500]);
  });
  test("niveau, progression et XP restant aux frontières", () => {
    assert.deepEqual(levelFor(0), { level: 1, base: 0, next: 100, into: 0, need: 100, pct: 0 });
    assert.deepEqual(levelFor(99), { level: 1, base: 0, next: 100, into: 99, need: 100, pct: 99 });
    assert.deepEqual(levelFor(100), { level: 2, base: 100, next: 300, into: 0, need: 200, pct: 0 });
    assert.deepEqual(levelFor(299), { level: 2, base: 100, next: 300, into: 199, need: 200, pct: 99 });
    assert.equal(levelFor(300).level, 3);
    assert.equal(levelFor(999).level, 4);
    assert.equal(levelFor(1000).level, 5);
    assert.equal(levelFor(4499).level, 9);
    assert.equal(levelFor(4500).level, 10);
  });
  test("cohérence sur toute une plage : base <= total < suivant, progression bornée", () => {
    let prev = 1;
    for (let t = 0; t <= 30000; t += 7) {
      const l = levelFor(t);
      assert.ok(l.base <= t && t < l.next, `total ${t}`);
      assert.equal(l.into, t - l.base); assert.equal(l.need, l.next - l.base);
      assert.ok(l.pct >= 0 && l.pct <= 99, `pct ${l.pct} pour ${t}`);
      assert.ok(l.level >= prev, "le niveau ne baisse jamais"); prev = l.level;
    }
  });
  test("valeurs invalides : niveau 1 ; très grand total sans boucle infinie", () => {
    for (const bad of [-50, NaN, undefined, null, Infinity, "x"]) assert.equal(levelFor(bad).level, 1, String(bad));
    const l = levelFor(XP_MAX);
    assert.ok(l.base <= XP_MAX && XP_MAX < l.next);
  });
  test("chaque frontière de niveau est exacte, jusqu'au plafond d'XP", () => {
    for (let n = 1; xpForLevel(n) <= XP_MAX; n++) {
      assert.equal(levelFor(xpForLevel(n)).level, n, `début du niveau ${n}`);
      if (n > 1) assert.equal(levelFor(xpForLevel(n) - 1).level, n - 1, `fin du niveau ${n - 1}`);
    }
  });
  test("un total décimal est arrondi à l'inférieur", () => {
    assert.equal(levelFor(100.9).level, 2);
    assert.equal(levelFor(99.9).level, 1);
  });
});

describe("awardAnswer : XP d'une réponse", () => {
  test("bonne réponse : +10 XP et la question est notée pour aujourd'hui", () => {
    const r = awardAnswer(newXp(), "q1", true, D0);
    assert.equal(r.gained, XP_RULES.answer);
    assert.deepEqual(r.xp, { total: 10, day: D0, ids: ["q1"] });
  });
  test("mauvaise réponse : rien, et la question n'est pas notée (on peut la réussir ensuite)", () => {
    const r = awardAnswer(newXp(), "q1", false, D0);
    assert.equal(r.gained, 0); assert.deepEqual(r.xp.ids, []); assert.equal(r.xp.total, 0);
    assert.equal(awardAnswer(r.xp, "q1", true, D0).gained, 10, "erreur puis réussite le même jour : XP");
  });
  test("la même question ne rapporte qu'une fois par jour", () => {
    let xp = newXp(), total = 0;
    for (let i = 0; i < 20; i++) { const r = awardAnswer(xp, "q1", true, D0); xp = r.xp; total += r.gained; }
    assert.equal(total, 10); assert.equal(xp.total, 10);
  });
  test("le lendemain, la question rapporte à nouveau", () => {
    let r = awardAnswer(newXp(), "q1", true, D0);
    r = awardAnswer(r.xp, "q1", true, D1);
    assert.equal(r.gained, 10); assert.equal(r.xp.total, 20);
    assert.deepEqual(r.xp.ids, ["q1"], "la liste est repartie de zéro pour le nouveau jour");
    assert.equal(r.xp.day, D1);
  });
  test("des questions différentes cumulent", () => {
    let xp = newXp(); for (const id of ["a", "b", "c"]) xp = awardAnswer(xp, id, true, D0).xp;
    assert.equal(xp.total, 30);
  });
  test("ne modifie pas l'état reçu", () => {
    const xp = Object.freeze({ total: 10, day: D0, ids: Object.freeze(["a"]) });
    assert.doesNotThrow(() => { awardAnswer(xp, "b", true, D0); awardAnswer(xp, "a", true, D0); awardAnswer(xp, "b", true, D1); });
    assert.deepEqual(xp, { total: 10, day: D0, ids: ["a"] });
  });
  test("le total est borné", () => {
    assert.equal(awardAnswer({ total: XP_MAX - 3, day: D0, ids: [] }, "q", true, D0).xp.total, XP_MAX);
  });
});

describe("addXp et normalizeXp", () => {
  test("addXp ajoute un bonus sans toucher au suivi des questions", () => {
    assert.deepEqual(addXp({ total: 10, day: D0, ids: ["a"] }, 20), { total: 30, day: D0, ids: ["a"] });
  });
  test("addXp ignore les montants invalides ou négatifs et borne le total", () => {
    for (const bad of [-5, NaN, undefined, "x"]) assert.equal(addXp({ total: 10, day: "", ids: [] }, bad).total, 10, String(bad));
    assert.equal(addXp({ total: XP_MAX, day: "", ids: [] }, 50).total, XP_MAX);
  });
  test("normalizeXp : entrée inutilisable = état vide", () => {
    for (const bad of [null, undefined, 5, "x"]) assert.deepEqual(normalizeXp(bad, D0), newXp());
  });
  test("normalizeXp : total entier borné, jamais négatif", () => {
    assert.equal(normalizeXp({ total: 120.7 }, D0).total, 120);
    assert.equal(normalizeXp({ total: -9 }, D0).total, 0);
    assert.equal(normalizeXp({ total: 1e99 }, D0).total, XP_MAX);
    assert.equal(normalizeXp({ total: "50" }, D0).total, 0);
  });
  test("normalizeXp : les questions récompensées ne valent que pour le jour courant", () => {
    assert.deepEqual(normalizeXp({ total: 30, day: D0, ids: ["a", "b"] }, D0), { total: 30, day: D0, ids: ["a", "b"] });
    assert.deepEqual(normalizeXp({ total: 30, day: D0, ids: ["a", "b"] }, D1), { total: 30, day: "", ids: [] }, "jour passé : repart de zéro");
    assert.deepEqual(normalizeXp({ total: 30, day: "pas une date", ids: ["a"] }, D0), { total: 30, day: "", ids: [] });
  });
  test("normalizeXp : identifiants dédoublonnés, textes non vides uniquement", () => {
    assert.deepEqual(normalizeXp({ total: 0, day: D0, ids: ["a", "a", 3, "", null, "b"] }, D0).ids, ["a", "b"]);
    assert.deepEqual(normalizeXp({ total: 0, day: D0, ids: "a" }, D0).ids, []);
  });
  test("normalizeXp : est idempotent", () => {
    const once = normalizeXp({ total: 77, day: D0, ids: ["a", "b"] }, D0);
    assert.deepEqual(normalizeXp(once, D0), once);
  });
});

describe("sessionBonuses", () => {
  const base = { mode: "practice", kind: null, total: 10, validated: 10, correct: 10, earned: 10 };
  test("leçon parfaite : 5 questions ou plus, toutes justes, toutes récompensées", () => {
    assert.deepEqual(sessionBonuses(base), [{ key: "perfect", label: "Leçon parfaite", xp: 20 }]);
    assert.equal(sessionBonuses({ ...base, total: 5, validated: 5, correct: 5, earned: 5 }).length, 1, "exactement 5 : suffisant");
  });
  test("pas de leçon parfaite : trop courte, une erreur, ou questions déjà récompensées", () => {
    assert.deepEqual(sessionBonuses({ ...base, total: 4, validated: 4, correct: 4, earned: 4 }), []);
    assert.deepEqual(sessionBonuses({ ...base, correct: 9 }), []);
    assert.deepEqual(sessionBonuses({ ...base, earned: 4 }), [], "anti-boucle : moins de 5 questions ont rapporté de l'XP");
    assert.deepEqual(sessionBonuses({ ...base, earned: 0 }), []);
  });
  test("session interrompue : seules les questions validées comptent pour la leçon parfaite", () => {
    assert.equal(sessionBonuses({ ...base, total: 20, validated: 6, correct: 6, earned: 6 })[0].key, "perfect");
  });
  test("révision terminée : toutes les questions de la série validées", () => {
    const review = { mode: "practice", kind: "review", total: 3, validated: 3, correct: 1, earned: 1 };
    assert.deepEqual(sessionBonuses(review), [{ key: "review", label: "Révision terminée", xp: 15 }]);
    assert.deepEqual(sessionBonuses({ ...review, validated: 2 }), [], "série inachevée");
    assert.deepEqual(sessionBonuses({ ...review, kind: null }), [], "seulement pour la révision du jour");
    assert.deepEqual(sessionBonuses({ ...review, total: 0, validated: 0 }), []);
  });
  test("révision parfaite de 5 questions ou plus : les deux bonus", () => {
    const r = sessionBonuses({ mode: "practice", kind: "review", total: 6, validated: 6, correct: 6, earned: 6 });
    assert.deepEqual(r.map(b => b.key), ["review", "perfect"]);
    assert.equal(r.reduce((n, b) => n + b.xp, 0), 35);
  });
  test("examen blanc : aucun bonus", () => {
    assert.deepEqual(sessionBonuses({ ...base, mode: "exam", total: 50, validated: 50, correct: 50, earned: 50 }), []);
  });
});

describe("suivi d'XP d'une session", () => {
  test("recordAnswerXp cumule sans modifier l'original", () => {
    const s0 = Object.freeze(newSessionXp(40));
    const s1 = recordAnswerXp(s0, "a", 10), s2 = recordAnswerXp(s1, "b", 0);
    assert.deepEqual(s0, newSessionXp(40));
    assert.equal(s2.answers, 10); assert.equal(s2.earned, 1);
    assert.deepEqual(s2.gain, { a: 10, b: 0 });
    assert.equal(s2.start, 40);
  });
});

describe("settleSessionXp : fin de session", () => {
  const items = (n, wrong = 0) => Array.from({ length: n }, (_, i) => ({ id: `q${i}`, status: i < wrong ? "ko" : "ok" }));
  const results = (its, total = its.length) => ({ items: its, total, ok: its.filter(i => i.status === "ok").length });

  test("examen : XP des bonnes réponses seulement, sans bonus", () => {
    const session = { mode: "exam", kind: null, ids: items(50).map(i => i.id), xp: newSessionXp(0) };
    const its = [...items(8, 3), { id: "vide", status: "empty" }];
    const { xp, summary } = settleSessionXp(newXp(), session, results(its), D0);
    assert.equal(xp.total, 50, "5 bonnes réponses");
    assert.equal(summary.answers, 50); assert.equal(summary.earned, 5); assert.deepEqual(summary.bonuses, []);
    assert.equal(summary.total, 50); assert.equal(summary.end, 50);
  });
  test("examen : les questions déjà récompensées aujourd'hui ne rapportent plus", () => {
    const already = { total: 20, day: D0, ids: ["q0", "q1"] };
    const session = { mode: "exam", ids: ["q0", "q1", "q2"], xp: newSessionXp(20) };
    const { xp, summary } = settleSessionXp(already, session, results(items(3)), D0);
    assert.equal(xp.total, 30); assert.equal(summary.earned, 1); assert.equal(summary.total, 10);
  });
  test("entraînement : leçon parfaite ajoutée aux XP déjà gagnés réponse par réponse", () => {
    let sx = newSessionXp(0), xpState = newXp();
    for (let i = 0; i < 6; i++) { const r = awardAnswer(xpState, `q${i}`, true, D0); xpState = r.xp; sx = recordAnswerXp(sx, `q${i}`, r.gained); }
    const session = { mode: "practice", kind: null, ids: items(6).map(i => i.id), xp: sx };
    const { xp, summary } = settleSessionXp(xpState, session, results(items(6)), D0);
    assert.equal(summary.answers, 60); assert.deepEqual(summary.bonuses.map(b => b.key), ["perfect"]);
    assert.equal(summary.total, 80); assert.equal(xp.total, 80); assert.equal(summary.end, 80);
  });
  test("révision du jour terminée : bonus même avec des erreurs", () => {
    let sx = newSessionXp(0), xpState = newXp();
    for (const [id, ok] of [["a", true], ["b", false], ["c", true]]) { const r = awardAnswer(xpState, id, ok, D0); xpState = r.xp; sx = recordAnswerXp(sx, id, r.gained); }
    const session = { mode: "practice", kind: "review", ids: ["a", "b", "c"], xp: sx };
    const { xp, summary } = settleSessionXp(xpState, session, results([{ id: "a", status: "ok" }, { id: "b", status: "ko" }, { id: "c", status: "ok" }]), D0);
    assert.deepEqual(summary.bonuses.map(b => b.key), ["review"]);
    assert.equal(xp.total, 20 + 15);
  });
  test("session sans suivi d'XP (sauvegardée avant la fonctionnalité) : aucun bonus, aucune erreur", () => {
    const session = { mode: "practice", kind: null, ids: items(6).map(i => i.id) };
    const { xp, summary } = settleSessionXp({ total: 40, day: "", ids: [] }, session, results(items(6)), D0);
    assert.deepEqual(summary.bonuses, []); assert.equal(xp.total, 40); assert.equal(summary.start, 40);
  });
  test("ne modifie ni l'état d'XP ni la session reçus", () => {
    const xp0 = Object.freeze({ total: 0, day: "", ids: Object.freeze([]) });
    const session = Object.freeze({ mode: "exam", ids: ["q0"], xp: Object.freeze(newSessionXp(0)) });
    assert.doesNotThrow(() => settleSessionXp(xp0, session, results(items(1)), D0));
  });
});

describe("anti-triche : rejouer les mêmes questions en boucle", () => {
  // Une leçon de 5 questions toutes justes, jouée plusieurs fois le même jour.
  function playLesson(xpState, ids, day) {
    let sx = newSessionXp(xpState.total);
    for (const id of ids) { const r = awardAnswer(xpState, id, true, day); xpState = r.xp; sx = recordAnswerXp(sx, id, r.gained); }
    const session = { mode: "practice", kind: null, ids, xp: sx };
    const res = { items: ids.map(id => ({ id, status: "ok" })), total: ids.length, ok: ids.length };
    const out = settleSessionXp(xpState, session, res, day);
    return { xp: out.xp, gained: out.summary.total };
  }
  const ids = ["a", "b", "c", "d", "e"];

  test("première leçon : 5 × 10 + 20 de bonus ; les suivantes le même jour : rien", () => {
    let xp = newXp(); const gains = [];
    for (let i = 0; i < 10; i++) { const r = playLesson(xp, ids, D0); xp = r.xp; gains.push(r.gained); }
    assert.deepEqual(gains, [70, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    assert.equal(xp.total, 70);
  });
  test("le lendemain, les mêmes questions rapportent à nouveau (une fois)", () => {
    let xp = playLesson(newXp(), ids, D0).xp;
    const day2 = playLesson(xp, ids, D1);
    assert.equal(day2.gained, 70); xp = day2.xp;
    assert.equal(playLesson(xp, ids, D1).gained, 0);
    assert.equal(xp.total, 140);
  });
  test("une leçon qui mélange nouvelles questions et questions déjà récompensées : bonus seulement si au moins 5 nouvelles", () => {
    let xp = playLesson(newXp(), ["a", "b", "c", "d", "e"], D0).xp;
    const mixed = playLesson(xp, ["a", "b", "c", "x", "y"], D0);            // 2 nouvelles seulement
    assert.equal(mixed.gained, 20, "2 × 10, pas de bonus");
    const fresh = playLesson(mixed.xp, ["a", "b", "f", "g", "h", "i", "j"], D0);   // 5 nouvelles
    assert.equal(fresh.gained, 50 + 20);
  });
});

describe("xpRulesText", () => {
  test("liste le barème à partir des constantes", () => {
    const t = xpRulesText().join("\n");
    assert.match(t, new RegExp(`\\+${XP_RULES.answer} XP par bonne réponse`));
    assert.match(t, new RegExp(`\\+${XP_RULES.perfect} XP pour une leçon parfaite`));
    assert.match(t, new RegExp(`\\+${XP_RULES.review} XP`));
    assert.match(t, /une fois par question et par jour/);
    assert.equal(xpRulesText().length, 4);
  });
});
