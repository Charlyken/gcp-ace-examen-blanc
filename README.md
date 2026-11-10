# Examen blanc GCP ACE

Plateforme d'entraînement **non officielle** pour la certification Google Cloud Associate Cloud Engineer. Une seule page HTML/CSS/JS, sans backend ni dépendance à installer.

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

Tout est dans le tableau `QUESTIONS` du premier bloc `<script>` de `index.html` :

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

## Limites connues

- La banque compte 64 questions : deux examens blancs successifs en partagent la plupart.
- Les domaines suivent l'ancien découpage en 5 sections ; le guide officiel actuel en compte 4 et ajoute des objectifs sur l'outillage Gemini, non couverts ici.
