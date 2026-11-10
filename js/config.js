/* Réglages et constantes de l'application. Aucune dépendance : importable depuis Node. */
export const CONFIG = {
  examSize: 50,          // nombre de questions de l'examen blanc
  examMinutes: 120,      // durée du chronomètre
  passPct: 70,           // seuil de réussite indicatif
  lowTimeMs: 10 * 60000  // le chrono passe en rouge sous ce délai
};
export const KEYS = { exam: "ace.session.exam", practice: "ace.session.practice", history: "ace.history", stats: "ace.stats", activity: "ace.activity", profile: "ace.profile", version: "ace.version" };
export const HISTORY_MAX = 20;    // nombre d'examens blancs conservés dans l'historique
// À incrémenter dès que le format des données sauvegardées change : les anciennes données sont alors purgées.
export const STORAGE_VERSION = 1;
export const LETTERS = "ABCDE";

// Répétition espacée (variante de SM-2 adaptée à une réponse juste/fausse).
export const SRS = {
  startEase: 2.5,          // facilité initiale : multiplicateur d'intervalle après les deux premières réussites
  minEase: 1.3,            // facilité minimale (SM-2)
  maxEase: 3.5,            // borne haute acceptée à l'import
  lapseEaseDelta: -0.32,   // pénalité de facilité après une erreur (équivaut à la note 2 de SM-2)
  secondInterval: 6,       // intervalle (jours) après la deuxième réussite consécutive
  maxIntervalDays: 180,    // une question maîtrisée revient au plus tard après ce délai
  historyMax: 8            // nombre de résultats récents conservés par question
};

export const DEFAULT_PROFILE = { name: "", color: 1, target: 80, examDate: "", daily: 10, theme: "auto" };
export const AVATAR_COLORS = [1, 2, 3, 4, 5];                       // réutilise les couleurs des domaines (.d1 à .d5)
export const THEMES = { auto: "Système", light: "Clair", dark: "Sombre" };
