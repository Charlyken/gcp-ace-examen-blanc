/* Export et import de la progression (JSON). Logique pure : la lecture de fichier et les messages sont dans data-io.js. */
import { HISTORY_MAX } from "./config.js";
import { sanitizeProfile } from "./logic.js";
import { normalizeStats } from "./srs.js";

export const APP_ID = "gcp-ace-examen-blanc";

export function buildExport({ profile, stats, activity, history }, version, now = new Date()) {
  return { app: APP_ID, version, exportedAt: now.toISOString(), profile, stats, activity, history };
}

// Lit un export. Lève une erreur si le fichier n'en est pas un ; ne renvoie que les sections présentes et valides
// (une section absente laisse les données actuelles intactes). `today` date la migration des anciennes entrées.
export function parseImport(text, { isKnownId, today }) {
  const d = JSON.parse(text);
  if (!d || d.app !== APP_ID) throw new Error("format");
  const out = {};
  if (d.stats && typeof d.stats === "object") out.stats = normalizeStats(d.stats, today, isKnownId);
  if (d.activity && typeof d.activity === "object")
    out.activity = Object.fromEntries(Object.entries(d.activity)
      .filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && v && Number.isFinite(v.n))
      .map(([k, v]) => [k, { n: v.n, ok: Number.isFinite(v.ok) ? v.ok : 0 }]));
  if (Array.isArray(d.history))
    out.history = d.history.filter(h => h && Number.isFinite(h.date) && Number.isFinite(h.pct) && Number.isFinite(h.ok) && Number.isFinite(h.total)).slice(0, HISTORY_MAX);
  if (d.profile && typeof d.profile === "object") out.profile = sanitizeProfile(d.profile);
  return out;
}
