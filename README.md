# Examen blanc GCP ACE

Plateforme d'entraînement **non officielle** pour la certification Google Cloud Associate Cloud Engineer. Application statique HTML/CSS/JS, sans backend ni dépendance à installer.

> Outil personnel, sans lien avec Google. Les questions sont originales et ne proviennent pas de l'examen officiel. Le seuil de 70 % est indicatif : Google ne publie pas la note de passage.

## Fonctionnalités

- **Examen blanc** : 50 questions tirées au hasard et réparties par domaine, chronomètre de 2 h, aucune correction avant la fin, écran de vérification avant l'envoi.
- **Entraînement libre** : filtre par domaine, correction et explication après chaque réponse, série de bonnes réponses, reprise des questions ratées.
- **Application installable et hors ligne (PWA)** : s'installe sur l'écran d'accueil (Android, iPhone et iPad, ordinateur) et fonctionne sans connexion : examens, entraînement, leçons, tableau de bord. Une nouvelle version est annoncée par un bandeau « Mettre à jour » (jamais de rechargement imposé). Voir la section « Application installable » plus bas.
- **Leçon courte (≈ 5 minutes)** : une session de 10 questions, sans chrono, lancée en un clic depuis l'accueil (bouton principal du bandeau, ou à côté de la révision du jour). Elle mélange 40 % de questions **à réviser** (échéance arrivée), 30 % **à consolider** (dernière réponse fausse) et le reste de questions **nouvelles**, réparties entre les domaines. Les questions déjà répondues aujourd'hui sont écartées : « Encore une leçon » apporte toujours du neuf. Le bilan de fin donne le score, les XP et propose « Encore une leçon ». Pensée pour une seule main sur mobile (boutons d'action en bas de l'écran, cibles d'au moins 44 px).
- **Révision du jour** : les questions dont l'échéance de révision est arrivée (répétition espacée), les plus en retard d'abord, par séries plafonnées à l'objectif quotidien du profil. Proposée sur l'accueil et le tableau de bord ; l'écran de fin résume le planning (ce qui reste aujourd'hui, prochaine échéance) et propose « Encore une série ». Chaque réponse compte dans l'activité du jour.
- **Série de jours** : nombre de jours d'affilée où l'objectif quotidien du profil est atteint, affichée sur l'accueil (avec l'avancement du jour) et le tableau de bord. Un jour manqué est pardonné comme **jour de repos**, une fois par période de 7 jours : il ne compte pas mais ne casse pas la série. Aucune pénalité bloquante.
- **Points d'expérience (XP) et niveaux** : chaque bonne réponse rapporte de l'XP, avec des bonus pour une leçon parfaite et une révision terminée. Le niveau et la progression vers le suivant s'affichent sur le tableau de bord et le profil, le détail des XP gagnés dans la correction et le bilan de fin de session. Barème ci-dessous.
- **Résultats** : score global, performance par domaine, correction détaillée des erreurs.
- **Tableau de bord** : chiffres clés (examens passés, dernier score et tendance, questions maîtrisées, taux de réussite), courbe des 10 derniers examens avec seuil et objectif, activité des 14 derniers jours, tableau de maîtrise par domaine, questions à retravailler, historique complet.
- **Profil** : prénom et avatar, date d'examen (compte à rebours), score visé, objectif quotidien, thème (système, clair, sombre), export et import des données en JSON, réinitialisation de la progression.
- Marquage des questions à revoir, raccourcis clavier (A à E, Entrée, flèches).
- Progression et profil enregistrés dans le navigateur (`localStorage`), sans compte ni serveur.

> **Contributeurs et agents Claude** : lis [`ROADMAP.md`](ROADMAP.md) avant de commencer. Il indique ce qui est fait, ce qui reste, dans quel ordre, et les règles de travail.

## Application installable (PWA)

L'application est une PWA : manifeste (`manifest.webmanifest`), icônes (`icons/`) et service worker (`sw.js`). Elle doit être servie en **HTTPS** (GitHub Pages, Vercel…) ou sur `localhost` (`npm start`) : sans connexion sécurisée, ni installation ni mode hors ligne.

**Installer** : la carte « Installer l'application » du profil s'adapte à l'appareil.
- Chrome et Edge (Android, ordinateur) : bouton « Installer ».
- iPhone et iPad : depuis **Safari**, bouton Partager puis « Sur l'écran d'accueil » (iOS ne propose pas d'invite automatique ; la carte affiche les étapes).
- Autres navigateurs : menu du navigateur, « Installer l'application ».

**Hors ligne** : au premier chargement, le service worker télécharge tout le « shell » (page, styles, modules, questions, icônes) dans un cache. Ensuite l'application démarre et fonctionne sans réseau ; la progression est dans le navigateur (`localStorage`). Les polices Google ne sont gardées qu'après une première visite en ligne ; sans elles, la pile de polices retombe sur le système.

**Mises à jour** : le cache porte un numéro de version (empreinte du contenu des fichiers). Quand une nouvelle version est publiée, elle s'installe en arrière-plan puis un bandeau propose « Mettre à jour » ; la page se recharge **seulement** sur clic, et la session en cours (examen compris) est conservée. « Plus tard » ferme le bandeau ; la mise à jour est reproposée au prochain chargement. Une application laissée ouverte revérifie quand elle redevient visible.

> **Règle pour les contributeurs** : après toute modification d'un fichier de l'application (`index.html`, `styles.css`, `questions.js`, `js/**`, `icons/**`, `manifest.webmanifest`, `sw.js`), lance
> ```bash
> npm run build:pwa
> ```
> et ajoute `precache-manifest.js` au commit. Ce fichier généré contient la version du cache et la liste des fichiers précachés ; `npm test` et la CI échouent s'il est périmé (`npm run check-pwa`). Sans cela, les utilisateurs ne recevraient pas la nouvelle version. En cas de conflit sur ce fichier dans une fusion, régénère-le avec la même commande plutôt que de le fusionner à la main. Si tu ajoutes un module dans `js/`, il est repris automatiquement ; un test vérifie que tout fichier importé est bien précaché.

Les icônes PNG sont générées depuis `icons/icon.svg` et `icons/icon-maskable.svg` par `node scripts/make-icons.js` (Playwright requis, hors CI). Audit Lighthouse (catégorie PWA) : 100 %.

## Barème des points d'expérience

| Action | XP |
|---|---|
| Bonne réponse (en entraînement, en révision ou en examen) | **+10**, une seule fois par question et par jour |
| Leçon parfaite : session d'entraînement d'au moins 5 questions, toutes justes | **+20** |
| Révision du jour terminée : toutes les questions de la série validées | **+15** |
| Examen blanc | l'XP des bonnes réponses, sans bonus |

**Pas de gain en boucle** : une question ne rapporte de l'XP qu'**une fois par jour** (une erreur ne la « consomme » pas : la réussir ensuite rapporte). Les deux bonus exigent en plus qu'**au moins 5 questions de la session aient réellement rapporté de l'XP** : rejouer les mêmes questions le même jour ne donne donc rien, bonus compris. Le lendemain, elles rapportent à nouveau.

**Niveaux** : le niveau *n* commence à `50 × n × (n − 1)` XP : niveau 2 à 100 XP, 3 à 300, 4 à 600, 5 à 1 000, 10 à 4 500. Les valeurs sont dans `XP_RULES` (`js/config.js`) ; l'application affiche le barème dans la carte « Niveau » (« Comment gagner de l'XP ? »).

Les XP existants partent de zéro : la progression d'avant cette fonctionnalité n'est pas convertie. La réinitialisation de la progression remet aussi l'XP à zéro (le profil est conservé).

## Utilisation

L'application est composée de **modules ES** : les navigateurs les refusent quand on ouvre `index.html` en double-cliquant (`file://`). Il faut la servir en HTTP :

```bash
npm start
```

Puis ouvre <http://localhost:8080>. Cette commande lance `python3 -m http.server` ; n'importe quel serveur statique convient (`npx serve`, extension « Live Server » de VS Code…). Pour une version en ligne, active GitHub Pages sur la branche `main` (Settings > Pages) : aucun build n'est nécessaire.

## Ajouter des questions

Tout est dans le tableau `QUESTIONS` de `questions.js` :

```js
{
  id: "d3-17",            // identifiant unique, jamais réutilisé
  domain: 3,              // 1 à 5, voir DOMAINS
  topic: "gke",           // sujet : une clé de TOPICS
  difficulty: 2,          // 1 facile, 2 moyen, 3 difficile (échelle ci-dessous)
  doc: "https://docs.cloud.google.com/…",  // page de documentation officielle
  q: "Énoncé…",           // `entre backticks` = affiché en code
  options: ["…", "…"],    // 4 ou 5 options, mélangées à l'affichage
  correct: [0],           // un index = réponse unique, plusieurs = réponses multiples
  explain: "…"            // pourquoi c'est juste, pourquoi le reste est faux
}
```

Les poids des domaines sont dans `DOMAINS`, la taille de l'examen, la durée et le seuil dans `CONFIG`.

**Sujet (`topic`)** : une clé de l'objet `TOPICS` de `questions.js` (par ex. `iam`, `gke`, `storage`). Un sujet peut couvrir plusieurs domaines ; pour en créer un, déclare-le dans `TOPICS` (le validateur refuse les sujets inconnus). Ils serviront au parcours guidé et à l'adaptation de la difficulté.

**Difficulté (`difficulty`)** :

| Niveau | Critère |
|---|---|
| 1 facile | savoir direct : un service, une commande ou un outil ; options nettement distinctes |
| 2 moyen | scénario avec une contrainte principale ; choix entre services proches ou réglage précis |
| 3 difficile | plusieurs contraintes, piège ou subtilité de configuration |

Une question à réponses multiples est au moins de niveau 2. Vise un équilibre d'environ 1/3 par niveau.

**Documentation (`doc`)** : lien vers la page officielle qui justifie la réponse (`docs.cloud.google.com`, ou `kubernetes.io` pour les concepts Kubernetes). Il s'affiche sous l'explication (« Voir la documentation officielle »). Les anciennes adresses `cloud.google.com/…` redirigent vers `docs.cloud.google.com/…` : utilise l'adresse finale. Vérifie les liens (accès réseau nécessaire) :

```bash
npm run check-links
```

Il échoue si un lien ne répond pas et signale les redirections avec l'adresse à utiliser. Il n'est pas lancé en CI (dépend du réseau).

Après chaque ajout, lance les vérifications (Node 20+, aucune installation) :

```bash
npm test
```

Il vérifie notamment : ids uniques, index de `correct` valides, 4 ou 5 options sans doublon, explication présente, backticks fermés, pas de référence à une option par sa lettre, `topic` connu, `difficulty` de 1 à 3 (au moins 2 pour une réponse multiple), `doc` en https vers un hôte autorisé. Il signale aussi en avertissement les domaines trop peu fournis, le biais « la bonne réponse est la plus longue », les sujets sans question et une difficulté trop rare. Les règles sont dans `scripts/validation.js` (testées dans `tests/validation.test.js`). La même vérification tourne en CI (`.github/workflows/ci.yml`).

## Tests

`npm test` enchaîne les vérifications suivantes, sans aucune installation (Node 20+) :

1. `npm run validate` : validation de la banque de questions ;
2. `npm run check` : syntaxe des modules de `js/` et import Node des modules purs ;
3. `npm run check-pwa` : le précache de la PWA est à jour (sinon `npm run build:pwa`) ;
4. `npm run test:unit` : tests unitaires (`node --test`, runner intégré à Node) des dossiers `tests/`.

Les tests couvrent la logique pure (`js/utils.js`, `js/logic.js`, `js/srs.js`, `js/streak.js`, `js/xp.js`, `js/lesson.js`, `js/backup.js`) et le stockage (`js/storage.js`) : tirage de l'examen par domaine, correction et scoring, validation du profil, compte à rebours, statistiques du tableau de bord, planning de répétition espacée, migration des données, export et import, migration de version. `tests/helpers.js` fournit un tirage aléatoire reproductible (`seedRandom`) et une horloge figée (`freezeDate`) ; copie ce modèle pour tester les prochaines fonctions pures (badges…).

Un nouveau fichier `tests/*.test.js` est découvert automatiquement. Une logique qui touche au DOM doit d'abord être extraite dans un module pur de `js/` pour rester testable.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Squelette de la page, charge `js/main.js` ; balises PWA (manifeste, icônes, thème, iOS) |
| `manifest.webmanifest`, `icons/` | Manifeste de l'application et icônes (PNG, SVG, maskable, iOS) |
| `sw.js` | Service worker : précache du shell, hors ligne, mise à jour sur demande |
| `precache-manifest.js` | **Généré** (`npm run build:pwa`) : version du cache et fichiers précachés |
| `styles.css` | Styles |
| `questions.js` | Domaines (`DOMAINS`), sujets (`TOPICS`) et banque de questions (`QUESTIONS`), module ES |
| `js/main.js` | Point d'entrée : branche les écouteurs et affiche la première vue |
| `js/config.js` | Réglages (`CONFIG`), clés de stockage, `STORAGE_VERSION`, profil par défaut |
| `js/data.js` | Accès à la banque de questions (`DOMAINS`, `TOPICS`, `QUESTIONS`, `Q_BY_ID`) |
| `js/utils.js` | Utilitaires purs (échappement, mélange, chrono, pourcentages…) |
| `js/logic.js` | **Logique métier pure** : tirage de l'examen, correction, calcul des résultats, statistiques du tableau de bord, validation du profil |
| `js/storage.js` | Accès à `localStorage` (tolérant à son absence) et migration de version |
| `js/pwa.js`, `js/install.js` | Enregistrement du service worker, bandeau de mise à jour, invite d'installation ; `install.js` (pur) choisit le message d'installation |
| `js/lesson.js` | **Leçon courte** pure : `pickLesson` (mélange de questions à réviser, à consolider et nouvelles) |
| `js/srs.js` | **Répétition espacée** pure : planning de révision par question (`reviewCard`, `isDue`, migration des anciennes données) |
| `js/streak.js` | **Série de jours** pure : `dayStreak` (série et jour de repos), `addActivity`, textes d'affichage |
| `js/xp.js` | **XP et niveaux** purs : `levelFor`, `awardAnswer` (une fois par question et par jour), `sessionBonuses`, `settleSessionXp` |
| `js/backup.js` | Format et validation de l'export/import JSON (pur) |
| `js/state.js` | État partagé (`state`), statistiques, activité, profil, thème |
| `js/session.js` | Cycle de vie d'une session : chargement, sauvegarde, chrono, démarrage, fin |
| `js/router.js` | Navigation entre vues |
| `js/actions.js`, `js/events.js` | Actions `data-action` et écouteurs globaux (clic, clavier, formulaires) |
| `js/data-io.js` | Export et import JSON : lecture et écriture du fichier, messages (le format est dans `backup.js`) |
| `js/views/` | Une vue par fichier : `home`, `quiz` (questions et vérification), `results`, `dashboard`, `profile`, `shared` (barre de navigation) |
| `js/ui/` | `icons` (SVG), `dialog` (dialogue et message furtif), `effects` (confettis, ondes, compteur) |
| `scripts/validate-questions.js` | Lance le validateur de la banque et affiche le rapport |
| `scripts/validation.js` | Règles de validation (fonction pure `validateBank`) |
| `scripts/pwa.js`, `scripts/build-pwa.js` | Liste des fichiers précachés et version du cache ; génération et contrôle de `precache-manifest.js` |
| `scripts/make-icons.js` | Génère les icônes PNG (Playwright, hors CI) |
| `scripts/check-links.js` | Vérifie que les liens `doc` répondent (`npm run check-links`, réseau) |
| `scripts/check-modules.js` | Vérifie la syntaxe des modules et que les modules purs s'importent depuis Node |
| `tests/` | Tests unitaires (`*.test.js`) et aides (`helpers.js`) |

**Règle d'architecture** : `config`, `data`, `utils`, `logic`, `srs`, `streak`, `xp`, `lesson`, `install` et `backup` ne touchent ni au DOM ni à l'état global ; ils restent importables et testables depuis Node. L'état modifiable vit uniquement dans `state` (`js/state.js`) ; les vues le lisent, les actions le modifient.

Les données sauvegardées dans le navigateur sont versionnées (`STORAGE_VERSION` dans `js/config.js`) : incrémente-le si le format d'une session change, les anciennes données seront purgées (le profil est conservé). Clés utilisées : sessions (`ace.session.*`), historique des examens (`ace.history`, 20 maximum), carte de révision par question (`ace.stats`), activité par jour (`ace.activity`, avec l'objectif du jour), profil (`ace.profile`), points d'expérience (`ace.xp`).

**Points d'expérience** : `ace.xp` = `{ total, day, ids }` (`ids` = questions déjà récompensées le jour `day`, pour l'anti-boucle). Chaque session garde son bilan (`session.xp`) pour l'afficher à la fin ; les sessions sauvegardées avant l'XP n'en ont pas et sont tolérées. L'export et l'import conservent `xp` (y compris les questions du jour, donc réimporter ne permet pas de regagner l'XP du jour).

**Série de jours** : elle n'est pas stockée, elle se déduit de `ace.activity` (`{ "AAAA-MM-JJ": { n, ok, goal } }`, où `goal` est l'objectif quotidien en vigueur ce jour-là, enregistré à chaque réponse), donc elle est exportée et importée avec l'activité. Un jour compte quand `n >= goal` ; changer l'objectif ne réécrit donc pas le passé, et aujourd'hui est jugé sur l'objectif actuel. Les données d'avant cette règle (sans `goal`) comptent dès 1 réponse. Les jours sont des dates locales ; les changements d'heure n'ont pas d'effet. Les règles complètes sont en tête de `js/streak.js`.

**Répétition espacée** : chaque question répondue a une carte `{ n, ok, ease, interval, reps, due, last, hist }` dans `ace.stats` (détail et règles en tête de `js/srs.js`). `n` et `ok` (nombre de réponses, dernier résultat) existaient avant : le tableau de bord et l'accueil les lisent toujours. Le planning suit une variante de SM-2 adaptée à une réponse juste/fausse : erreur = revue le lendemain avec une facilité réduite ; réussites à l'échéance = intervalles 1 jour, 6 jours, puis × facilité (plafonné à 180 jours) ; réussite avant l'échéance = comptée mais sans avancer le planning. Chaque réponse validée (entraînement ou révision du jour) ou question d'un examen terminé met la carte à jour via `record()` (`js/state.js`). Les sessions d'entraînement portent un `kind` : `"review"` pour la révision du jour (`startReview()` dans `js/session.js`), `"lesson"` pour la leçon courte (`startLesson()`), absent pour l'entraînement libre. Les intitulés sont centralisés dans `sessionTitle` et `resumeLabel` (`js/logic.js`). La révision du jour est donc une session d'entraînement ; la sélection des questions est dans `js/srs.js` (`dueIds`, `pickReview`, `nextReview`, `reviewPlan`). Les anciennes entrées `{ n, ok }` sont migrées au chargement et à l'import (juste = à revoir demain, fausse = à revoir aujourd'hui) et réécrites aussitôt, sans changer `STORAGE_VERSION` (son incrément purgerait la progression). L'export JSON contient le planning, et l'import le restitue.

## Limites connues

- La banque compte 64 questions : deux examens blancs successifs en partagent la plupart.
- Les domaines suivent l'ancien découpage en 5 sections ; le guide officiel actuel en compte 4 et ajoute des objectifs sur l'outillage Gemini, non couverts ici.
