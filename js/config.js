/* Réglages et constantes de l'application. Aucune dépendance : importable depuis Node. */
export const CONFIG = {
  examSize: 50,          // nombre de questions de l'examen blanc
  examMinutes: 120,      // durée du chronomètre
  passPct: 70,           // seuil de réussite indicatif
  lowTimeMs: 10 * 60000  // le chrono passe en rouge sous ce délai
};
export const KEYS = { exam: "ace.session.exam", practice: "ace.session.practice", history: "ace.history", stats: "ace.stats", activity: "ace.activity", xp: "ace.xp", profile: "ace.profile", version: "ace.version" };
export const HISTORY_MAX = 20;    // nombre d'examens blancs conservés dans l'historique
// À incrémenter dès que le format des données sauvegardées change : les anciennes données sont alors purgées.
export const STORAGE_VERSION = 1;
export const LETTERS = "ABCDE";

// Leçon courte (≈ 5 minutes) : taille et composition. Le reste de la leçon est complété par des questions nouvelles.
export const LESSON = {
  size: 10,          // nombre de questions
  due: 0.4,          // part de questions à réviser (échéance atteinte)
  weak: 0.3          // part de questions à consolider (dernière réponse fausse)
};

// Points d'expérience (XP). Barème affiché dans l'application et documenté dans le README.
export const XP_RULES = {
  answer: 10,        // une bonne réponse, la première fois de la journée pour cette question
  perfect: 20,       // bonus « leçon parfaite » : toutes les réponses justes sur au moins `perfectMin` questions
  review: 15,        // bonus « révision terminée » : toutes les questions de la série de révision validées
  perfectMin: 5,     // taille minimale d'une leçon parfaite, et nombre de questions rapportant de l'XP qu'elle exige
  levelBase: 50      // le niveau n commence à levelBase × n × (n - 1) XP : 100, 300, 600, 1000…
};
export const XP_MAX = 1e7;   // borne de sécurité à l'import

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
