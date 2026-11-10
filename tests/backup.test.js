import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { HISTORY_MAX, DEFAULT_PROFILE } from "../js/config.js";
import { QUESTIONS } from "../js/data.js";
import { APP_ID, buildExport, parseImport } from "../js/backup.js";
import { reviewCard } from "../js/srs.js";
import { dayStreak } from "../js/streak.js";
import { addDays } from "../js/utils.js";

const TODAY = "2026-11-10";
const known = id => QUESTIONS.some(q => q.id === id);
const ID1 = QUESTIONS[0].id, ID2 = QUESTIONS[1].id, ID3 = QUESTIONS[2].id;
const roundTrip = (data, today = TODAY) => parseImport(JSON.stringify(buildExport(data, 1, new Date(2026, 10, 10))), { isKnownId: known, today });

// Un planning réaliste : une question maîtrisée sur plusieurs révisions, une ratée, une jamais revue.
function planning() {
  let a; for (const day of ["2026-10-01", "2026-10-02", "2026-10-08"]) a = reviewCard(a, true, day);
  const b = reviewCard(undefined, false, "2026-11-09");
  return { [ID1]: a, [ID2]: b };
}

describe("buildExport", () => {
  test("contient l'identifiant de l'application, la version, la date et toutes les sections", () => {
    const e = buildExport({ profile: { name: "A" }, stats: { x: 1 }, activity: { y: 2 }, history: [3] }, 1, new Date("2026-11-10T10:00:00Z"));
    assert.deepEqual(e, { app: APP_ID, version: 1, exportedAt: "2026-11-10T10:00:00.000Z", profile: { name: "A" }, stats: { x: 1 }, activity: { y: 2 }, history: [3] });
  });
});

describe("export puis import : le planning de révision est conservé", () => {
  test("les cartes reviennent à l'identique (échéances, intervalles, facilité, historique)", () => {
    const stats = planning();
    const back = roundTrip({ profile: DEFAULT_PROFILE, stats, activity: {}, history: [] });
    assert.deepEqual(back.stats, stats);
    assert.equal(back.stats[ID1].interval, 15);
    assert.equal(back.stats[ID2].due, "2026-11-10");
  });
  test("la date d'import n'écrase pas un planning existant", () => {
    const stats = planning();
    const back = roundTrip({ profile: DEFAULT_PROFILE, stats, activity: {}, history: [] }, "2030-01-01");
    assert.deepEqual(back.stats, stats);
  });
  test("profil, activité et historique des examens sont conservés", () => {
    const profile = { name: "Zoé", color: 3, target: 90, examDate: "2027-01-15", daily: 20, theme: "dark" };
    const activity = { "2026-11-09": { n: 5, ok: 4 } };
    const history = [{ date: 1762000000000, ok: 40, total: 50, pct: 80, usedMs: 5000000 }];
    const back = roundTrip({ profile, stats: planning(), activity, history });
    assert.deepEqual(back.profile, profile);
    assert.deepEqual(back.activity, activity);
    assert.deepEqual(back.history, history);
  });
});

describe("export puis import : la série de jours est conservée", () => {
  // 6 jours d'activité avec un jour de repos hier ; objectif de 10 enregistré chaque jour.
  const activity = () => {
    const a = {};
    for (const i of [0, 2, 3, 4, 5, 6]) a[addDays(TODAY, -i)] = { n: 10 + i, ok: 8, goal: 10 };
    return a;
  };
  test("l'objectif de chaque jour est conservé et la série est identique", () => {
    const act = activity();
    const before = dayStreak(act, TODAY, 10);
    const back = roundTrip({ profile: DEFAULT_PROFILE, stats: {}, activity: act, history: [] });
    assert.deepEqual(back.activity, act);
    assert.deepEqual(dayStreak(back.activity, TODAY, 10), before);
    assert.equal(before.count, 6); assert.equal(before.rests.length, 1);
  });
  test("un objectif relevé après l'export ne change pas la série importée", () => {
    const back = roundTrip({ profile: DEFAULT_PROFILE, stats: {}, activity: activity(), history: [] });
    assert.equal(dayStreak(back.activity, TODAY, 50).count, 5, "aujourd'hui (objectif 50) n'est pas atteint ; les jours passés restent valides");
  });
  test("un ancien export sans objectif reste lisible (une réponse suffit)", () => {
    const text = JSON.stringify({ app: APP_ID, activity: { [addDays(TODAY, -1)]: { n: 2, ok: 1 }, [addDays(TODAY, -2)]: { n: 5, ok: 5 } } });
    const { activity: a } = parseImport(text, { isKnownId: known, today: TODAY });
    assert.deepEqual(a[addDays(TODAY, -1)], { n: 2, ok: 1 });
    assert.equal(dayStreak(a, TODAY, 10).count, 2);
  });
  test("objectif invalide ignoré, objectif trop grand borné", () => {
    const text = JSON.stringify({ app: APP_ID, activity: { "2026-11-08": { n: 5, ok: 1, goal: "x" }, "2026-11-09": { n: 5, ok: 1, goal: 0 }, "2026-11-07": { n: 5, ok: 1, goal: 99999 } } });
    const { activity: a } = parseImport(text, { isKnownId: known, today: TODAY });
    assert.equal("goal" in a["2026-11-08"], false);
    assert.equal("goal" in a["2026-11-09"], false);
    assert.equal(a["2026-11-07"].goal, 200);
  });
});

describe("parseImport : anciens exports et données douteuses", () => {
  test("un export d'avant la répétition espacée est migré sans perdre n ni ok", () => {
    const legacy = JSON.stringify({ app: APP_ID, version: 1, stats: { [ID1]: { n: 3, ok: true }, [ID2]: { n: 1, ok: false } } });
    const { stats } = parseImport(legacy, { isKnownId: known, today: TODAY });
    assert.equal(stats[ID1].n, 3); assert.equal(stats[ID1].ok, true); assert.equal(stats[ID1].due, "2026-11-11");
    assert.equal(stats[ID2].n, 1); assert.equal(stats[ID2].ok, false); assert.equal(stats[ID2].due, TODAY);
  });
  test("écarte les questions retirées de la banque et les entrées invalides", () => {
    const text = JSON.stringify({ app: APP_ID, stats: { [ID1]: { n: 1, ok: true }, "d9-99": { n: 2, ok: true }, [ID3]: { n: "x" } } });
    assert.deepEqual(Object.keys(parseImport(text, { isKnownId: known, today: TODAY }).stats), [ID1]);
  });
  test("ne renvoie que les sections présentes (les autres données restent intactes)", () => {
    assert.deepEqual(parseImport(JSON.stringify({ app: APP_ID }), { isKnownId: known, today: TODAY }), {});
    const onlyProfile = parseImport(JSON.stringify({ app: APP_ID, profile: { name: "B" } }), { isKnownId: known, today: TODAY });
    assert.deepEqual(Object.keys(onlyProfile), ["profile"]);
    assert.equal(onlyProfile.profile.name, "B");
  });
  test("nettoie le profil importé", () => {
    const { profile } = parseImport(JSON.stringify({ app: APP_ID, profile: { target: 5000, theme: "neon", name: "  C  " } }), { isKnownId: known, today: TODAY });
    assert.equal(profile.target, 100); assert.equal(profile.theme, "auto"); assert.equal(profile.name, "C");
  });
  test("activité : ignore les clés qui ne sont pas des dates et complète ok manquant", () => {
    const { activity } = parseImport(JSON.stringify({ app: APP_ID, activity: { "2026-11-09": { n: 3 }, "hier": { n: 1, ok: 1 }, "2026-11-08": { n: "x" } } }), { isKnownId: known, today: TODAY });
    assert.deepEqual(activity, { "2026-11-09": { n: 3, ok: 0 } });
  });
  test("historique : entrées incomplètes écartées, taille limitée", () => {
    const entries = Array.from({ length: HISTORY_MAX + 5 }, (_, i) => ({ date: 1 + i, ok: 1, total: 2, pct: 50 }));
    const { history } = parseImport(JSON.stringify({ app: APP_ID, history: [{ date: 1 }, null, ...entries] }), { isKnownId: known, today: TODAY });
    assert.equal(history.length, HISTORY_MAX);
    assert.ok(history.every(h => Number.isFinite(h.pct)));
  });
  test("refuse un fichier qui n'est pas un export de l'application", () => {
    for (const bad of ["pas du json", "null", "42", JSON.stringify({ app: "autre" }), JSON.stringify({ stats: {} })]) {
      assert.throws(() => parseImport(bad, { isKnownId: known, today: TODAY }), bad);
    }
  });
});
