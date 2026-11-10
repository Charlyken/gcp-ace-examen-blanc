# Examen blanc GCP ACE

Plateforme d'entraînement **non officielle** pour la certification Google Cloud Associate Cloud Engineer. Application statique HTML/CSS/JS, sans backend ni dépendance à installer.

> Outil personnel, sans lien avec Google. Les questions sont originales et ne proviennent pas de l'examen officiel. Le seuil de 70 % est indicatif : Google ne publie pas la note de passage.

## Fonctionnalités

- **Examen blanc** : 50 questions tirées au hasard et réparties par domaine, chronomètre de 2 h, aucune correction avant la fin, écran de vérification avant l'envoi.
- **Entraînement libre** : filtre par domaine, correction et explication après chaque réponse, série de bonnes réponses, reprise des questions ratées.
- **Résultats** : score global, performance par domaine, correction détaillée des erreurs.
- Marquage des questions à revoir, raccourcis clavier (A à E, Entrée, flèches), thème clair et sombre.
- Progression enregistrée dans le navigateur (`localStorage`), sans compte.

## Utilisation

Ouvre `index.html` dans un navigateur. Pour une version en ligne, active GitHub Pages sur la branche `main` (Settings > Pages).

## Ajouter des questions

Tout est dans le tableau `QUESTIONS` de `questions.js` :

```js
{
  id: "d3-17",            // identifiant unique, jamais réutilisé
  domain: 3,              // 1 à 5, voir DOMAINS
  q: "Énoncé…",           // `entre backticks` = affiché en code
  options: ["…", "…"],    // 4 ou 5 options, mélangées à l'affichage
  correct: [0],           // un index = réponse unique, plusieurs = réponses multiples
  explain: "…"            // pourquoi c'est juste, pourquoi le reste est faux
}
```

Les poids des domaines sont dans `DOMAINS`, la taille de l'examen, la durée et le seuil dans `CONFIG`.

Après chaque ajout, lance le validateur (Node 18+, aucune installation) :

```bash
npm test
```

Il vérifie notamment : ids uniques, index de `correct` valides, 4 ou 5 options sans doublon, explication présente, backticks fermés, pas de référence à une option par sa lettre. Il signale aussi en avertissement les domaines trop peu fournis et le biais « la bonne réponse est la plus longue ». La même vérification tourne en CI (`.github/workflows/ci.yml`).

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Squelette de la page |
| `styles.css` | Styles |
| `questions.js` | Domaines (`DOMAINS`) et banque de questions (`QUESTIONS`) |
| `app.js` | Logique d'examen, rendu, sauvegarde locale |
| `scripts/validate-questions.js` | Validateur de la banque |

Les données sauvegardées dans le navigateur sont versionnées (`STORAGE_VERSION` dans `app.js`) : incrémente-le si le format d'une session change, les anciennes données seront purgées.

## Limites connues

- La banque compte 64 questions : deux examens blancs successifs en partagent la plupart.
- Les domaines suivent l'ancien découpage en 5 sections ; le guide officiel actuel en compte 4 et ajoute des objectifs sur l'outillage Gemini, non couverts ici.
