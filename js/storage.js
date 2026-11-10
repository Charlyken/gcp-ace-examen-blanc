/* Stockage local (peut être indisponible : on continue alors en mémoire). */
import { KEYS, STORAGE_VERSION } from "./config.js";

export const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* on continue en mémoire */ } },
  del(key) { try { localStorage.removeItem(key); } catch (e) {} }
};

// Purge les anciennes données si le format a changé (le profil est conservé).
export function migrateStorage() {
  try {
    if (store.get(KEYS.version) !== STORAGE_VERSION) {
      ["exam", "practice", "history", "stats", "activity"].forEach(k => store.del(KEYS[k]));
      store.set(KEYS.version, STORAGE_VERSION);
    }
  } catch (e) { /* stockage indisponible : on continue en mémoire */ }
}
