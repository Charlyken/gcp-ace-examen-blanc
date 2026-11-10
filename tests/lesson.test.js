import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { LESSON } from "../js/config.js";
import { QUESTIONS } from "../js/data.js";
import { pickLesson } from "../js/lesson.js";
import { reviewCard } from "../js/srs.js";
import { seedRandom } from "./helpers.js";

const TODAY = "2026-11-10";
const Q = QUESTIONS;                                            // 64 questions, 5 domaines
// Carte de révision sur mesure : `due` en jours par rapport à aujourd'hui, `ok` dernier résultat, `last` dernière réponse.
const day = d => { const x = new Date(2026, 10, 10 + d, 12); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
const card = (over = {}) => ({ n: 2, ok: true, ease: 2.5, interval: 6, reps: 2, due: day(5), last: day(-3), hist: [1, 1], ...over });
const ids = (from, to) => Q.slice(from, to).map(q => q.id);
const kindOf = (stats, id) => !stats[id] ? "new" : stats[id].due <= TODAY ? "due" : stats[id].ok === false ? "weak" : "known";

function lesson(stats, extra = {}) { return pickLesson({ questions: Q, stats, today: TODAY, ...extra }); }
const count = (res, stats, k) => res.ids.filter(id => kindOf(stats, id) === k).length;

describe("pickLesson : composition", () => {
  test("une leçon fait la taille prévue, sans doublon, avec des questions de la banque", t => {
    seedRandom(t, 3);
    const r = lesson({});
    assert.equal(r.ids.length, LESSON.size);
    assert.equal(new Set(r.ids).size, r.ids.length);
    assert.ok(r.ids.every(id => Q.some(q => q.id === id)));
  });
  test("mélange 40 % à réviser, 30 % à consolider, le reste de nouvelles", t => {
    seedRandom(t, 4);
    const stats = {};
    ids(0, 10).forEach(id => stats[id] = card({ due: day(-2) }));                       // 10 à réviser
    ids(10, 20).forEach(id => stats[id] = card({ ok: false, due: day(3), last: day(-1) }));   // 10 à consolider (revue demain+)
    const r = lesson(stats);                                                           // reste : 44 nouvelles
    assert.equal(count(r, stats, "due"), 4);
    assert.equal(count(r, stats, "weak"), 3);
    assert.equal(count(r, stats, "new"), 3);
    assert.deepEqual(r.mix, { due: 4, weak: 3, new: 3, known: 0, today: 0 });
  });
  test("à réviser : les plus en retard d'abord", t => {
    seedRandom(t, 5);
    const stats = {};
    ids(0, 8).forEach((id, i) => stats[id] = card({ due: day(-(i + 1)) }));              // d1-01 en retard de 1 jour... d1-08 de 8 jours
    const r = lesson(stats);
    const dueIdsPicked = r.ids.filter(id => kindOf(stats, id) === "due").sort();
    assert.deepEqual(dueIdsPicked, ids(4, 8).sort(), "les 4 plus en retard");
  });
  test("à consolider : les plus difficiles (facilité basse) d'abord", t => {
    seedRandom(t, 6);
    const stats = {};
    ids(0, 6).forEach((id, i) => stats[id] = card({ ok: false, due: day(2), ease: 1.3 + i * 0.2 }));
    const r = lesson(stats);
    const weakPicked = r.ids.filter(id => kindOf(stats, id) === "weak").sort();
    assert.deepEqual(weakPicked, ids(0, 3).sort(), "les 3 de facilité la plus basse");
  });
  test("une question à la fois en retard et ratée compte d'abord comme à réviser, puis déborde dans « à consolider »", t => {
    seedRandom(t, 20);
    const stats = {};
    // 8 questions ratées dont l'échéance est dépassée ; la plus en retard est la plus facile (facilité haute)
    ids(0, 8).forEach((id, i) => stats[id] = card({ ok: false, due: day(-(8 - i)), ease: 1.3 + i * 0.1 }));   // d1-01 en retard de 8 jours, facilité 1.3
    const r = lesson(stats);
    const picked = new Set(r.ids);
    assert.deepEqual(r.mix, { due: 4, weak: 3, new: 3, known: 0, today: 0 });
    for (const id of ids(0, 4)) assert.ok(picked.has(id), `${id} : parmi les 4 plus en retard`);
    for (const id of ids(4, 7)) assert.ok(picked.has(id), `${id} : parmi les 3 plus difficiles du reste`);
    assert.ok(!picked.has(Q[7].id), "la 8e ratée n'est pas prise");
  });
  test("l'ordre final est mélangé : la première question ne vient pas toujours de la même catégorie", t => {
    const stats = {}; ids(0, 10).forEach(id => stats[id] = card({ due: day(-1) }));
    const firstKinds = new Set();
    for (let seed = 1; seed <= 30; seed++) { t.mock.restoreAll(); seedRandom(t, seed); firstKinds.add(kindOf(stats, lesson(stats).ids[0])); }
    assert.ok(firstKinds.size >= 2, [...firstKinds].join());
  });
  test("à consolider : à facilité égale, les questions les plus essayées d'abord, puis l'ordre des identifiants", t => {
    seedRandom(t, 21);
    const stats = {};
    ids(0, 6).forEach((id, i) => stats[id] = card({ ok: false, due: day(2), ease: 2, n: i === 5 ? 9 : 2 }));   // d1-06 : 9 essais, les autres 2
    const r = lesson(stats);
    const weakPicked = r.ids.filter(id => kindOf(stats, id) === "weak").sort();
    assert.deepEqual(weakPicked, [Q[0].id, Q[1].id, Q[5].id].sort(), "d1-06 (9 essais) puis d1-01 et d1-02 (ordre des ids)");
  });
  test("les nouvelles questions sont entrelacées par domaine", t => {
    seedRandom(t, 7);
    const r = lesson({});
    const domains = new Set(r.ids.map(id => Q.find(q => q.id === id).domain));
    assert.equal(domains.size, 5, "les 5 domaines représentés dans une leçon de 10 nouvelles");
    const perDomain = Object.values(r.ids.reduce((m, id) => { const d = Q.find(q => q.id === id).domain; m[d] = (m[d] || 0) + 1; return m; }, {}));
    assert.ok(Math.max(...perDomain) <= 2, "au plus 2 par domaine");
  });
  test("l'ordre final est mélangé, la composition reste reproductible avec le même tirage", t => {
    const stats = {}; ids(0, 10).forEach(id => stats[id] = card({ due: day(-1) }));
    seedRandom(t, 9); const a = lesson(stats).ids;
    t.mock.restoreAll(); seedRandom(t, 9); const b = lesson(stats).ids;
    t.mock.restoreAll(); seedRandom(t, 10); const c = lesson(stats).ids;
    assert.deepEqual(a, b); assert.notDeepEqual(a, c);
  });
});

describe("pickLesson : compléments quand une catégorie manque", () => {
  test("rien à réviser ni à consolider : on complète avec des nouvelles", t => {
    seedRandom(t, 11);
    const stats = {}; ids(0, 10).forEach(id => stats[id] = card());                    // toutes maîtrisées, échéance lointaine
    const r = lesson(stats);
    assert.equal(r.mix.new, 10); assert.equal(r.mix.known, 0);
  });
  test("tout est déjà vu : on complète avec ce qui est à réviser, à consolider, puis maîtrisé (échéance la plus proche)", t => {
    seedRandom(t, 12);
    const stats = {};
    Q.forEach((q, i) => stats[q.id] = card({ due: day(1 + i) }));                       // jamais dues, échéances 1, 2, 3… jours
    const r = lesson(stats);
    assert.equal(r.mix.known, 10);
    assert.deepEqual([...r.ids].sort(), ids(0, 10).sort(), "les 10 dont l'échéance est la plus proche");
  });
  test("trop peu de nouvelles : le reste vient des questions à consolider puis à réviser", t => {
    seedRandom(t, 13);
    const stats = {};
    Q.slice(0, Q.length - 2).forEach(q => stats[q.id] = card({ due: day(9) }));         // 2 nouvelles seulement
    ids(0, 4).forEach(id => stats[id] = card({ ok: false, due: day(2), last: day(-1) }));
    ids(4, 6).forEach(id => stats[id] = card({ due: day(-3) }));
    const r = lesson(stats);
    assert.equal(r.ids.length, 10);
    assert.equal(r.mix.new, 2);
    assert.equal(r.mix.due, 2); assert.equal(r.mix.weak, 4);
    assert.equal(r.mix.known, 2);
  });
  test("une catégorie abondante ne dépasse pas son quota tant que les autres ont de quoi compléter", t => {
    seedRandom(t, 14);
    const stats = {}; ids(0, 30).forEach(id => stats[id] = card({ due: day(-1) }));     // 30 à réviser, 34 nouvelles
    const r = lesson(stats);
    assert.equal(r.mix.due, 4); assert.equal(r.mix.new, 6);
  });
});

describe("pickLesson : « Encore une » apporte du neuf", () => {
  test("les questions déjà répondues aujourd'hui sont écartées", t => {
    seedRandom(t, 15);
    const stats = {};
    ids(0, 20).forEach(id => stats[id] = card({ last: TODAY, due: day(1), ok: false }));   // répondues aujourd'hui, ratées
    const r = lesson(stats);
    assert.ok(r.ids.every(id => !stats[id]), "uniquement des questions jamais vues");
    assert.equal(r.mix.today, 0);
  });
  test("enchaîner des leçons : aucune question répétée tant qu'il reste du neuf", t => {
    seedRandom(t, 16);
    const stats = {}; const seen = new Set();
    for (let i = 0; i < 6; i++) {                                                     // 6 leçons = 60 des 64 questions
      const r = lesson(stats);
      assert.equal(r.ids.length, 10);
      for (const id of r.ids) { assert.ok(!seen.has(id), `${id} répétée à la leçon ${i + 1}`); seen.add(id); stats[id] = reviewCard(undefined, true, TODAY); }
    }
    assert.equal(seen.size, 60);
  });
  test("quand tout a été répondu aujourd'hui, la leçon reste possible (dernier recours)", t => {
    seedRandom(t, 17);
    const stats = {}; Q.forEach(q => stats[q.id] = card({ last: TODAY }));
    const r = lesson(stats);
    assert.equal(r.ids.length, 10); assert.equal(r.mix.today, 10);
  });
  test("les 4 dernières questions complètent la 7e leçon avec du déjà répondu", t => {
    seedRandom(t, 18);
    const stats = {}; Q.slice(0, 60).forEach(q => stats[q.id] = card({ last: TODAY }));
    const r = lesson(stats);
    assert.equal(r.mix.new, 4); assert.equal(r.mix.today, 6);
  });
});

describe("pickLesson : cas limites", () => {
  test("banque plus petite que la leçon : toutes les questions", () => {
    const r = pickLesson({ questions: Q.slice(0, 3), stats: {}, today: TODAY });
    assert.equal(r.ids.length, 3);
  });
  test("banque vide : aucune question", () => {
    assert.deepEqual(pickLesson({ questions: [], stats: {}, today: TODAY }).ids, []);
  });
  test("taille personnalisée et taille nulle", () => {
    assert.equal(pickLesson({ questions: Q, stats: {}, today: TODAY, size: 5 }).ids.length, 5);
    assert.equal(pickLesson({ questions: Q, stats: {}, today: TODAY, size: 0 }).ids.length, 0);
    assert.equal(pickLesson({ questions: Q, stats: {}, today: TODAY, size: 500 }).ids.length, Q.length);
    assert.equal(pickLesson({ questions: Q, stats: {}, today: TODAY, size: -3 }).ids.length, 0);
  });
  test("statistiques absentes, nulles ou concernant des questions retirées", () => {
    assert.equal(pickLesson({ questions: Q, stats: undefined, today: TODAY }).ids.length, 10);
    const stats = { "d9-99": card({ due: day(-9) }) };
    const r = pickLesson({ questions: Q, stats, today: TODAY });
    assert.ok(!r.ids.includes("d9-99"));
  });
  test("cartes migrées (dernière date inconnue) : traitées comme non répondues aujourd'hui", t => {
    seedRandom(t, 19);
    const stats = {}; ids(0, 6).forEach(id => stats[id] = card({ last: "", due: TODAY, ok: false }));
    const r = lesson(stats);
    assert.equal(r.mix.due, 4, "échéance aujourd'hui = à réviser");
  });
  test("ne modifie pas les statistiques reçues", () => {
    const stats = Object.freeze({ [Q[0].id]: Object.freeze(card({ due: day(-1) })) });
    assert.doesNotThrow(() => pickLesson({ questions: Q, stats, today: TODAY }));
  });
});
