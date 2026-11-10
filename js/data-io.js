/* Export et import des données de l'utilisateur (JSON). */
import { KEYS, STORAGE_VERSION, HISTORY_MAX } from "./config.js";
import { Q_BY_ID } from "./data.js";
import { state, saveStats, saveProfile, applyTheme } from "./state.js";
import { store } from "./storage.js";
import { sanitizeProfile } from "./logic.js";
import { dayKey } from "./utils.js";
import { toast } from "./ui/dialog.js";
import { renderProfile } from "./views/profile.js";

export function exportData() {
  const data = { app: "gcp-ace-examen-blanc", version: STORAGE_VERSION, exportedAt: new Date().toISOString(), profile: state.profile, stats: state.stats, activity: state.activity, history: store.get(KEYS.history) || [] };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = `gcp-ace-progression-${dayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Export téléchargé");
}
export function importData(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!d || d.app !== "gcp-ace-examen-blanc") throw new Error("format");
      if (d.stats && typeof d.stats === "object")
        state.stats = Object.fromEntries(Object.entries(d.stats).filter(([id, v]) => Q_BY_ID[id] && v && Number.isFinite(v.n)).map(([id, v]) => [id, { n: v.n, ok: !!v.ok }]));
      if (d.activity && typeof d.activity === "object")
        state.activity = Object.fromEntries(Object.entries(d.activity).filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && v && Number.isFinite(v.n)).map(([k, v]) => [k, { n: v.n, ok: Number.isFinite(v.ok) ? v.ok : 0 }]));
      if (Array.isArray(d.history))
        store.set(KEYS.history, d.history.filter(h => h && Number.isFinite(h.date) && Number.isFinite(h.pct) && Number.isFinite(h.ok) && Number.isFinite(h.total)).slice(0, HISTORY_MAX));
      if (d.profile && typeof d.profile === "object") state.profile = sanitizeProfile(d.profile);
      saveStats(); saveProfile(); applyTheme();
      renderProfile(); toast("Données importées");
    } catch (e) { toast("Fichier non reconnu"); }
  };
  rd.readAsText(file);
}
