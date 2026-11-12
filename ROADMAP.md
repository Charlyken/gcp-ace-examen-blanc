# Feuille de route et suivi

Document de coordination pour toute personne ou tout agent Claude qui travaille sur ce projet. **Lis-le en entier avant de commencer, et mets-le à jour à la fin de ton travail.**

- Dépôt : `Charlyken/gcp-ace-examen-blanc`
- Objectif produit : amener la plateforme au niveau des meilleures applications d'apprentissage (type Duolingo) : contenu riche, révision espacée, habitude quotidienne, expérience mobile soignée. L'objectif de l'utilisateur reste de **réussir la certification GCP Associate Cloud Engineer**.
- Source de vérité des tâches : les **issues GitHub** (liens ci-dessous). Ce fichier en est le résumé ordonné.
- Dernière mise à jour : 2026-11-10

## 1. Ce qui est déjà fait

Application statique HTML/CSS/JS, sans backend, données dans `localStorage`. Voir `README.md` pour le détail.

- [x] Examen blanc de 50 questions réparties par domaine, chrono de 2 h, écran de vérification
- [x] Entraînement libre : filtre par domaine, correction immédiate, série de bonnes réponses, reprise des erreurs
- [x] Résultats : score global, performance par domaine, correction détaillée
- [x] Tableau de bord : chiffres clés, courbe des 10 derniers examens, activité sur 14 jours, maîtrise par domaine, historique
- [x] Profil : prénom, avatar, date d'examen, score visé, objectif quotidien, thème, export/import JSON, réinitialisation
- [x] Banque de **64 questions** + validateur `npm test` + CI GitHub Actions
- [x] Découpage en fichiers (`index.html`, `styles.css`, `questions.js` et, depuis #31, les modules de `js/`), UX mobile, contraste

**Aucun ticket de la feuille de route ci-dessous n'est encore commencé.**

## 2. Ce qu'il reste à faire, dans l'ordre

Cocher la case et ajouter le numéro de PR quand un ticket est **terminé et fusionné**. Priorités : P1 > P2 > P3.

Épopées (tickets parents) : [#4 Contenu](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/4) · [#5 Apprentissage](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/5) · [#6 Motivation](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/6) · [#7 Expérience produit](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/7) · [#8 Technique](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/8) · [#9 Social](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/9)

### Vague 0 : fondations
Avant tout le reste : `app.js` (~70 Ko) est touché par presque tous les tickets, le découper évite conflits et régressions.

- [x] [#31](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/31) P2 Découper `app.js` en modules ES. *Fait (PR à venir). L'application doit désormais être servie en HTTP (`npm start`)*
- [x] [#32](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/32) P2 Tests unitaires de la logique (`node:test`). *Fait (PR à venir) : scoring, tirage par domaine, profil, compte à rebours, tableau de bord, stockage. Les tests de la répétition espacée et de la série sont à ajouter avec #14 et #21*

### Vague 1 : cœur de la valeur
- [x] [#11](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/11) P1 Métadonnées des questions (`topic`, `difficulty`, `doc`). *Fait (PR à venir). Débloque #17, #18, #19*
- [x] [#14](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/14) P1 Répétition espacée : modèle de données. *Fait (PR #42)*
- [x] [#15](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/15) P1 « Révision du jour ». *Fait (PR #43)*
- [ ] [#10](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/10) P1 Banque à 200 questions. *Peut avancer en parallèle de #14 et #15*

### Vague 2 : habitude quotidienne
- [x] [#21](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/21) P2 Série de jours et jour de repos. *Fait (PR #44)*
- [x] [#22](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/22) P2 XP et niveaux. *Fait (PR #45)*
- [x] [#16](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/16) P2 Mode « leçon courte » de 5 minutes. *Fait (PR #46)*

### Vague 3 : accès et première impression
- [x] [#26](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/26) P2 PWA installable et hors ligne. *Fait (PR à venir)*
- [ ] [#28](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/28) P2 Onboarding avec test de niveau
- [ ] [#27](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/27) P2 Accessibilité WCAG 2.1 AA. *À faire quand les écrans principaux sont stabilisés*

### Vague 4 : profondeur pédagogique
- [ ] [#12](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/12) P2 Nouveaux formats de questions
- [ ] [#18](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/18) P2 Adaptation de la difficulté. *Dépend de #11*
- [ ] [#17](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/17) P2 Parcours guidé (arbre de compétences). *Dépend de #11 et #10, idéalement après #12*
- [ ] [#23](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/23) P3 Badges. *Dépend de #21, #22*
- [ ] [#24](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/24) P3 Retours émotionnels (animations, sons)
- [ ] [#25](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/25) P3 Rappels quotidiens. *Dépend de #21, #26*
- [ ] [#19](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/19) P3 Micro-leçons et fiches mémo
- [ ] [#30](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/30) P3 Recherche et notes personnelles
- [ ] [#20](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/20) P3 Saisie de commande gcloud. *Dépend du type `fill` de #12*

### Vague 5 : passage à l'échelle
- [ ] [#13](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/13) P3 Banque à 400+ questions. *Tâche de fond, à faire tout au long du projet*
- [ ] [#33](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/33) P3 Tests E2E Playwright
- [ ] [#34](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/34) P3 Analytics respectueux de la vie privée
- [ ] [#29](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/29) P3 Internationalisation FR/EN. *Quand les textes sont stabilisés*
- [ ] [#35](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/35) P3 Backend : comptes et synchronisation. **Décision utilisateur requise** (Firebase ou Supabase, coût)
- [ ] [#36](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/36) P3 Classement et ligues. *Dépend de #35, #22*
- [ ] [#37](https://github.com/Charlyken/gcp-ace-examen-blanc/issues/37) P3 Défis hebdomadaires. *Dépend de #35*

### Pourquoi cet ordre
- Pas de contenu massif avant les métadonnées et le moteur de révision : sans eux, plus de questions n'améliorent pas l'efficacité.
- Pas de gamification (série, badges) avant la répétition espacée : on motiverait à revenir sans mieux faire apprendre.
- Le social est dernier : il dépend d'un backend et n'aide pas un apprenant seul. Ne pas l'entamer sans validation de l'utilisateur.

## 3. Règles de travail pour les agents

1. **Prends un ticket à la fois**, dans l'ordre ci-dessus. Respecte les dépendances. Avant de commencer, vérifie sur GitHub que le ticket n'est pas déjà pris (assigné, PR ouverte ou commentaire).
2. **Une branche et une PR par ticket**. Ne pousse jamais sur `main` directement. Ne crée une PR que si l'utilisateur le demande.
3. **Avant de pousser** : `npm test` doit être au vert (validation des questions, syntaxe des modules, import Node des modules purs ; la CI lance les deux étapes). **Si tu as modifié un fichier de l'application (`index.html`, `styles.css`, `questions.js`, `js/**`, `icons/**`, `sw.js`, `manifest.webmanifest`), lance `npm run build:pwa` et commite `precache-manifest.js`** : sinon `npm test` et la CI échouent (`npm run check-pwa`) et les utilisateurs ne recevraient pas la mise à jour.
4. **Si tu ajoutes des questions** : respecte le format décrit dans `README.md` (ids uniques jamais réutilisés, 4 ou 5 options, explication, pas de copie de l'examen officiel).
5. **Si tu changes le format des données sauvegardées** : incrémente `STORAGE_VERSION` dans `js/config.js` ou écris une migration. Les anciennes données de l'utilisateur ne doivent pas être perdues (le profil est conservé). Ajoute toute nouvelle donnée à l'export/import JSON.
6. **Pas de dépendance ni de build sans raison** : l'application est servie telle quelle, sans build (`npm start`, ou GitHub Pages). Depuis #31 elle utilise des modules ES : le double-clic sur `index.html` ne fonctionne plus dans Chrome/Edge. Si un ticket impose d'ajouter une étape de build ou une dépendance, le dire explicitement dans la PR.
7. **Mobile d'abord** : tout nouvel écran doit fonctionner sur petit écran et au clavier.
8. **À la fin de ton travail** :
   - coche le ticket dans ce fichier (avec le numéro de PR), mets à jour la date en haut ;
   - mets à jour `README.md` si les fonctionnalités, la structure ou les clés de stockage changent ;
   - ferme ou commente le ticket GitHub ;
   - note ci-dessous les décisions ou pièges utiles aux suivants.
9. **Priorités et labels** : les labels `P1/P2/P3` n'existent pas dans le dépôt. La priorité est écrite dans le titre des tickets (`[P1]`…).

## 4. Journal des décisions et notes

Ajouter une ligne par entrée, la plus récente en haut : `date : ticket : note`.

- 2026-11-12 : #26 : PWA installable et hors ligne. Fichiers : `manifest.webmanifest`, `icons/` (SVG + PNG 192/512, maskable 512, iOS 180), `sw.js`, `precache-manifest.js` (GÉNÉRÉ), `js/pwa.js`, `js/install.js` (pur), `scripts/pwa.js` + `scripts/build-pwa.js`. **Règle ajoutée pour tous les agents** : après toute modification d'un fichier de l'application, `npm run build:pwa` puis commiter `precache-manifest.js` (`npm test` et la CI échouent sinon). Choix : (1) cache versionné par une empreinte SHA-256 du contenu des fichiers précachés et de `sw.js`, générée par script et vérifiée en CI, plutôt qu'un numéro de version à bumper à la main (oubli certain) ; (2) liste des fichiers dans un fichier généré séparé (`precache-manifest.js`, importé par `sw.js`) pour isoler les conflits de fusion : en cas de conflit, le régénérer au lieu de le fusionner ; (3) pas de `skipWaiting` automatique : la nouvelle version attend, un bandeau propose « Mettre à jour » et la page ne se recharge que sur clic (`controllerchange` ne recharge que si l'utilisateur l'a demandé, sinon l'installation initiale rechargerait la page) ; la session en cours est déjà sauvegardée (`save()`), l'examen est repris ; (4) `register("sw.js", { updateViaCache: "none" })` et précache avec `cache: "reload"` pour contourner le cache HTTP (GitHub Pages met 10 minutes) ; (5) chemins relatifs partout (`start_url: "./"`, `self.registration.scope`) : l'application peut vivre dans un sous-dossier (GitHub Pages) ; (6) polices Google : stale-while-revalidate, disponibles hors ligne seulement après une visite en ligne (on ne les auto-héberge pas, à reconsidérer si le premier lancement hors ligne compte). Vérifié dans Chrome (Playwright) : installation sans rechargement parasite, examen, leçon, tableau de bord et profil hors ligne, flux de mise à jour complet (bandeau, « Plus tard », reproposition, activation, ancien cache supprimé, progression et examen en cours conservés), `Page.getInstallabilityErrors` vide, manifeste sans erreur, Lighthouse 11 catégorie PWA = 100 %. Non testé : installation réelle sur un iPhone ou un téléphone Android (seules l'émulation iPhone et les vérifications Chrome l'ont été) ; sur iOS l'invite automatique n'existe pas, la carte du profil affiche les étapes Partager → Sur l'écran d'accueil. Les scripts Playwright de vérification ne sont pas dans le dépôt (#33 pourra les reprendre). Idée pour plus tard : indicateur « hors ligne » dans l'en-tête.
- 2026-11-10 : #16 : leçon courte dans `js/lesson.js` (pur, 247 tests au total). Session d'entraînement `kind: "lesson"` de `LESSON.size` = 10 questions (≈ 5 min), sans chrono, démarrée par `startLesson()`. Composition (`LESSON` dans `js/config.js`) : 40 % à réviser (échéance arrivée, plus en retard d'abord), 30 % à consolider (dernière réponse fausse, facilité basse puis plus essayées d'abord), reste de nouvelles entrelacées par domaine ; ordre final mélangé. Une question à la fois en retard et ratée compte d'abord comme à réviser, puis déborde dans « à consolider ». Complément quand une catégorie manque : nouvelles, à consolider, à réviser, maîtrisées (échéance la plus proche), puis, en dernier recours, questions déjà répondues aujourd'hui. **Les questions déjà répondues aujourd'hui sont écartées** (`card.last === today`) pour que « Encore une leçon » apporte du neuf (6 leçons enchaînées = 60 questions différentes, testé). Accueil : le bouton principal du bandeau est maintenant reprendre > révision du jour > leçon courte ; « Revoir mes erreurs » et l'examen restent accessibles dans leurs cartes (ils ne sont plus l'action du bandeau). Quand la révision du jour est proposée, « Leçon courte » s'affiche à côté ; jamais à côté d'un « Reprendre » (elle remplacerait la session en cours). Le bonus « leçon parfaite » (#22) s'applique tel quel. Résultats : pour les séries (leçon, révision), plus de pastille « Au-dessus/Sous le seuil de 70 % » (propre à l'examen), remplacée par « Très bien » / « À consolider » ; titres « Révision terminée » / « Leçon terminée ». Intitulés centralisés : `sessionTitle` et `resumeLabel` (`js/logic.js`). Vérifié sur mobile tactile : boutons d'action dans le tiers bas de l'écran, cibles ≥ 44 px, réponse validée au toucher seul. Limite : la composition 40/30/30 est un choix arbitraire, à ajuster dans `LESSON` après usage réel ; l'adaptation par domaine faible viendra avec #18.
- 2026-11-10 : #22 : XP et niveaux dans `js/xp.js` (pur, 221 tests au total). Barème dans le README et dans l'application (`XP_RULES`, `js/config.js`) : +10 par bonne réponse, +20 leçon parfaite (≥ 5 questions, toutes justes), +15 révision du jour terminée ; examen : XP des réponses sans bonus. **Anti-boucle** : une question ne rapporte qu'une fois par jour (`state.xp = { total, day, ids }`, `ids` repart de zéro chaque jour ; une erreur ne consomme pas la question) et les bonus exigent ≥ 5 questions ayant rapporté de l'XP. Niveaux : le niveau n commence à 50·n·(n−1) XP ; la formule est exacte sans correction d'arrondi (testée à chaque frontière jusqu'au plafond `XP_MAX`). `start`/`end` sont mémorisés dans `session.xp` pour afficher « Niveau supérieur ! » dans le bilan. Les XP partent de 0 (la progression passée n'est pas convertie) ; la réinitialisation les remet à 0 ; `STORAGE_VERSION` n'est pas incrémenté. Les sessions d'avant #22 n'ont pas de `session.xp` : `ensureXp` les tolère. À réutiliser : #16 (le bonus « leçon parfaite » s'applique déjà à toute session d'entraînement de ≥ 5 questions), #23 (badges : niveau, XP), #36 (classement hebdomadaire : demandera un historique d'XP par jour, aujourd'hui absent).
- 2026-11-10 : #21 : série de jours dans `js/streak.js` (pur, 179 tests au total). Changement de comportement : l'ancienne série du tableau de bord comptait les jours avec au moins 1 réponse ; la nouvelle compte les jours où l'**objectif quotidien** est atteint (le ticket le demandait). Pour ne pas réécrire le passé quand l'utilisateur change son objectif, `record()` enregistre l'objectif du jour dans `ace.activity` (`goal`, via `addActivity`) ; une donnée sans `goal` (avant #21) compte dès 1 réponse ; aujourd'hui est jugé sur l'objectif actuel du profil. Jour de repos : un jour manqué est pardonné s'il n'y en a pas d'autre dans les 6 jours qui l'entourent (un par période de 7 jours), il ne compte pas dans la série, deux jours manqués de suite la cassent ; tout se déduit de l'activité, rien n'est stocké (donc exporté avec l'activité, `backup.js` conserve `goal`). Aujourd'hui non atteint ne casse pas la série. `dashData` ne renvoie plus `streak` : utiliser `dayStreak(state.activity, dayKey(), state.profile.daily)` (ou `currentStreak()` dans `js/views/shared.js`). L'accueil a une carte « série » (avec l'objectif du jour) à côté de la « révision du jour » ; le tableau de bord affiche le nombre de jours (en alerte si la série est à risque) et la phrase sur le repos. Réutilisable pour #22 (XP), #23 (badges : séries de 7 jours) et #25 (rappel quand `atRisk`). Pas encore de « meilleure série » ; à calculer dans `streak.js` si #23 en a besoin.
- 2026-11-10 : #15 : « Révision du jour ». Choix : une révision est une session d'entraînement avec `kind: "review"` (pas un nouveau mode), ce qui réutilise validation, correction et mise à jour du planning ; elle remplace une session d'entraînement en cours, comme « Revoir mes erreurs » (pas de confirmation). Sélection pure dans `js/srs.js` : `dueIds` (échéance atteinte, plus en retard d'abord, puis facilité basse, puis id), `pickReview` (plafonnée par `profile.daily`), `nextReview`, `reviewPlan` ; les questions absentes de la banque sont ignorées. Les questions de la série sont mélangées (la priorité ne sert qu'à choisir lesquelles entrent dans la série). Un compteur d'activité est incrémenté à chaque validation (via `record`). La section est le même composant sur l'accueil et le tableau de bord (`reviewSectionHTML` dans `js/views/shared.js`), avec trois états : série en cours, questions à réviser, rien à réviser (prochaine échéance ou message pour un nouvel utilisateur). L'écran de résultats d'une révision ajoute le « Planning de révision » et « Encore une série (N) ». Limite connue : l'écran de résultats affiche toujours « Sous/Au-dessus du seuil de 70 % », peu pertinent pour une série de révision courte ; à reconsidérer avec #16 (leçon courte). Les nouvelles questions (jamais vues) ne sont pas proposées ici : elles relèvent de l'entraînement libre ou, plus tard, de la leçon courte (#16) qui mélangera dues, faibles et nouvelles.
- 2026-11-10 : #14 : modèle de répétition espacée dans `js/srs.js` (pur, 118 tests au total). Une carte par question dans `ace.stats` : `{ n, ok, ease, interval, reps, due, last, hist }`. Les champs `n` et `ok` sont conservés tels quels, donc aucun lecteur existant (accueil, tableau de bord, « revoir mes erreurs ») n'a changé. Choix : SM-2 simplifié pour une réponse juste/fausse ; une réussite avant l'échéance ne fait pas avancer le planning (pas d'intervalle gagné en révisant trop tôt) ; deux erreurs le même jour ne pénalisent la facilité qu'une fois ; une erreur = revue le lendemain. `STORAGE_VERSION` n'est PAS incrémenté (il purgerait la progression) : les anciennes entrées `{ n, ok }` sont migrées par `normalizeStats` au chargement puis réécrites tout de suite, ce qui fige leur date de départ (juste = à revoir demain, fausse = à revoir aujourd'hui). L'export/import passe par `js/backup.js` (pur, testé par aller-retour) ; l'import écarte les questions absentes de la banque. Paramètres dans `SRS` (`js/config.js`). Pour #15 : `isDue(card, today)` existe, mais pas encore de fonction qui liste les questions à réviser triées par retard ; c'est à écrire dans `js/srs.js` avec ses tests. Aucune interface n'affiche encore le planning.
- 2026-11-10 : #11 : les 64 questions portent `topic` (22 sujets dans `TOPICS`, `questions.js`), `difficulty` (1 à 3, échelle documentée en tête de `questions.js` et dans le README ; répartition 21/30/13) et `doc`. Les 64 liens ont été vérifiés (HTTP 200, page visée). `cloud.google.com/docs/…` redirige désormais vers `docs.cloud.google.com/…` : on stocke l'adresse finale. Deux pièges rencontrés : la page Spanner `…/spanner/docs/overview` redirige vers une page marketing (on utilise `…/spanner/docs/instances`) et la page GKE `updating-apps` est archivée (on utilise la page Kubernetes `deployment` pour `kubectl rollout undo`). Règles dans `scripts/validation.js` (fonction pure, 17 tests), liens vérifiables avec `npm run check-links` (réseau, hors CI). Toute nouvelle question doit fournir ces trois champs, sinon `npm test` échoue. Le lien s'affiche sous l'explication (entraînement et correction). Les sujets et la difficulté ne sont pas encore affichés : ils serviront à #17 et #18.
- 2026-11-10 : #32 : 57 tests unitaires avec `node:test` (`npm run test:unit`, inclus dans `npm test` et la CI), dossier `tests/`. Aucune dépendance. Vérifiés par mutation (13 modifications volontaires du code, 11 détectées d'emblée, 1 lacune comblée, 1 mutation équivalente ignorée). Convention : un module pur de `js/` par fichier de test ; `tests/helpers.js` fournit `seedRandom` et `freezeDate`. Piège : avec Node 22, `node --test tests/` (dossier en argument) échoue, utiliser `node --test` sans argument. Les futurs tickets qui ajoutent de la logique pure (#14, #21, #22, #18…) doivent livrer leurs tests.
- 2026-11-10 : #31 : découpage de `app.js` en modules ES (`js/`). Décision de l'utilisateur : vrais modules ES (import/export) plutôt que scripts classiques, au prix de ne plus pouvoir ouvrir `index.html` en double-cliquant ; servir en HTTP (`npm start`). `package.json` passe en `"type": "module"` (`questions.js` et le validateur sont aussi des modules ES). Règle : `config`, `data`, `utils`, `logic` restent purs (sans DOM ni `state`) pour être testables depuis Node (ticket #32). État mutable uniquement dans `state` (`js/state.js`). Le découpage a été vérifié par un scénario Playwright jouant profil, entraînement, examen, import/export et reprise, comparé à l'ancien `app.js` : 55 instantanés du DOM et de `localStorage` identiques (à l'indentation près). Ce scénario n'est pas dans le dépôt ; il sera repris par #33.
- 2026-11-10 : feuille de route créée à partir de l'analyse initiale.

## 5. Questions ouvertes (réponse de l'utilisateur nécessaire)

- Backend (#35) : Firebase ou Supabase ? À trancher avant d'entamer #35, #36, #37.
- Hébergement : activer GitHub Pages sur `main` pour la version en ligne ? (nécessaire pour tester la PWA #26 sur mobile)
