/* Petits utilitaires purs (sans DOM ni état) : importables depuis Node. */
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const fmt = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");   // `texte` -> <code>
export const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const sameSet = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();
export const clock = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0"); };
export const pct = (n, d) => d ? Math.round(n / d * 100) : 0;
export const isCorrect = (q, answer) => sameSet(q.correct, answer || []);
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const num = (v, def, lo, hi) => { const n = Number(v); return v === "" || v == null || !Number.isFinite(n) ? def : clamp(Math.round(n), lo, hi); };
export const dayKey = d => { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
// Dates sous forme de clés locales "AAAA-MM-JJ" (comparables comme des chaînes).
export const isDateKey = k => {
  if (typeof k !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(k)) return false;
  const [y, m, d] = k.split("-").map(Number);
  const t = new Date(y, m - 1, d, 12);
  return t.getFullYear() === y && t.getMonth() === m - 1;   // un jour hors plage (2026-02-31, 2026-11-00) décale le mois
};
// Ajoute (ou retire) des jours à une clé de date ; midi évite les décalages d'heure d'été.
export const addDays = (key, n) => { const [y, m, d] = key.split("-").map(Number); return dayKey(new Date(y, m - 1, d + n, 12)); };
