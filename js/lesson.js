/* Leçon courte : choix des questions. Logique pure (aucun DOM, aucun stockage).

   Une leçon mélange, pour `size` questions (10 par défaut, soit environ 5 minutes) :
   - 40 % de questions à RÉVISER : l'échéance du planning est arrivée, les plus en retard d'abord (voir srs.js) ;
   - 30 % de questions à CONSOLIDER : la dernière réponse était fausse, les plus difficiles (facilité basse) d'abord
    (une question à la fois en retard et ratée compte d'abord comme à réviser, puis déborde ici si le quota est atteint) ;
   - le reste de questions NOUVELLES, jamais vues, entrelacées par domaine pour varier les sujets.
   Quand une catégorie manque, on complète dans cet ordre : nouvelles, à consolider, à réviser, déjà maîtrisées
   (la prochaine échéance la plus proche d'abord), et en tout dernier recours des questions déjà répondues aujourd'hui.
   Les questions déjà répondues aujourd'hui sont écartées tant qu'il en reste d'autres : « Encore une leçon » apporte du neuf. */
import { LESSON } from "./config.js";
import { dueIds } from "./srs.js";
import { shuffle } from "./utils.js";

const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Entrelace les questions par domaine (un domaine après l'autre, dans le désordre) pour éviter les séries du même sujet.
function interleave(questions) {
  const groups = {};
  for (const q of shuffle(questions)) (groups[q.domain] = groups[q.domain] || []).push(q.id);
  const lists = shuffle(Object.values(groups)), out = [];
  for (let i = 0; lists.some(l => i < l.length); i++) for (const l of lists) if (i < l.length) out.push(l[i]);
  return out;
}

/* Choisit les questions d'une leçon. `questions` = la banque, `stats` = les cartes de révision, `today` = "AAAA-MM-JJ".
   Renvoie { ids (dans le désordre), mix } où mix compte les questions prises dans chaque catégorie. */
export function pickLesson({ questions, stats, today, size = LESSON.size }) {
  const st = stats || {};
  const n = size;                                  // une taille négative ou nulle ne prend aucune question (voir take)
  const answeredToday = id => !!st[id] && st[id].last === today;
  const fresh = questions.filter(q => !answeredToday(q.id));
  const freshIds = new Set(fresh.map(q => q.id));

  const due = dueIds(st, today, id => freshIds.has(id));
  const weak = fresh.filter(q => st[q.id] && st[q.id].ok === false)
    .sort((a, b) => st[a.id].ease - st[b.id].ease || st[b.id].n - st[a.id].n || byId(a.id, b.id)).map(q => q.id);
  const novel = interleave(fresh.filter(q => !st[q.id]));
  const known = fresh.filter(q => st[q.id])
    .sort((a, b) => (st[a.id].due < st[b.id].due ? -1 : st[a.id].due > st[b.id].due ? 1 : byId(a.id, b.id))).map(q => q.id);
  const today_ = shuffle(questions.filter(q => answeredToday(q.id)).map(q => q.id));

  const picked = [], seen = new Set(), mix = { due: 0, weak: 0, new: 0, known: 0, today: 0 };
  const take = (pool, label, k) => {
    for (const id of pool) {
      if (k <= 0) break;
      if (seen.has(id)) continue;
      seen.add(id); picked.push(id); mix[label]++; k--;
    }
  };
  const quotaDue = Math.round(n * LESSON.due), quotaWeak = Math.min(n - quotaDue, Math.round(n * LESSON.weak));
  take(due, "due", quotaDue);
  take(weak, "weak", quotaWeak);
  take(novel, "new", n - quotaDue - quotaWeak);
  for (const [pool, label] of [[novel, "new"], [weak, "weak"], [due, "due"], [known, "known"], [today_, "today"]]) take(pool, label, n - picked.length);
  return { ids: shuffle(picked), mix };
}
