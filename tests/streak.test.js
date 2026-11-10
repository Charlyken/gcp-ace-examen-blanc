import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { dayStreak, addActivity, streakSummary, REST_GAP } from "../js/streak.js";
import { addDays } from "../js/utils.js";

const TODAY = "2026-11-10";

// Construit l'activité depuis une chaîne, du plus ancien au plus récent (le dernier caractère = aujourd'hui) :
// « X » = objectif atteint (10/10), « . » = jour manqué, « p » = jour partiel (3/10).
function week(spec, goal = 10) {
  const act = {};
  [...spec].reverse().forEach((c, i) => {
    if (c === "X") act[addDays(TODAY, -i)] = { n: goal, ok: goal, goal };
    if (c === "p") act[addDays(TODAY, -i)] = { n: 3, ok: 2, goal };
  });
  return act;
}
const run = (spec, goal = 10) => dayStreak(week(spec, goal), TODAY, goal);

describe("dayStreak : jours consécutifs", () => {
  test("aucune activité : série nulle", () => {
    for (const act of [{}, null, undefined]) {
      const r = dayStreak(act, TODAY, 10);
      assert.equal(r.count, 0); assert.equal(r.todayDone, false); assert.equal(r.todayN, 0);
      assert.deepEqual(r.rests, []); assert.equal(r.atRisk, false);
    }
  });
  test("jours consécutifs, aujourd'hui compris", () => {
    const r = run("XXXXX");
    assert.equal(r.count, 5); assert.equal(r.todayDone, true); assert.equal(r.remaining, 0);
  });
  test("aujourd'hui pas encore atteint : la série d'hier est conservée", () => {
    const r = run("XXXX.");
    assert.equal(r.count, 4); assert.equal(r.todayDone, false); assert.equal(r.remaining, 10);
  });
  test("aujourd'hui partiel : pas compté, mais la série reste vivante", () => {
    const r = run("XXXp");
    assert.equal(r.count, 3); assert.equal(r.todayN, 3); assert.equal(r.remaining, 7); assert.equal(r.todayDone, false);
  });
  test("un jour partiel dans le passé est un jour manqué", () => {
    const r = run("XXpXX");
    assert.equal(r.count, 4, "les 4 jours atteints ; le jour partiel est pardonné (repos) sans compter");
    assert.equal(r.rests.length, 1);
  });
  test("l'activité très ancienne n'est pas comptée", () => {
    assert.equal(dayStreak({ "2026-10-01": { n: 10, goal: 10 } }, TODAY, 10).count, 0);
  });
});

describe("dayStreak : objectif du jour", () => {
  test("un jour compte à partir de son objectif enregistré", () => {
    const act = { [TODAY]: { n: 10, goal: 10 }, [addDays(TODAY, -1)]: { n: 19, goal: 20 }, [addDays(TODAY, -2)]: { n: 20, goal: 20 } };
    const r = dayStreak(act, TODAY, 10);
    assert.equal(r.count, 2, "hier : 19/20 manqué (pardonné), avant-hier : atteint");
    assert.equal(r.rests.length, 1);
  });
  test("changer l'objectif ne réécrit pas le passé", () => {
    const act = week("XXXX.");                       // atteint à 10/jour
    assert.equal(dayStreak(act, TODAY, 10).count, 4);
    assert.equal(dayStreak(act, TODAY, 50).count, 4, "objectif relevé à 50 : les jours passés restent valides");
  });
  test("aujourd'hui est jugé sur l'objectif actuel du profil", () => {
    const act = { [TODAY]: { n: 5, ok: 5, goal: 10 } };
    assert.equal(dayStreak(act, TODAY, 10).todayDone, false);
    assert.equal(dayStreak(act, TODAY, 5).todayDone, true, "objectif abaissé à 5 en cours de journée");
    assert.equal(dayStreak(act, TODAY, 5).count, 1);
  });
  test("donnée d'avant cette règle (sans objectif) : une réponse suffit pour un jour passé", () => {
    const act = { [addDays(TODAY, -1)]: { n: 1, ok: 1 }, [addDays(TODAY, -2)]: { n: 4, ok: 3 } };
    assert.equal(dayStreak(act, TODAY, 10).count, 2);
  });
  test("objectif invalide ou absent : au moins une réponse", () => {
    assert.equal(dayStreak({ [TODAY]: { n: 1 } }, TODAY, 0).todayDone, true);
    assert.equal(dayStreak({ [TODAY]: { n: 1 } }, TODAY, undefined).todayGoal, 1);
  });
  test("entrées invalides ignorées", () => {
    const act = { [TODAY]: { n: NaN, goal: 10 }, [addDays(TODAY, -1)]: null, [addDays(TODAY, -2)]: { n: "x" }, [addDays(TODAY, -3)]: { n: 0, goal: 1 } };
    assert.equal(dayStreak(act, TODAY, 10).count, 0);
  });
});

describe("dayStreak : jour de repos (un par période de 7 jours)", () => {
  test("un jour manqué isolé est pardonné et ne compte pas", () => {
    const r = run("XXX.X");
    assert.equal(r.count, 4);
    assert.deepEqual(r.rests, [addDays(TODAY, -1)]);
  });
  test("deux jours manqués de suite cassent la série", () => {
    assert.equal(run("XXX..X").count, 1);
    assert.equal(run("XXXX...X").count, 1);
  });
  test("un second jour manqué moins de 7 jours après le premier casse la série", () => {
    // trous 1 jour et 7 jours en arrière : écart de 6 -> le plus ancien n'est pas pardonné
    const r = run("XX.XXXXX.X");
    assert.equal(r.count, 6, "aujourd'hui + les 5 jours jusqu'au second trou");
    assert.equal(r.rests.length, 1);
  });
  test("deux jours de repos distants d'au moins 7 jours sont acceptés", () => {
    const r = run("X.XXXXXX.X");
    assert.equal(r.count, 8);
    assert.equal(r.rests.length, 2);
  });
  test("deux jours de repos distants de 6 jours : le plus ancien casse la série", () => {
    const r = run("XXXXX.XXXXX.X");
    assert.equal(r.count, 1 + 5, "seulement le jour d'aujourd'hui et les 5 jours jusqu'au 2e trou");
    assert.equal(r.rests.length, 1);
  });
  test("la distance minimale est celle de REST_GAP", () => {
    assert.equal(REST_GAP, 7);
    // trous à 7 jours d'écart (1 et 8 jours en arrière) : accepté ; à 6 jours (1 et 7) : refusé
    assert.equal(run("X.XXXXXX.X").count, 8);
    assert.equal(run("XX.XXXXX.X").count, 6);
  });
  test("un jour de repos au bout de la série n'en fait pas partie", () => {
    const r = run("..XX");
    assert.equal(r.count, 2); assert.deepEqual(r.rests, []);
    assert.equal(run(".X").count, 1);
  });
  test("aujourd'hui non atteint + hier de repos : série vivante mais à risque", () => {
    const r = run("XX..");
    assert.equal(r.count, 2); assert.deepEqual(r.rests, [addDays(TODAY, -1)]);
    assert.equal(r.restAvailable, false); assert.equal(r.atRisk, true);
  });
  test("aujourd'hui non atteint + repos disponible : pas à risque", () => {
    const r = run("XXX.");
    assert.equal(r.count, 3); assert.equal(r.restAvailable, true); assert.equal(r.nextRestIn, 0); assert.equal(r.atRisk, false);
  });
  test("aujourd'hui atteint : jamais à risque", () => {
    assert.equal(run("XX.X").atRisk, false);
  });
  test("après un jour de repos, le prochain est disponible dans 7 jours moins l'ancienneté", () => {
    assert.equal(run("XX.X").nextRestIn, 6);           // repos hier : dans 6 jours
    assert.equal(run("XX.XX").nextRestIn, 5);          // repos il y a 2 jours
    assert.equal(run("X.XXXXXXX").restAvailable, true, "repos vieux de 8 jours : à nouveau disponible");
  });
  test("avec deux jours de repos, le prochain se calcule depuis le plus récent", () => {
    const r = run("X.XXXXXX.XX");                // repos il y a 2 jours et il y a 9 jours
    assert.equal(r.count, 9); assert.equal(r.rests.length, 2);
    assert.equal(r.restAvailable, false);
    assert.equal(r.nextRestIn, 5, "7 - 2");
  });
  test("série vide : pas de risque ni de repos signalé", () => {
    const r = run("....");
    assert.equal(r.count, 0); assert.equal(r.atRisk, false); assert.deepEqual(r.rests, []);
  });
  test("les jours de repos sont rendus du plus ancien au plus récent", () => {
    const r = run("X.XXXXXX.X");
    assert.deepEqual(r.rests, [addDays(TODAY, -8), addDays(TODAY, -1)]);
  });
});

describe("dayStreak : dates et changements d'heure", () => {
  test("30 jours consécutifs à travers un changement d'heure : série de 30", () => {
    for (const today of ["2026-03-31", "2026-04-02", "2026-10-31", "2026-11-03"]) {
      const act = {}; for (let i = 0; i < 30; i++) act[addDays(today, -i)] = { n: 10, ok: 10, goal: 10 };
      assert.equal(dayStreak(act, today, 10).count, 30, today);
    }
  });
  test("passage de mois et d'année", () => {
    const today = "2027-01-02", act = {};
    for (const k of ["2027-01-02", "2027-01-01", "2026-12-31", "2026-12-30"]) act[k] = { n: 10, goal: 10 };
    assert.equal(dayStreak(act, today, 10).count, 4);
  });
  test("ne modifie pas l'activité reçue", () => {
    const act = Object.freeze(week("XX.XX"));
    assert.doesNotThrow(() => dayStreak(act, TODAY, 10));
  });
});

describe("addActivity", () => {
  test("incrémente les compteurs et enregistre l'objectif du jour", () => {
    assert.deepEqual(addActivity(undefined, true, 10), { n: 1, ok: 1, goal: 10 });
    assert.deepEqual(addActivity({ n: 4, ok: 3, goal: 10 }, false, 15), { n: 5, ok: 3, goal: 15 });
  });
  test("accepte une entrée ancienne sans objectif et borne l'objectif", () => {
    assert.deepEqual(addActivity({ n: 2, ok: 1 }, true, 5), { n: 3, ok: 2, goal: 5 });
    assert.equal(addActivity(undefined, true, 0).goal, 1);
    assert.equal(addActivity(undefined, true, 7.9).goal, 7);
  });
  test("ne modifie pas l'entrée reçue", () => {
    const e = Object.freeze({ n: 1, ok: 1, goal: 10 });
    assert.doesNotThrow(() => addActivity(e, true, 10));
    assert.equal(e.n, 1);
  });
  test("atteindre l'objectif fait compter le jour dans la série", () => {
    let e; for (let i = 0; i < 10; i++) e = addActivity(e, true, 10);
    assert.equal(dayStreak({ [TODAY]: e }, TODAY, 10).count, 1);
    assert.equal(dayStreak({ [TODAY]: addActivity(undefined, true, 10) }, TODAY, 10).count, 0);
  });
});

describe("streakSummary : textes", () => {
  const sum = (spec, extra = {}) => streakSummary({ ...run(spec), ...extra });
  test("série en cours et objectif atteint", () => {
    const s = sum("XXXX");
    assert.equal(s.title, "4 jours d'affilée");
    assert.match(s.sub, /Objectif du jour atteint \(10\/10\)/);
    assert.match(s.rest, /disponible/);
  });
  test("singulier : 1 jour d'affilée", () => {
    assert.equal(sum("X").title, "1 jour d'affilée");
  });
  test("à prolonger aujourd'hui, repos disponible", () => {
    const s = sum("XXX.");
    assert.equal(s.title, "3 jours d'affilée");
    assert.match(s.sub, /Encore 10 questions aujourd'hui pour prolonger/);
  });
  test("à risque : demande de valider aujourd'hui", () => {
    const s = sum("XX..");
    assert.match(s.sub, /garder ta série/);
    assert.match(s.rest, /Jour de repos utilisé : le prochain sera disponible dans 6 jours/);
  });
  test("une seule question restante : singulier", () => {
    const act = { ...week("XX."), [TODAY]: { n: 9, ok: 9, goal: 10 } };
    assert.match(streakSummary(dayStreak(act, TODAY, 10)).sub, /Encore 1 question aujourd'hui/);
  });
  test("aucune série : invitation à la lancer, pas de ligne sur le repos", () => {
    const s = sum("....");
    assert.equal(s.title, "Pas de série en cours");
    assert.match(s.sub, /Valide 10 questions aujourd'hui pour lancer ta série/);
    assert.equal(s.rest, "");
  });
  test("aucune série mais déjà quelques réponses aujourd'hui", () => {
    const s = streakSummary(dayStreak({ [TODAY]: { n: 3, ok: 3, goal: 10 } }, TODAY, 10));
    assert.match(s.sub, /Encore 7 questions aujourd'hui pour lancer/);
  });
});
