/* Aides communes aux tests. */
import { mock } from "node:test";

// Générateur pseudo-aléatoire reproductible (mulberry32).
export function seeded(seed = 1) {
  let a = seed;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// Remplace Math.random pendant un test ; renvoie la fonction de restauration.
export function seedRandom(t, seed = 1) { t.mock.method(Math, "random", seeded(seed)); }
// Fige l'horloge (Date) à une date locale ; à restaurer avec mock.timers.reset() (voir freezeDate).
export function freezeDate(t, y, m, d, h = 12) {
  mock.timers.enable({ apis: ["Date"], now: new Date(y, m - 1, d, h, 0, 0) });
  t.after(() => mock.timers.reset());
}
