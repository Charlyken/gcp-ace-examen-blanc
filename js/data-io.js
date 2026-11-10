/* Export et import des données de l'utilisateur (JSON). Le format et sa validation sont dans backup.js (pur). */
import { KEYS, STORAGE_VERSION } from "./config.js";
import { Q_BY_ID } from "./data.js";
import { state, saveStats, saveProfile, applyTheme } from "./state.js";
import { store } from "./storage.js";
import { buildExport, parseImport } from "./backup.js";
import { dayKey } from "./utils.js";
import { toast } from "./ui/dialog.js";
import { renderProfile } from "./views/profile.js";

export function exportData() {
  const data = buildExport({ profile: state.profile, stats: state.stats, activity: state.activity, history: store.get(KEYS.history) || [] }, STORAGE_VERSION);
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
      const d = parseImport(rd.result, { isKnownId: id => !!Q_BY_ID[id], today: dayKey() });
      if (d.stats) state.stats = d.stats;
      if (d.activity) state.activity = d.activity;
      if (d.history) store.set(KEYS.history, d.history);
      if (d.profile) state.profile = d.profile;
      saveStats(); saveProfile(); applyTheme();
      renderProfile(); toast("Données importées");
    } catch (e) { toast("Fichier non reconnu"); }
  };
  rd.readAsText(file);
}
