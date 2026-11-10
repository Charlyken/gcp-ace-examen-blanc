import { test } from "node:test";
import assert from "node:assert/strict";
import { esc, fmt, shuffle, sameSet, clock, pct, isCorrect, clamp, num, dayKey, isDateKey, addDays, daysBetween, whenText } from "../js/utils.js";
import { seedRandom } from "./helpers.js";

test("esc échappe les caractères HTML dangereux", () => {
  assert.equal(esc(`<a href="x">&</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  assert.equal(esc(42), "42");
});

test("fmt échappe puis transforme `code` en <code>", () => {
  assert.equal(fmt("Lance `gcloud init` <vite>"), "Lance <code>gcloud init</code> &lt;vite&gt;");
  assert.equal(fmt("`a` et `b`"), "<code>a</code> et <code>b</code>");
  assert.equal(fmt("backtick `ouvert"), "backtick `ouvert");
});

test("shuffle renvoie une permutation sans modifier l'original", t => {
  seedRandom(t, 7);
  const src = [1, 2, 3, 4, 5, 6, 7, 8];
  const out = shuffle(src);
  assert.deepEqual(src, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.notEqual(out, src);
  assert.deepEqual(out.slice().sort((a, b) => a - b), src);
});

test("shuffle est reproductible avec un même tirage", t => {
  seedRandom(t, 3); const a = shuffle([1, 2, 3, 4, 5, 6]);
  t.mock.restoreAll(); seedRandom(t, 3); const b = shuffle([1, 2, 3, 4, 5, 6]);
  assert.deepEqual(a, b);
});

test("shuffle gère les tableaux vides et à un élément", () => {
  assert.deepEqual(shuffle([]), []);
  assert.deepEqual(shuffle([9]), [9]);
});

test("sameSet compare sans tenir compte de l'ordre ni de la copie", () => {
  assert.equal(sameSet([1, 0], [0, 1]), true);
  assert.equal(sameSet([0], [0, 1]), false);
  assert.equal(sameSet([0, 1], [0, 2]), false);
  assert.equal(sameSet([], []), true);
  const a = [2, 1]; sameSet(a, [1, 2]); assert.deepEqual(a, [2, 1], "ne doit pas trier l'entrée");
});

test("isCorrect : réponse unique, multiple, vide ou absente", () => {
  const single = { correct: [2] }, multi = { correct: [0, 3] };
  assert.equal(isCorrect(single, [2]), true);
  assert.equal(isCorrect(single, [1]), false);
  assert.equal(isCorrect(multi, [3, 0]), true);
  assert.equal(isCorrect(multi, [0]), false, "réponse incomplète");
  assert.equal(isCorrect(multi, [0, 3, 1]), false, "réponse en trop");
  assert.equal(isCorrect(single, []), false);
  assert.equal(isCorrect(single, undefined), false);
});

test("clock formate h:mm:ss et borne à zéro", () => {
  assert.equal(clock(2 * 3600 * 1000), "2:00:00");
  assert.equal(clock(61 * 1000), "0:01:01");
  assert.equal(clock(59_001), "0:01:00", "arrondi à la seconde supérieure");
  assert.equal(clock(0), "0:00:00");
  assert.equal(clock(-5000), "0:00:00");
});

test("pct arrondit et évite la division par zéro", () => {
  assert.equal(pct(1, 3), 33);
  assert.equal(pct(2, 3), 67);
  assert.equal(pct(5, 0), 0);
  assert.equal(pct(0, 10), 0);
});

test("clamp et num bornent les valeurs", () => {
  assert.equal(clamp(5, 0, 3), 3);
  assert.equal(clamp(-1, 0, 3), 0);
  assert.equal(num("85", 80, 50, 100), 85);
  assert.equal(num("120", 80, 50, 100), 100);
  assert.equal(num("12.6", 80, 5, 100), 13, "arrondi à l'entier");
  assert.equal(num("", 80, 50, 100), 80);
  assert.equal(num(null, 80, 50, 100), 80);
  assert.equal(num(undefined, 80, 50, 100), 80);
  assert.equal(num("abc", 80, 50, 100), 80);
});

test("dayKey formate la date locale AAAA-MM-JJ", () => {
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  assert.equal(dayKey(new Date(2026, 11, 31, 0, 0)), "2026-12-31");
  assert.match(dayKey(), /^\d{4}-\d{2}-\d{2}$/);
});

test("isDateKey accepte les vraies dates et refuse le reste", () => {
  assert.equal(isDateKey("2026-11-10"), true);
  assert.equal(isDateKey("2028-02-29"), true, "année bissextile");
  for (const bad of ["2026-02-31", "2027-02-29", "2026-13-01", "2026-00-10", "26-11-10", "2026-1-5", "", null, undefined, 20261110, "2026-11-10T00:00"]) assert.equal(isDateKey(bad), false, String(bad));
});

test("addDays ajoute ou retire des jours en traversant mois, années et bissextiles", () => {
  assert.equal(addDays("2026-11-10", 0), "2026-11-10");
  assert.equal(addDays("2026-11-10", 1), "2026-11-11");
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2027-02-28", 1), "2027-03-01");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(addDays("2026-11-10", 180), "2027-05-09");
});

test("addDays traverse un changement d'heure sans sauter ni répéter un jour", () => {
  let k = "2026-03-20";
  const seen = [];
  for (let i = 0; i < 15; i++) { k = addDays(k, 1); seen.push(k); }
  assert.equal(new Set(seen).size, 15);
  assert.equal(seen[0], "2026-03-21"); assert.equal(seen[14], "2026-04-04");
});

test("daysBetween : écart signé en jours, mois et années franchis, heure d'été comprise", () => {
  assert.equal(daysBetween("2026-11-10", "2026-11-10"), 0);
  assert.equal(daysBetween("2026-11-10", "2026-11-11"), 1);
  assert.equal(daysBetween("2026-11-11", "2026-11-10"), -1);
  assert.equal(daysBetween("2026-12-30", "2027-01-03"), 4);
  assert.equal(daysBetween("2028-02-28", "2028-03-01"), 2, "année bissextile");
  assert.equal(daysBetween("2026-03-20", "2026-04-04"), 15, "changement d'heure de mars");
  assert.equal(daysBetween("2026-10-20", "2026-11-04"), 15, "changement d'heure d'octobre / novembre");
  assert.equal(daysBetween("2026-03-01", "2026-03-15"), 14, "changement d'heure américain de mars");
  assert.equal(daysBetween("2026-09-20", "2026-10-10"), 20, "changement d'heure de l'hémisphère sud");
});

test("addDays et daysBetween sont réciproques", () => {
  for (const n of [-40, -1, 0, 1, 6, 15, 180, 400]) assert.equal(daysBetween("2026-06-15", addDays("2026-06-15", n)), n);
});

test("whenText : aujourd'hui, demain, dans n jours", () => {
  assert.equal(whenText(0), "aujourd'hui");
  assert.equal(whenText(-2), "aujourd'hui");
  assert.equal(whenText(1), "demain");
  assert.equal(whenText(2), "dans 2 jours");
  assert.equal(whenText(30), "dans 30 jours");
});
