/* Installation de l'application (PWA) : quel message afficher ? Logique pure (aucun DOM).

   env = { standalone, canPrompt, ios, secure }
     standalone  l'application tourne déjà installée (mode « application », sans barre d'adresse)
     canPrompt   le navigateur a proposé l'installation (événement beforeinstallprompt, Chrome et Edge sur Android et ordinateur)
     ios         iPhone ou iPad : pas d'invite, l'installation passe par le menu Partager de Safari
     secure      page servie en HTTPS (ou localhost) : sans cela, ni service worker ni installation
   Renvoie : "installed" | "prompt" | "ios" | "manual" | "unavailable". */
export function installMode({ standalone, canPrompt, ios, secure }) {
  if (standalone) return "installed";
  if (!secure) return "unavailable";
  if (canPrompt) return "prompt";
  if (ios) return "ios";
  return "manual";
}

// iPhone, iPad (y compris iPadOS qui se présente comme un Mac tactile).
export const isIOS = (userAgent = "", platform = "", touchPoints = 0) =>
  /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && touchPoints > 1);

// Textes de la carte « Installer l'application » : { title, text, steps, button }.
export function installText(mode, offlineReady) {
  const offline = offlineReady ? "Elle fonctionne hors ligne." : "Le mode hors ligne sera disponible après le premier chargement complet.";
  switch (mode) {
    case "installed": return { title: "Application installée", text: `Tu utilises la version installée. ${offline}`, steps: [], button: "" };
    case "prompt": return { title: "Installer l'application", text: `Ajoute-la à ton écran d'accueil pour la lancer comme une application. ${offline}`, steps: [], button: "Installer" };
    case "ios": return {
      title: "Installer l'application",
      text: `Sur iPhone et iPad, l'installation se fait depuis Safari. ${offline}`,
      steps: ["Touche le bouton Partager (le carré avec une flèche vers le haut).", "Choisis « Sur l'écran d'accueil ».", "Valide avec « Ajouter »."], button: ""
    };
    case "manual": return {
      title: "Installer l'application",
      text: `Ouvre le menu de ton navigateur et choisis « Installer l'application » (ou « Ajouter à l'écran d'accueil »). ${offline}`, steps: [], button: ""
    };
    default: return { title: "Installation indisponible", text: "L'installation et le mode hors ligne demandent une connexion sécurisée (HTTPS).", steps: [], button: "" };
  }
}
