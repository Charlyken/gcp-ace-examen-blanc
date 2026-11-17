/* Banque de questions — le seul fichier à éditer pour ajouter du contenu.
Format d'une question :
  {
    id: "d3-17",              // identifiant UNIQUE (ne jamais réutiliser un id)
    domain: 3,                // 1 à 5, voir DOMAINS ci-dessous
    topic: "gke",             // sujet : une clé de TOPICS ci-dessous
    difficulty: 2,            // 1 = facile, 2 = moyen, 3 = difficile (voir l'échelle ci-dessous)
    doc: "https://docs.cloud.google.com/…",  // page de documentation officielle qui justifie la réponse
    q: "Énoncé…",             // texte ; `entre backticks` = affiché en code
    options: ["…", "…"],      // 4 ou 5 options (elles sont mélangées à l'affichage)
    correct: [0],             // index (base 0) de la ou des bonnes réponses
                              //   1 index  -> réponse unique (boutons radio)
                              //   2+ index -> réponses multiples (cases à cocher)
    explain: "…"              // explication : pourquoi c'est juste, pourquoi le reste est faux
  }
Échelle de difficulté :
  1  facile     savoir direct : un service, une commande ou un outil ; les options sont nettement distinctes
  2  moyen      scénario avec une contrainte principale ; choix entre services proches ou réglage précis
  3  difficile  plusieurs contraintes, piège ou subtilité de configuration (ex. valeurs de plage, ordre, héritage)
Une question à réponses multiples est au moins de difficulté 2.
`doc` : lien vers la page de référence (docs.cloud.google.com ou kubernetes.io). Vérifie-le avec `npm run check-links`.
Ne référencez pas les options par leur lettre dans `explain` : l'ordre change.
*/
export const DOMAINS = {
  // weight = part approximative du domaine dans le tirage de l'examen blanc (total = 100)
  1: { name: "Configurer un environnement cloud",            short: "Environnement",  weight: 17.5 },
  2: { name: "Planifier et configurer une solution cloud",   short: "Planification",  weight: 17.5 },
  3: { name: "Déployer et implémenter une solution cloud",   short: "Déploiement",    weight: 25 },
  4: { name: "Assurer le bon fonctionnement d'une solution", short: "Exploitation",   weight: 20 },
  5: { name: "Configurer l'accès et la sécurité",            short: "Accès et sécurité", weight: 20 }
};

// Sujets (champ `topic` des questions) : une clé stable et un libellé affichable.
// Un sujet peut couvrir plusieurs domaines. Pour en ajouter un, déclare-le ici (le validateur refuse les sujets inconnus).
export const TOPICS = {
  "resource-hierarchy": "Hiérarchie des ressources",
  "billing":            "Facturation et budgets",
  "gcloud":             "gcloud et SDK",
  "apis-quotas":        "API et quotas",
  "org-policy":         "Règles d'organisation",
  "identity":           "Identités et annuaire",
  "iam":                "IAM : rôles et autorisations",
  "service-accounts":   "Comptes de service",
  "secrets":            "Secrets",
  "compute":            "Compute Engine",
  "disks":              "Disques et instantanés",
  "gke":                "Google Kubernetes Engine",
  "serverless":         "Cloud Run et App Engine",
  "storage":            "Cloud Storage",
  "databases":          "Bases de données",
  "bigquery":           "BigQuery",
  "networking":         "Réseau VPC et pare-feu",
  "load-balancing":     "Équilibrage de charge",
  "messaging":          "Pub/Sub",
  "iac":                "Déploiement et infrastructure en tant que code",
  "logging":            "Journalisation et audit",
  "monitoring":         "Supervision et alertes"
};

export const QUESTIONS = [

  /* ------------------------------------------------------------------
     DOMAINE 1 — Configurer un environnement cloud
     ------------------------------------------------------------------ */
  {
    id: "d1-01", domain: 1,
    topic: "resource-hierarchy", difficulty: 2,
    doc: "https://docs.cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy",
    q: "Votre entreprise compte trois équipes (Data, Web, Mobile), chacune avec des projets de développement et de production. La sécurité veut appliquer une même règle d'organisation à tous les projets de production, quelle que soit l'équipe, sans la reconfigurer projet par projet. Quelle structure adoptez-vous ?",
    options: [
      "Créer un dossier « Production » contenant les projets de production et appliquer la règle sur ce dossier",
      "Appliquer la règle sur chaque projet de production individuellement avec un script",
      "Regrouper toutes les ressources de production dans un seul projet partagé par les trois équipes",
      "Ajouter un label `env=prod` aux projets : la règle s'appliquera automatiquement aux projets portant ce label"
    ],
    correct: [0],
    explain: "Les dossiers servent à regrouper des projets pour leur appliquer en une fois des règles d'organisation et des stratégies IAM, qui sont héritées par tout ce qu'ils contiennent. Un script projet par projet fonctionne mais ne couvre pas les futurs projets et doit être maintenu. Un projet unique supprime l'isolation entre équipes (quotas, facturation, IAM). Les labels servent au tri et à l'analyse des coûts : ils ne déclenchent aucun héritage de règle."
  },
  {
    id: "d1-02", domain: 1,
    topic: "billing", difficulty: 2,
    doc: "https://docs.cloud.google.com/billing/docs/how-to/billing-access",
    q: "Une développeuse a le rôle Créateur de projets. Elle crée un projet mais ne parvient pas à y activer la facturation. Quel rôle, respectant le moindre privilège, faut-il lui accorder sur le compte de facturation ?",
    options: [
      "Utilisateur de compte de facturation (Billing Account User)",
      "Administrateur de compte de facturation (Billing Account Administrator)",
      "Lecteur de compte de facturation (Billing Account Viewer)",
      "Propriétaire (Owner) au niveau de l'organisation"
    ],
    correct: [0],
    explain: "Billing Account User permet d'associer des projets à un compte de facturation, sans pouvoir le gérer. Comme créatrice, elle est déjà propriétaire du projet : il ne lui manquait que ce rôle côté compte. Billing Account Administrator donne en plus la gestion des moyens de paiement et des droits sur le compte, bien au-delà du besoin. Le rôle Lecteur ne permet que de consulter les coûts. Propriétaire de l'organisation est démesuré et ne respecte pas le moindre privilège."
  },
  {
    id: "d1-03", domain: 1,
    topic: "billing", difficulty: 3,
    doc: "https://docs.cloud.google.com/billing/docs/how-to/budgets-programmatic-notifications",
    q: "Un projet de test a généré une facture inattendue. La direction veut être prévenue quand la dépense atteint 50 %, 90 % et 100 % de 2 000 € par mois, et couper automatiquement la facturation du projet à 100 %. Que mettez-vous en place ?",
    options: [
      "Un budget avec seuils d'alerte, relié à un sujet Pub/Sub qui déclenche une fonction désactivant la facturation du projet",
      "Un budget avec seuils d'alerte : Google Cloud arrête les ressources quand le budget est atteint",
      "Un quota de dépense de 2 000 € défini dans la page Quotas du projet",
      "Une alerte Cloud Monitoring sur la métrique d'utilisation CPU de toutes les VM"
    ],
    correct: [0],
    explain: "Un budget n'est qu'un mécanisme de notification : il n'arrête ni ne plafonne rien. Pour agir, on branche les notifications du budget sur Pub/Sub et une fonction (Cloud Run functions) qui dissocie le projet du compte de facturation. Les quotas limitent des quantités de ressources ou des débits d'API, pas un montant en euros. Une alerte CPU ne mesure pas la dépense et ignore tous les autres services facturés."
  },
  {
    id: "d1-04", domain: 1,
    topic: "billing", difficulty: 2,
    doc: "https://docs.cloud.google.com/billing/docs/how-to/export-data-bigquery",
    q: "L'équipe finance veut analyser en SQL le détail des coûts par service, projet et label sur plusieurs mois, puis construire des tableaux de bord. Que configurez-vous ?",
    options: [
      "L'exportation de la facturation Cloud Billing vers un ensemble de données BigQuery",
      "Un récepteur (sink) Cloud Logging vers BigQuery",
      "Le téléchargement mensuel de la facture PDF dans un bucket Cloud Storage",
      "Un tableau de bord Cloud Monitoring basé sur les métriques de facturation"
    ],
    correct: [0],
    explain: "L'export Cloud Billing vers BigQuery fournit les données de coût détaillées (service, SKU, projet, labels) interrogeables en SQL et utilisables dans Looker Studio. Il faut l'activer tôt : il n'est pas rétroactif au-delà d'une courte période. Les récepteurs Cloud Logging exportent des journaux, pas des données de coût. Une facture PDF n'est pas exploitable en SQL. Cloud Monitoring ne propose pas le détail des coûts par label."
  },
  {
    id: "d1-05", domain: 1,
    topic: "gcloud", difficulty: 1,
    doc: "https://docs.cloud.google.com/sdk/docs/configurations",
    q: "Vous travaillez en ligne de commande sur deux projets, chacun avec un compte, une région et une zone par défaut différents. Vous voulez passer de l'un à l'autre sans retaper ces paramètres. Quelle est la méthode prévue par gcloud ?",
    options: [
      "Créer deux configurations avec `gcloud config configurations create` et basculer avec `gcloud config configurations activate`",
      "Réexécuter `gcloud init` à chaque changement de projet",
      "Installer deux fois le SDK dans deux répertoires distincts",
      "Modifier à la main le fichier de clé du compte de service à chaque changement"
    ],
    correct: [0],
    explain: "Les configurations nommées de gcloud regroupent compte, projet, région et zone ; on bascule avec `gcloud config configurations activate NOM` (ou ponctuellement avec l'option `--configuration`). Relancer `gcloud init` marche mais redemande tout à chaque fois. Deux installations du SDK sont inutiles. Les clés de compte de service n'ont rien à voir avec les valeurs par défaut de gcloud."
  },
  {
    id: "d1-06", domain: 1,
    topic: "apis-quotas", difficulty: 1,
    doc: "https://docs.cloud.google.com/service-usage/docs/enable-disable",
    q: "Dans un projet tout neuf, la création d'une VM par script échoue avec une erreur indiquant que l'API Compute Engine n'a pas été utilisée ou est désactivée. Quelle commande règle le problème ?",
    options: [
      "`gcloud services enable compute.googleapis.com`",
      "`gcloud compute apis activate`",
      "`gcloud projects add-iam-policy-binding` avec le rôle Administrateur Compute",
      "`gcloud components install compute`"
    ],
    correct: [0],
    explain: "Chaque API doit être activée par projet avant usage, avec `gcloud services enable` (ou depuis « API et services » dans la console). La commande `gcloud compute apis activate` n'existe pas. Ajouter un rôle IAM règle un problème d'autorisation, pas une API désactivée. `gcloud components install` installe des composants locaux du SDK et ne touche pas au projet."
  },
  {
    id: "d1-07", domain: 1,
    topic: "org-policy", difficulty: 2,
    doc: "https://docs.cloud.google.com/organization-policy/restrict-locations",
    q: "Pour des raisons réglementaires, aucune ressource de votre organisation ne doit être créée hors de l'Union européenne. Comment l'imposez-vous de façon préventive à tous les projets, actuels et futurs ?",
    options: [
      "Définir la règle d'organisation de restriction des emplacements de ressources (`gcp.resourceLocations`) au niveau de l'organisation",
      "Retirer le rôle Éditeur à tous les utilisateurs hors d'Europe",
      "Créer une alerte Cloud Monitoring qui signale les ressources créées hors UE",
      "Définir la région par défaut `europe-west1` dans la configuration gcloud de chaque utilisateur"
    ],
    correct: [0],
    explain: "Le service de règles d'organisation impose des contraintes sur ce qui peut être configuré, indépendamment de qui agit. La contrainte `gcp.resourceLocations` limite les emplacements autorisés et s'hérite sur tous les dossiers et projets. IAM contrôle qui peut agir, pas où les ressources sont créées. Une alerte est réactive et n'empêche rien. Une région par défaut dans gcloud est une simple préférence locale, contournable avec `--region`."
  },
  {
    id: "d1-08", domain: 1,
    topic: "apis-quotas", difficulty: 2,
    doc: "https://docs.cloud.google.com/docs/quotas/view-manage",
    q: "Votre groupe d'instances géré ne dépasse pas 24 VM dans `europe-west1` alors que l'autoscaler en demande 40. Les journaux affichent une erreur `QUOTA_EXCEEDED` sur les CPU. Que faites-vous ?",
    options: [
      "Demander une augmentation du quota de CPU pour cette région depuis la page Quotas",
      "Augmenter le nombre maximal d'instances dans l'autoscaler",
      "Passer le compte de facturation sur une offre de support supérieure",
      "Supprimer puis recréer le modèle d'instance"
    ],
    correct: [0],
    explain: "Les quotas Compute Engine (ici les CPU par région) plafonnent les ressources par projet. On demande le relèvement depuis IAM et administration > Quotas. Relever le maximum de l'autoscaler ne sert à rien tant que le quota bloque la création. Le niveau de support n'a aucun effet sur les quotas. Recréer le modèle d'instance ne change pas la limite régionale."
  },
  {
    id: "d1-09", domain: 1,
    topic: "identity", difficulty: 2,
    doc: "https://docs.cloud.google.com/architecture/identity/federating-gcp-with-active-directory-synchronizing-user-accounts",
    q: "Votre entreprise gère 800 employés dans Active Directory et veut qu'ils se connectent à Google Cloud avec leurs identités d'entreprise, les comptes étant créés et supprimés automatiquement. Quelle approche est recommandée ?",
    options: [
      "Synchroniser utilisateurs et groupes vers Cloud Identity avec Google Cloud Directory Sync, et configurer l'authentification unique (SSO)",
      "Demander à chaque employé de créer un compte Gmail personnel et l'ajouter au projet",
      "Créer un compte de service par employé et distribuer les clés",
      "Créer les 800 comptes à la main dans la console d'administration"
    ],
    correct: [0],
    explain: "Google Cloud Directory Sync réplique à sens unique utilisateurs et groupes de l'annuaire vers Cloud Identity, et le SSO délègue l'authentification au fournisseur d'identité de l'entreprise. Des comptes Gmail personnels échappent au contrôle de l'entreprise (pas de révocation au départ d'un salarié). Les comptes de service représentent des applications, pas des personnes. La création manuelle ne passe pas à l'échelle et ne gère pas les départs."
  },
  {
    id: "d1-10", domain: 1,
    topic: "resource-hierarchy", difficulty: 2,
    doc: "https://docs.cloud.google.com/resource-manager/docs/creating-managing-projects",
    q: "Quelles affirmations sur les identifiants d'un projet Google Cloud sont exactes ?",
    options: [
      "L'ID de projet est unique au niveau mondial et ne peut plus être modifié après la création",
      "Le numéro de projet est attribué automatiquement par Google",
      "Le nom du projet doit être unique dans le monde entier",
      "L'ID de projet peut être modifié à tout moment depuis la console",
      "Le numéro de projet est choisi par le créateur du projet"
    ],
    correct: [0, 1],
    explain: "Un projet a trois identifiants : un nom lisible (modifiable, non unique), un ID (choisi à la création, unique mondialement, immuable) et un numéro (généré par Google, immuable). Le nom n'a donc aucune contrainte d'unicité, l'ID ne se modifie jamais et le numéro ne se choisit pas."
  },
  {
    id: "d1-11", domain: 1,
    topic: "iam", difficulty: 3,
    doc: "https://docs.cloud.google.com/iam/docs/resource-hierarchy-access-control",
    q: "Quelles affirmations décrivent correctement l'héritage des stratégies d'autorisation IAM dans la hiérarchie des ressources ?",
    options: [
      "Un rôle accordé sur un dossier s'applique à tous les projets et ressources qu'il contient",
      "Une stratégie d'autorisation définie sur un projet ne peut pas retirer un accès accordé au niveau du dossier parent",
      "Un rôle accordé sur un projet s'applique aussi au dossier parent",
      "La stratégie du niveau le plus bas remplace toujours celle des niveaux supérieurs",
      "Les stratégies IAM ne s'héritent qu'entre l'organisation et les dossiers, pas jusqu'aux projets"
    ],
    correct: [0, 1],
    explain: "Les stratégies d'autorisation s'héritent du haut vers le bas (organisation, dossiers, projets, ressources) et sont additives : l'accès effectif est l'union des stratégies de la ressource et de ses ancêtres. Un niveau inférieur ne peut donc pas restreindre ce qu'un parent accorde. L'héritage ne remonte jamais vers le parent, la stratégie enfant ne remplace pas celle du parent, et l'héritage va bien jusqu'aux ressources."
  },
  {
    id: "d1-16", domain: 1,
    topic: "gcloud", difficulty: 2,
    doc: "https://docs.cloud.google.com/docs/authentication/provide-credentials-adc",
    q: "Vous développez en local une application qui utilise une bibliothèque cliente Google Cloud. Elle doit s'authentifier avec votre identité, sans que vous téléchargiez de clé de compte de service. Quelle commande exécutez-vous ?",
    options: [
      "`gcloud auth application-default login`, qui crée des identifiants locaux par défaut (ADC)",
      "`gcloud auth login`, qui authentifie aussi tous les programmes lancés depuis votre session",
      "`gcloud auth activate-service-account --key-file=cle.json` avec une clé téléchargée",
      "`gcloud config set account` suivi de votre adresse e-mail professionnelle"
    ],
    correct: [0],
    explain: "`gcloud auth application-default login` crée des identifiants locaux par défaut (ADC) que les bibliothèques clientes détectent automatiquement, sans clé à gérer. `gcloud auth login` n'authentifie que la CLI `gcloud` elle-même, pas vos programmes. `activate-service-account` suppose justement une clé téléchargée. `gcloud config set account` choisit le compte actif de la CLI mais n'obtient aucun identifiant pour le code."
  },
  {
    id: "d1-17", domain: 1,
    topic: "resource-hierarchy", difficulty: 2,
    doc: "https://docs.cloud.google.com/resource-manager/docs/delete-restore-projects",
    q: "Un projet qui hébergeait une application en production a été supprimé par erreur il y a cinq jours. Que pouvez-vous faire ?",
    options: [
      "Le restaurer : un projet supprimé reste récupérable pendant 30 jours avant sa suppression définitive",
      "Rien : la suppression d'un projet est immédiate et ses ressources sont perdues sans retour possible",
      "Ouvrir un ticket de support : seul Google peut restaurer un projet supprimé, jamais son propriétaire",
      "Recréer un projet du même nom : les ressources supprimées sont alors rattachées automatiquement"
    ],
    correct: [0],
    explain: "Quand on supprime un projet, il passe en attente de suppression et peut être restauré (console ou `gcloud projects undelete`) pendant 30 jours ; ensuite il est supprimé définitivement avec ses ressources. La suppression n'est donc pas immédiate, la restauration ne passe pas obligatoirement par le support, et un nouveau projet du même nom ne récupère rien."
  },
  {
    id: "d1-18", domain: 1,
    topic: "billing", difficulty: 2,
    doc: "https://docs.cloud.google.com/resource-manager/docs/labels-overview",
    q: "Trois équipes déploient leurs VM et leurs buckets dans un même projet. La direction veut ventiler la facture par équipe sans créer un projet par équipe. Que mettez-vous en place ?",
    options: [
      "Des étiquettes (labels) du type `equipe=data` sur les ressources, exploitées dans la facturation",
      "Un compte de facturation distinct pour chaque équipe, tous rattachés à ce même projet",
      "Des quotas distincts pour chaque équipe sur l'API Compute Engine, définis dans le projet",
      "Des règles de pare-feu distinctes pour chaque équipe, appliquées aux sous-réseaux du projet"
    ],
    correct: [0],
    explain: "Les étiquettes sont des paires clé-valeur posées sur les ressources ; elles apparaissent dans les données de facturation, ce qui permet de regrouper les coûts par équipe au sein d'un même projet. Un projet n'est lié qu'à un seul compte de facturation à la fois. Les quotas et les règles de pare-feu n'ont aucun lien avec la ventilation des coûts."
  },
  {
    id: "d1-19", domain: 1,
    topic: "iam", difficulty: 2,
    doc: "https://docs.cloud.google.com/iam/docs/roles-overview",
    q: "Quelles affirmations sur les rôles de base d'IAM (Propriétaire, Éditeur, Lecteur) sont exactes ?",
    options: [
      "Ils regroupent des milliers de permissions sur de nombreux services : il vaut mieux les éviter en production",
      "Le rôle Éditeur permet de modifier l'état des ressources du projet, pas seulement de les consulter",
      "Ils sont limités à un seul service Google Cloud, par exemple Cloud Storage uniquement",
      "Google les recommande pour appliquer le principe du moindre privilège dans les projets de production",
      "Le rôle Lecteur permet aussi de modifier les ressources, mais pas de les supprimer"
    ],
    correct: [0, 1],
    explain: "Les rôles de base sont très larges : ils couvrent la plupart des services, ce qui s'écarte du moindre privilège, d'où la recommandation d'utiliser des rôles prédéfinis ou personnalisés en production. Éditeur ajoute à Lecteur la possibilité de modifier les ressources. Ils ne sont pas limités à un service, ne sont pas recommandés pour le moindre privilège, et Lecteur est en lecture seule."
  },
  {
    id: "d1-20", domain: 1,
    topic: "org-policy", difficulty: 2,
    doc: "https://docs.cloud.google.com/organization-policy/domain-restricted-sharing",
    q: "La sécurité veut empêcher que des rôles IAM soient accordés à des comptes extérieurs au domaine de l'entreprise, dans tous les projets de l'organisation. Que configurez-vous ?",
    options: [
      "La règle d'organisation de partage restreint au domaine (`iam.allowedPolicyMemberDomains`)",
      "Un rôle personnalisé sans la permission `setIamPolicy`, attribué à tous les utilisateurs de l'entreprise",
      "Une alerte envoyée aux administrateurs à chaque modification d'une stratégie IAM du projet concerné",
      "Un budget par projet, restreint aux membres du domaine de l'entreprise par une règle de facturation"
    ],
    correct: [0],
    explain: "La contrainte `iam.allowedPolicyMemberDomains` limite les principaux qui peuvent recevoir des rôles aux domaines autorisés, dans toute l'organisation. Retirer `setIamPolicy` limiterait qui modifie les stratégies, pas qui peut recevoir un rôle. Une alerte réagit après coup sans rien empêcher. Un budget ne contrôle pas les accès."
  },
  {
    id: "d1-21", domain: 1,
    topic: "gcloud", difficulty: 1,
    doc: "https://docs.cloud.google.com/shell/docs/how-cloud-shell-works",
    q: "Vous écrivez des scripts dans Cloud Shell. Où devez-vous les enregistrer pour les retrouver à la prochaine ouverture d'une session ?",
    options: [
      "Dans votre répertoire personnel (`$HOME`), qui repose sur un disque persistant de 5 Go",
      "N'importe où sur le disque de la machine virtuelle, qui est conservé d'une session à l'autre",
      "Dans `/tmp`, dont le contenu est sauvegardé automatiquement dans un bucket Cloud Storage",
      "Dans un dossier du projet, qui est copié automatiquement dans Cloud Shell à chaque ouverture"
    ],
    correct: [0],
    explain: "Seul le répertoire personnel de Cloud Shell est persistant (5 Go) ; la machine virtuelle sous-jacente est éphémère, donc ce qui se trouve en dehors de `$HOME` (y compris `/tmp` et les logiciels installés ailleurs) disparaît à la fin de la session. Aucun bucket ni dossier de projet n'est synchronisé automatiquement."
  },
  {
    id: "d1-22", domain: 1,
    topic: "resource-hierarchy", difficulty: 2,
    doc: "https://docs.cloud.google.com/resource-manager/docs/managing-notification-contacts",
    q: "Vous voulez que les notifications importantes de Google Cloud (sécurité, technique, facturation) soient envoyées à des adresses de groupe précises, définies par organisation, dossier ou projet. Que configurez-vous ?",
    options: [
      "Les contacts essentiels (Essential Contacts), définis sur l'organisation, le dossier ou le projet",
      "Un récepteur de journaux d'audit qui envoie un e-mail à chaque changement de stratégie IAM",
      "Un budget de facturation dont les seuils d'alerte sont envoyés aux administrateurs du compte",
      "Une règle d'alerte Cloud Monitoring avec un canal de notification par e-mail dans chaque projet"
    ],
    correct: [0],
    explain: "Les contacts essentiels permettent d'indiquer, pour une organisation, un dossier ou un projet, qui reçoit les communications de Google Cloud classées par catégorie (sécurité, technique, facturation, etc.), et les contacts se transmettent aux ressources enfants. Un récepteur de journaux, un budget et une alerte Cloud Monitoring envoient des notifications que vous avez vous-même définies, pas les communications de Google Cloud."
  },
  {
    id: "d1-23", domain: 1,
    topic: "gcloud", difficulty: 2,
    doc: "https://docs.cloud.google.com/sdk/gcloud/reference/topic/filters",
    q: "Vous voulez afficher uniquement le nom des VM arrêtées (statut `TERMINATED`) du projet actif, un par ligne, pour les transmettre à un script. Quelle commande utilisez-vous ?",
    options: [
      "`gcloud compute instances list --filter='status=TERMINATED' --format='value(name)'`",
      "`gcloud compute instances list --status=TERMINATED --names-only`, avec des options propres à la liste",
      "`gcloud compute instances describe --filter='status=TERMINATED' --format='value(name)'`",
      "`gcloud compute instances list | grep TERMINATED`, qui affiche les lignes complètes du tableau"
    ],
    correct: [0],
    explain: "`--filter` sélectionne les ressources selon une expression sur leurs champs, et `--format='value(name)'` n'affiche que la valeur du champ `name`, une par ligne, ce qui convient à un script. Les options `--status` et `--names-only` n'existent pas. `describe` décrit une seule instance et n'accepte pas de filtre de liste. Avec `grep`, on obtient les lignes entières du tableau et non les seuls noms."
  },
  {
    id: "d1-24", domain: 1,
    topic: "org-policy", difficulty: 1,
    doc: "https://docs.cloud.google.com/organization-policy/apply-policies",
    q: "Un responsable de la conformité doit pouvoir créer, modifier et supprimer des règles d'organisation pour toute l'organisation, sans autre droit d'administration. Quel rôle lui accordez-vous au niveau de l'organisation ?",
    options: [
      "Administrateur des règles d'organisation (`roles/orgpolicy.policyAdmin`)",
      "Lecteur de l'organisation (`roles/resourcemanager.organizationViewer`)",
      "Créateur de projets (`roles/resourcemanager.projectCreator`)",
      "Utilisateur de compte de facturation (`roles/billing.user`)"
    ],
    correct: [0],
    explain: "Pour modifier ou remplacer une règle d'organisation, il faut disposer du rôle Administrateur des règles d'organisation, `roles/orgpolicy.policyAdmin`. Le rôle Lecteur de l'organisation permet seulement de consulter, Créateur de projets de créer des projets, et Utilisateur de compte de facturation de rattacher des projets à un compte de facturation."
  },
  {
    id: "d1-25", domain: 1,
    topic: "org-policy", difficulty: 2,
    doc: "https://docs.cloud.google.com/organization-policy/reference/org-policy-constraints",
    q: "Chaque nouveau projet de l'organisation est créé avec un réseau VPC `default` et ses règles de pare-feu permissives. La sécurité veut que les nouveaux projets n'aient aucun réseau par défaut. Que configurez-vous ?",
    options: [
      "La règle d'organisation `compute.skipDefaultNetworkCreation`, appliquée à l'organisation",
      "Un rôle personnalisé sans permission de création de réseaux pour les créateurs de projets",
      "Un script Cloud Build qui supprime le réseau `default` de chaque projet une fois par semaine",
      "Une règle de pare-feu qui refuse tout le trafic entrant sur le réseau `default` des projets"
    ],
    correct: [0],
    explain: "Par défaut, un réseau et des ressources associées sont créés automatiquement avec chaque projet ; la contrainte `compute.skipDefaultNetworkCreation` empêche cette création pour tous les projets concernés. Un rôle personnalisé ne contrôle pas ce comportement automatique, un script supprime le réseau après coup (avec une fenêtre d'exposition), et une règle de refus laisse le réseau en place."
  },

  /* ------------------------------------------------------------------
     DOMAINE 2 — Planifier et configurer une solution cloud
     ------------------------------------------------------------------ */
  {
    id: "d2-01", domain: 2,
    topic: "billing", difficulty: 1,
    doc: "https://cloud.google.com/products/calculator",
    q: "Avant de lancer un projet, votre responsable demande une estimation du coût mensuel de 6 VM `e2-standard-4`, 2 To de disques persistants et un équilibreur de charge. Quel outil utilisez-vous ?",
    options: [
      "Le simulateur de coût Google Cloud (Pricing Calculator)",
      "Les rapports Cloud Billing",
      "L'export de facturation vers BigQuery",
      "Recommender"
    ],
    correct: [0],
    explain: "Le simulateur de coût estime la dépense d'une architecture avant tout déploiement, à partir des types de machines, du stockage et du réseau prévus. Les rapports Cloud Billing et l'export BigQuery portent sur des coûts déjà engagés. Recommender propose des optimisations sur des ressources existantes à partir de leur utilisation réelle."
  },
  {
    id: "d2-02", domain: 2,
    topic: "serverless", difficulty: 1,
    doc: "https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run",
    q: "Une équipe a conteneurisé une API HTTP sans état. Le trafic est très irrégulier, avec de longues périodes sans aucune requête. Elle veut ne rien payer à l'arrêt et ne gérer aucun serveur ni cluster. Quel service choisissez-vous ?",
    options: [
      "Cloud Run",
      "Un cluster GKE Standard avec autoscaling des nœuds",
      "Un groupe d'instances géré Compute Engine avec autoscaling",
      "L'environnement flexible d'App Engine"
    ],
    correct: [0],
    explain: "Cloud Run exécute des conteneurs sans état, s'adapte automatiquement à la charge et descend à zéro instance : on ne paie que pendant le traitement des requêtes. GKE Standard impose de gérer un cluster et garde au moins des nœuds actifs. Un groupe d'instances géré ne descend pas à zéro derrière un équilibreur de charge et demande de gérer des images de VM. L'environnement flexible d'App Engine garde toujours au moins une instance."
  },
  {
    id: "d2-03", domain: 2,
    topic: "compute", difficulty: 1,
    doc: "https://docs.cloud.google.com/compute/docs/instances/spot",
    q: "Un traitement par lots de rendu d'images tourne chaque nuit pendant trois heures. Il sauvegarde son état régulièrement et peut reprendre après une interruption. L'objectif principal est de réduire les coûts. Quelle option de calcul choisissez-vous ?",
    options: [
      "Des VM Spot",
      "Des VM standard avec une remise sur engagement d'utilisation de 3 ans",
      "Des nœuds à locataire unique (sole-tenant)",
      "Des VM standard à mémoire optimisée"
    ],
    correct: [0],
    explain: "Les VM Spot offrent de fortes remises en échange du risque d'être reprises à tout moment par Compute Engine, ce qui convient à un traitement tolérant aux interruptions. Un engagement de 3 ans facture 24 h/24 une capacité utilisée 3 heures par nuit. Les nœuds à locataire unique répondent à des besoins d'isolation ou de licences et coûtent plus cher. La mémoire optimisée augmente le prix sans répondre au besoin."
  },
  {
    id: "d2-04", domain: 2,
    topic: "storage", difficulty: 1,
    doc: "https://docs.cloud.google.com/storage/docs/storage-classes",
    q: "Un cabinet d'audit doit conserver 7 ans des sauvegardes qui ne seront consultées qu'en cas de contrôle, probablement moins d'une fois par an. Quelle classe Cloud Storage minimise le coût de stockage ?",
    options: ["Archive", "Coldline", "Nearline", "Standard"],
    correct: [0],
    explain: "Archive a le prix de stockage le plus bas et vise les données consultées moins d'une fois par an (durée minimale de stockage de 365 jours). Les données restent accessibles en quelques millisecondes, mais la lecture est facturée plus cher. Coldline vise un accès environ trimestriel (minimum 90 jours), Nearline un accès environ mensuel (minimum 30 jours), et Standard les données fréquemment lues : toutes trois coûtent plus cher au stockage."
  },
  {
    id: "d2-05", domain: 2,
    topic: "databases", difficulty: 1,
    doc: "https://docs.cloud.google.com/spanner/docs/instances",
    q: "Une plateforme de paiement présente sur trois continents a besoin d'une base relationnelle avec transactions fortement cohérentes, un scaling horizontal des écritures et une disponibilité multirégionale. Quel service convient ?",
    options: ["Spanner", "Cloud SQL", "Bigtable", "Firestore", "BigQuery"],
    correct: [0],
    explain: "Spanner est la base relationnelle de Google Cloud qui combine SQL, cohérence forte et scaling horizontal sur plusieurs régions. Cloud SQL est relationnel mais reste régional et monte surtout en puissance verticalement. Bigtable est une base NoSQL à colonnes larges sans transactions relationnelles multi-lignes. Firestore est une base documentaire. BigQuery est un entrepôt analytique, pas une base transactionnelle."
  },
  {
    id: "d2-06", domain: 2,
    topic: "databases", difficulty: 2,
    doc: "https://docs.cloud.google.com/bigtable/docs/overview",
    q: "Des capteurs industriels envoient plusieurs dizaines de milliers de mesures horodatées par seconde. L'application doit lire ces séries temporelles avec une latence de quelques millisecondes, sur plusieurs téraoctets. Quelle base choisissez-vous ?",
    options: ["Bigtable", "Cloud SQL pour PostgreSQL", "Firestore", "Cloud Storage", "Memorystore"],
    correct: [0],
    explain: "Bigtable est conçu pour de très gros volumes en écriture et lecture à faible latence, typiquement l'IoT et les séries temporelles. Cloud SQL plafonne bien avant ce débit d'écriture. Firestore vise les applications web et mobiles, pas l'ingestion massive. Cloud Storage stocke des objets et n'offre pas de lecture par clé à faible latence. Memorystore est un cache en mémoire, inadapté à des téraoctets persistants."
  },
  {
    id: "d2-07", domain: 2,
    topic: "databases", difficulty: 3,
    doc: "https://docs.cloud.google.com/sql/docs/mysql/high-availability",
    q: "Une instance Cloud SQL pour MySQL en production doit survivre à la panne d'une zone. Par ailleurs, les requêtes de reporting ralentissent l'instance principale. Quelles actions répondent à ces deux besoins ?",
    options: [
      "Activer la configuration haute disponibilité (instance régionale avec instance de secours dans une autre zone)",
      "Créer une instance dupliquée avec accès en lecture (read replica) et y diriger le reporting",
      "Augmenter la taille du disque de l'instance",
      "Activer uniquement les sauvegardes automatiques quotidiennes",
      "Exporter la base chaque nuit vers Cloud Storage"
    ],
    correct: [0, 1],
    explain: "La haute disponibilité de Cloud SQL maintient une instance de secours synchronisée dans une autre zone de la région, avec basculement automatique. Les instances dupliquées en lecture absorbent les requêtes en lecture seule comme le reporting. Attention : une instance dupliquée ne fournit pas de basculement automatique, et l'instance de secours ne sert pas les lectures. Agrandir le disque ne traite aucun des deux besoins. Sauvegardes et exports protègent les données mais ne donnent ni basculement ni répartition des lectures."
  },
  {
    id: "d2-08", domain: 2,
    topic: "load-balancing", difficulty: 2,
    doc: "https://docs.cloud.google.com/load-balancing/docs/https",
    q: "Un site e-commerce sert des clients en Europe, en Asie et en Amérique depuis des backends dans trois régions. Vous voulez une seule adresse IP publique, la terminaison HTTPS et le routage de chaque client vers la région saine la plus proche. Quel équilibreur de charge choisissez-vous ?",
    options: [
      "Un équilibreur de charge d'application externe global",
      "Un équilibreur de charge réseau passthrough externe",
      "Un équilibreur de charge d'application interne",
      "Un équilibreur de charge d'application externe régional dans chaque région"
    ],
    correct: [0],
    explain: "L'équilibreur de charge d'application externe global fournit une adresse IP anycast unique, termine HTTPS et envoie chaque requête vers le backend sain le plus proche, toutes régions confondues. L'équilibreur passthrough externe est régional, travaille au niveau 4 et ne termine pas HTTPS. L'équilibreur interne n'est pas joignable depuis Internet. Trois équilibreurs régionaux donnent trois adresses IP et obligent à gérer le routage par DNS."
  },
  {
    id: "d2-09", domain: 2,
    topic: "load-balancing", difficulty: 3,
    doc: "https://docs.cloud.google.com/load-balancing/docs/internal",
    q: "Dans un même VPC et une même région, un niveau applicatif doit joindre un groupe de serveurs TCP (port 5432, protocole non HTTP) via une adresse IP privée unique. Quel équilibreur de charge convient ?",
    options: [
      "Un équilibreur de charge réseau passthrough interne",
      "Un équilibreur de charge d'application externe global",
      "Un équilibreur de charge d'application interne",
      "Cloud NAT"
    ],
    correct: [0],
    explain: "L'équilibreur de charge réseau passthrough interne répartit du trafic TCP/UDP privé à l'intérieur d'un VPC, dans une région. L'équilibreur d'application externe global est public et réservé à HTTP(S). L'équilibreur d'application interne ne traite que HTTP(S). Cloud NAT fournit une sortie vers Internet aux ressources sans IP externe : ce n'est pas un équilibreur de charge."
  },
  {
    id: "d2-10", domain: 2,
    topic: "compute", difficulty: 2,
    doc: "https://docs.cloud.google.com/compute/docs/instances/committed-use-discounts-overview",
    q: "Un ERP tourne 24 h/24 sur 20 VM dont la taille ne changera pas pendant au moins trois ans. Comment réduire le plus la facture Compute Engine sans modifier l'architecture ?",
    options: [
      "Souscrire une remise sur engagement d'utilisation (CUD) de 3 ans",
      "Compter uniquement sur les remises automatiques proportionnelles à une utilisation soutenue",
      "Migrer les VM vers des VM Spot",
      "Arrêter les VM la nuit avec une planification d'instances"
    ],
    correct: [0],
    explain: "Pour une charge stable et prévisible, l'engagement d'utilisation de 3 ans donne la plus forte remise sur des VM standard. Les remises pour utilisation soutenue sont automatiques mais nettement plus faibles, et ne s'appliquent pas à toutes les familles de machines. Les VM Spot peuvent être reprises à tout moment, ce qui est inacceptable pour un ERP. Arrêter les VM la nuit contredit le besoin de fonctionnement continu."
  },
  {
    id: "d2-11", domain: 2,
    topic: "gke", difficulty: 2,
    doc: "https://docs.cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview",
    q: "Votre équipe hésite entre GKE Autopilot et GKE Standard. Quelles affirmations sur le mode Autopilot sont exactes ?",
    options: [
      "Google gère les nœuds : provisionnement, mises à niveau et scaling",
      "La facturation repose par défaut sur les ressources demandées par les pods, pas sur les VM des nœuds",
      "Vous devez créer et dimensionner vous-même les pools de nœuds",
      "Les charges de travail ne peuvent pas être réparties sur plusieurs zones",
      "Le mode Autopilot ne permet pas d'utiliser `kubectl`"
    ],
    correct: [0, 1],
    explain: "En Autopilot, Google provisionne et exploite les nœuds, et vous payez par défaut les ressources (CPU, mémoire, stockage éphémère) demandées par vos pods. La création et le dimensionnement des pools de nœuds caractérisent le mode Standard. Les clusters Autopilot sont régionaux, donc répartis sur plusieurs zones. `kubectl` et l'API Kubernetes s'utilisent normalement dans les deux modes."
  },
  {
    id: "d2-14", domain: 2,
    topic: "networking", difficulty: 3,
    doc: "https://docs.cloud.google.com/vpc/docs/shared-vpc",
    q: "Une organisation compte dix projets appartenant à des équipes différentes. L'équipe réseau veut gérer un seul réseau, avec ses sous-réseaux et ses pare-feu, dans lequel les VM de tous les projets sont connectées. Que mettez-vous en place ?",
    options: [
      "Un VPC partagé : un projet hôte détient le réseau et les projets de service y sont rattachés",
      "Un appairage de réseaux VPC entre chaque paire de projets",
      "Un VPC distinct par projet avec des règles de pare-feu identiques copiées à la main",
      "Un tunnel VPN entre chaque paire de projets"
    ],
    correct: [0],
    explain: "Le VPC partagé permet à un projet hôte de posséder le réseau, les sous-réseaux et les règles de pare-feu, tandis que les projets de service y créent leurs ressources : l'administration du réseau est centralisée. L'appairage relie des réseaux qui restent gérés séparément et il n'est pas transitif, donc il faudrait un appairage par paire. Copier les règles à la main multiplie les écarts. Des tunnels VPN entre projets ajoutent de la complexité pour un besoin interne."
  },
  {
    id: "d2-16", domain: 2,
    topic: "databases", difficulty: 1,
    doc: "https://docs.cloud.google.com/firestore/native/docs/overview",
    q: "Une application mobile et web stocke des profils et des préférences d'utilisateurs sous forme de documents JSON. Vous ne voulez provisionner ni dimensionner aucun serveur. Quelle base choisissez-vous ?",
    options: [
      "Firestore",
      "Cloud SQL pour PostgreSQL",
      "Cloud Bigtable",
      "Cloud Spanner"
    ],
    correct: [0],
    explain: "Firestore est une base de documents NoSQL entièrement gérée et sans serveur : pas de provisionnement, mise à l'échelle automatique, facturation à l'usage, et intégration possible avec Firebase pour les applications mobiles et web. Cloud SQL et Spanner sont des bases relationnelles, et Bigtable est une base à colonnes pour de très gros volumes, pas une base de documents."
  },
  {
    id: "d2-17", domain: 2,
    topic: "databases", difficulty: 1,
    doc: "https://docs.cloud.google.com/memorystore/docs/redis/memorystore-for-redis-overview",
    q: "Une application web interroge sans cesse les mêmes données de référence dans Cloud SQL, ce qui ralentit ses pages. Vous voulez un cache en mémoire géré pour réduire la latence. Quel service utilisez-vous ?",
    options: [
      "Memorystore, un service géré de cache en mémoire",
      "Cloud Storage de classe Standard",
      "Cloud Bigtable avec un nœud supplémentaire",
      "Un disque persistant SSD plus rapide pour la base"
    ],
    correct: [0],
    explain: "Memorystore (par exemple Memorystore for Redis) est un service géré de cache en mémoire, avec des accès de l'ordre de la milliseconde ou moins, qui décharge la base des lectures répétées. Cloud Storage est un stockage d'objets, Bigtable une base NoSQL, et un disque plus rapide accélère la base sans servir de cache en mémoire."
  },
  {
    id: "d2-18", domain: 2,
    topic: "networking", difficulty: 2,
    doc: "https://docs.cloud.google.com/nat/docs/overview",
    q: "Des VM sans adresse IP externe doivent télécharger des mises à jour sur Internet, sans qu'Internet puisse initier de connexion vers elles. Que configurez-vous ?",
    options: [
      "Cloud NAT, configuré sur un routeur Cloud pour les sous-réseaux des VM",
      "Une adresse IP externe éphémère attribuée à chaque VM",
      "Un équilibreur de charge d'application externe placé devant les VM",
      "Un appairage de réseaux VPC avec un second VPC public"
    ],
    correct: [0],
    explain: "Cloud NAT permet aux VM sans adresse externe d'ouvrir des connexions sortantes vers Internet ; seules les réponses aux connexions établies reviennent, Internet ne peut pas en initier. Une adresse externe sur chaque VM les exposerait. Un équilibreur sert à recevoir du trafic entrant, et un appairage relie deux VPC sans donner accès à Internet."
  },
  {
    id: "d2-19", domain: 2,
    topic: "networking", difficulty: 2,
    doc: "https://docs.cloud.google.com/network-connectivity/docs/vpn/concepts/overview",
    q: "Vous devez relier votre centre de données à votre VPC en quelques jours, avec un trafic chiffré passant par Internet, sans investir dans une liaison physique dédiée. Quelle solution choisissez-vous ?",
    options: [
      "Cloud VPN (VPN haute disponibilité), avec des tunnels IPsec chiffrés sur Internet",
      "Dedicated Interconnect, avec un raccordement physique à un point de présence Google",
      "Partner Interconnect, avec une liaison fournie par un opérateur partenaire",
      "Un appairage de réseaux VPC entre votre centre de données et le VPC"
    ],
    correct: [0],
    explain: "Cloud VPN établit des tunnels IPsec chiffrés à travers Internet, ce qui se met en place rapidement et sans matériel dédié. Dedicated et Partner Interconnect passent par des liaisons physiques privées, plus longues à installer et non chiffrées par défaut. L'appairage de réseaux VPC relie deux VPC Google Cloud, pas un site externe."
  },
  {
    id: "d2-20", domain: 2,
    topic: "storage", difficulty: 1,
    doc: "https://docs.cloud.google.com/filestore/docs/overview",
    q: "Plusieurs VM Linux doivent lire et écrire les mêmes fichiers via un système de fichiers partagé de type NFS, avec une faible latence. Quel service géré choisissez-vous ?",
    options: [
      "Filestore",
      "Memorystore",
      "Cloud Bigtable",
      "Cloud SQL"
    ],
    correct: [0],
    explain: "Filestore fournit des partages de fichiers NFS gérés, montables simultanément par plusieurs VM. Memorystore est un cache en mémoire, Bigtable une base NoSQL et Cloud SQL une base relationnelle : aucun n'expose un système de fichiers partagé."
  },
  {
    id: "d2-21", domain: 2,
    topic: "compute", difficulty: 3,
    doc: "https://docs.cloud.google.com/compute/docs/nodes/sole-tenant-nodes",
    q: "Une licence logicielle impose que vos VM s'exécutent sur du matériel physique réservé à votre organisation, sans partage avec d'autres clients. Que choisissez-vous dans Compute Engine ?",
    options: [
      "Des nœuds à locataire unique (sole-tenant), qui sont des serveurs physiques dédiés à vos VM",
      "Des VM Spot, qui utilisent la capacité excédentaire du centre de données de la région",
      "Des VM réparties dans un groupe d'instances géré régional sur plusieurs zones de disponibilité",
      "Une remise sur engagement d'utilisation de trois ans sur les processeurs virtuels et la mémoire"
    ],
    correct: [0],
    explain: "Les nœuds à locataire unique sont des serveurs physiques réservés à votre projet : vos VM n'y cohabitent pas avec celles d'autres clients, ce qui répond aux exigences de licence ou de conformité. Les VM Spot, les groupes régionaux et les remises sur engagement concernent le coût ou la disponibilité, pas l'isolation matérielle."
  },
  {
    id: "d2-22", domain: 2,
    topic: "load-balancing", difficulty: 2,
    doc: "https://docs.cloud.google.com/cdn/docs/overview",
    q: "Un site diffuse des images et des fichiers statiques à des utilisateurs du monde entier, et la latence est élevée loin de la région d'hébergement. Quelle fonctionnalité met le contenu en cache près des utilisateurs ?",
    options: [
      "Cloud CDN, activé sur le service de backend de l'équilibreur de charge",
      "Un cluster Memorystore déployé dans chaque région d'hébergement",
      "Un équilibreur de charge réseau passthrough interne devant les serveurs",
      "Des VM Spot supplémentaires dans la région d'origine du site"
    ],
    correct: [0],
    explain: "Cloud CDN met en cache le contenu sur le réseau de périphérie de Google, au plus près des utilisateurs, ce qui réduit la latence et la charge sur les backends. Memorystore est un cache de données applicatives interne à une région, un équilibreur interne ne sert pas des utilisateurs du monde entier, et des VM supplémentaires dans la région d'origine ne rapprochent pas le contenu des utilisateurs."
  },
  {
    id: "d2-23", domain: 2,
    topic: "databases", difficulty: 2,
    doc: "https://docs.cloud.google.com/database-migration/docs/overview",
    q: "Vous devez migrer une base MySQL hébergée dans votre centre de données vers Cloud SQL, avec le moins d'interruption possible au moment de la bascule. Quel service utilisez-vous ?",
    options: [
      "Database Migration Service, qui réplique les données en continu jusqu'à la bascule",
      "Storage Transfer Service, configuré pour copier périodiquement les fichiers de la base",
      "Une exportation CSV de chaque table, suivie d'un import avec la commande `bq load`",
      "Transfer Appliance, un équipement physique expédié dans votre centre de données"
    ],
    correct: [0],
    explain: "Database Migration Service copie la base source vers Cloud SQL puis réplique les changements en continu, ce qui limite l'interruption à la bascule finale. Storage Transfer Service déplace des fichiers et des objets, pas une base en fonctionnement. `bq load` charge des données dans BigQuery, pas dans Cloud SQL. Transfer Appliance sert à envoyer de gros volumes de fichiers hors ligne."
  },
  {
    id: "d2-24", domain: 2,
    topic: "storage", difficulty: 2,
    doc: "https://docs.cloud.google.com/transfer-appliance/docs/4.0/overview",
    q: "Votre entreprise doit transférer 400 To de données depuis un site dont la connexion Internet est trop lente pour un envoi en ligne dans un délai raisonnable. Quelle solution choisissez-vous ?",
    options: [
      "Transfer Appliance : un équipement physique expédié par Google, rempli puis renvoyé",
      "Storage Transfer Service, configuré avec une planification quotidienne depuis le site",
      "Une liaison Cloud VPN établie sur la même connexion Internet que celle du site",
      "La commande `gcloud storage cp` lancée depuis un poste de travail du site"
    ],
    correct: [0],
    explain: "Quand la bande passante rend un transfert en ligne trop long, Transfer Appliance permet de copier les données sur un équipement physique expédié par Google, que l'on renvoie ensuite pour que les données soient chargées dans Cloud Storage. Storage Transfer Service, un VPN et `gcloud storage cp` passent tous par la même connexion trop lente."
  },

  /* ------------------------------------------------------------------
     DOMAINE 3 — Déployer et implémenter une solution cloud
     ------------------------------------------------------------------ */
  {
    id: "d3-01", domain: 3,
    topic: "compute", difficulty: 1,
    doc: "https://docs.cloud.google.com/compute/docs/instance-groups",
    q: "Vous devez déployer un parc de serveurs web identiques qui s'adapte à la charge et recrée automatiquement toute VM défaillante. Quelle suite d'actions est correcte ?",
    options: [
      "Créer un modèle d'instance, puis un groupe d'instances géré basé sur ce modèle, avec autoscaling et vérification d'état pour l'autoréparation",
      "Créer les VM une par une, puis les ajouter à un groupe d'instances non géré avec autoscaling",
      "Créer un instantané d'une VM et planifier sa restauration toutes les heures",
      "Créer une seule VM avec le plus gros type de machine disponible"
    ],
    correct: [0],
    explain: "Un groupe d'instances géré (MIG) crée des VM identiques à partir d'un modèle d'instance et apporte autoscaling, autoréparation par vérification d'état et mises à jour progressives. Un groupe non géré rassemble des VM hétérogènes et n'offre ni autoscaling ni autoréparation. Restaurer un instantané n'adapte pas la capacité à la charge. Une grosse VM unique reste un point de défaillance et ne s'adapte pas à la demande."
  },
  {
    id: "d3-02", domain: 3,
    topic: "compute", difficulty: 1,
    doc: "https://docs.cloud.google.com/compute/docs/instances/startup-scripts/linux",
    q: "Chaque VM Linux d'un modèle d'instance doit installer et lancer Nginx automatiquement à son démarrage, sans image personnalisée. Comment faites-vous ?",
    options: [
      "Fournir un script dans la clé de métadonnées `startup-script` du modèle d'instance",
      "Ajouter le script dans un label de l'instance",
      "Se connecter en SSH à chaque VM créée par l'autoscaler",
      "Placer le script dans la clé de métadonnées `shutdown-script`"
    ],
    correct: [0],
    explain: "Compute Engine exécute à chaque démarrage le contenu de la clé de métadonnées `startup-script` (ou le fichier référencé par `startup-script-url`). Les labels sont de simples paires clé/valeur d'organisation, jamais exécutées. Une connexion SSH manuelle est incompatible avec l'autoscaling. `shutdown-script` s'exécute à l'arrêt de la VM, pas au démarrage."
  },
  {
    id: "d3-03", domain: 3,
    topic: "gke", difficulty: 1,
    doc: "https://docs.cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl",
    q: "Vous venez de créer un cluster GKE nommé `prod` depuis la console. Sur votre poste, `kubectl get nodes` cible encore un ancien cluster. Quelle commande configure `kubectl` pour le nouveau cluster ?",
    options: [
      "`gcloud container clusters get-credentials prod --region europe-west1`",
      "`kubectl config create-cluster prod`",
      "`gcloud container clusters describe prod`",
      "`gcloud auth application-default login`"
    ],
    correct: [0],
    explain: "`gcloud container clusters get-credentials` écrit dans le fichier kubeconfig le point d'accès et les identifiants du cluster, et en fait le contexte courant. `kubectl config create-cluster` n'existe pas. `describe` affiche les propriétés du cluster sans modifier kubeconfig. `gcloud auth application-default login` crée des identifiants par défaut pour les bibliothèques clientes, sans lien avec le contexte kubectl."
  },
  {
    id: "d3-04", domain: 3,
    topic: "gke", difficulty: 2,
    doc: "https://docs.cloud.google.com/kubernetes-engine/docs/concepts/service-load-balancer",
    q: "Un Deployment de 3 pods tourne sur GKE et écoute sur le port 8080. Vous voulez l'exposer sur Internet en TCP avec une adresse IP externe stable. Quel objet Kubernetes créez-vous ?",
    options: [
      "Un Service de type `LoadBalancer`",
      "Un Service de type `ClusterIP`",
      "Un `ConfigMap` contenant le port 8080",
      "Un `PersistentVolumeClaim`"
    ],
    correct: [0],
    explain: "Un Service de type `LoadBalancer` fait provisionner par GKE un équilibreur de charge réseau externe avec une adresse IP publique qui répartit le trafic vers les pods. `ClusterIP` n'est joignable que depuis l'intérieur du cluster. Un ConfigMap stocke de la configuration et un PersistentVolumeClaim demande du stockage : aucun des deux n'expose un service."
  },
  {
    id: "d3-05", domain: 3,
    topic: "serverless", difficulty: 2,
    doc: "https://docs.cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration",
    q: "Vous voulez déployer une nouvelle révision d'un service Cloud Run, la tester en privé, puis lui envoyer seulement 10 % du trafic. Quelle démarche suivez-vous ?",
    options: [
      "Déployer avec `--no-traffic`, puis répartir avec `gcloud run services update-traffic --to-revisions`",
      "Déployer un second service Cloud Run et modifier le DNS pour 10 % des utilisateurs",
      "Déployer normalement, puis supprimer la révision en cas de problème",
      "Réduire le nombre maximal d'instances de la nouvelle révision à 10 % de l'ancienne"
    ],
    correct: [0],
    explain: "Cloud Run gère nativement la répartition du trafic entre révisions. `--no-traffic` déploie sans exposer la révision (on peut la tester via une URL dédiée avec un tag), puis `update-traffic` fixe les pourcentages. Un second service avec bascule DNS est lourd et imprécis. Un déploiement normal envoie 100 % du trafic à la nouvelle révision. Le nombre maximal d'instances limite la capacité, pas la part du trafic."
  },
  {
    id: "d3-06", domain: 3,
    topic: "serverless", difficulty: 2,
    doc: "https://docs.cloud.google.com/sdk/gcloud/reference/app/deploy",
    q: "Vous déployez une nouvelle version d'une application App Engine et voulez la valider sur son URL de version avant qu'elle reçoive le moindre trafic de production. Quelle commande utilisez-vous ?",
    options: [
      "`gcloud app deploy --no-promote`",
      "`gcloud app deploy --stop-previous-version`",
      "`gcloud app versions migrate`",
      "`gcloud app deploy --promote`"
    ],
    correct: [0],
    explain: "`--no-promote` déploie la version sans lui router de trafic ; elle reste joignable sur son URL propre. On bascule ensuite avec `gcloud app services set-traffic` (ou `versions migrate`). `--stop-previous-version` arrête l'ancienne version, l'inverse d'une validation prudente. `versions migrate` déplace le trafic vers une version déjà déployée. `--promote` est le comportement par défaut : tout le trafic part vers la nouvelle version."
  },
  {
    id: "d3-07", domain: 3,
    topic: "serverless", difficulty: 2,
    doc: "https://docs.cloud.google.com/run/docs/triggering/storage-triggers",
    q: "Chaque image déposée dans un bucket Cloud Storage doit déclencher automatiquement la génération d'une miniature, sans serveur à gérer. Quelle solution est la plus simple ?",
    options: [
      "Une fonction Cloud Run functions déclenchée par l'événement de finalisation d'objet du bucket",
      "Une VM qui liste le bucket toutes les minutes avec une tâche cron",
      "Une règle de cycle de vie sur le bucket",
      "Une tâche Cloud Scheduler quotidienne qui lance un traitement par lots"
    ],
    correct: [0],
    explain: "Une fonction pilotée par événement (déclencheur Eventarc sur la finalisation d'un objet) s'exécute à chaque dépôt, sans infrastructure à gérer et sans coût à l'arrêt. Une VM qui interroge le bucket coûte en continu et introduit un délai. Les règles de cycle de vie ne savent que changer de classe ou supprimer des objets. Cloud Scheduler lance des tâches à heure fixe, pas en réaction à un dépôt."
  },
  {
    id: "d3-08", domain: 3,
    topic: "storage", difficulty: 2,
    doc: "https://docs.cloud.google.com/storage-transfer/docs/overview",
    q: "Votre entreprise veut copier 40 To depuis un bucket Amazon S3 vers Cloud Storage, puis synchroniser les nouveaux fichiers chaque nuit. Quel outil est le plus adapté ?",
    options: [
      "Le service de transfert de stockage (Storage Transfer Service)",
      "Transfer Appliance",
      "Le glisser-déposer dans la console Cloud Storage",
      "Le service de transfert de données BigQuery"
    ],
    correct: [0],
    explain: "Storage Transfer Service réalise des transferts gérés et planifiables depuis d'autres clouds (S3, Azure Blob), des sources HTTP ou d'autres buckets, avec reprise et synchronisation incrémentale. Transfer Appliance est un boîtier physique pour de très gros volumes sur site avec peu de bande passante. La console ne convient ni à 40 To ni à une source S3. Le service de transfert BigQuery charge des données dans BigQuery, pas dans Cloud Storage."
  },
  {
    id: "d3-09", domain: 3,
    topic: "bigquery", difficulty: 2,
    doc: "https://docs.cloud.google.com/bigquery/docs/loading-data-cloud-storage-csv",
    q: "Des fichiers CSV sont déposés chaque jour dans un bucket Cloud Storage. Vous devez les charger dans une table BigQuery existante depuis un script shell. Quelle commande utilisez-vous ?",
    options: [
      "`bq load --source_format=CSV mon_dataset.ma_table gs://mon-bucket/fichier.csv`",
      "`gcloud storage cp gs://mon-bucket/fichier.csv bq://mon_dataset.ma_table`",
      "`bq mk --table mon_dataset.ma_table`",
      "`gcloud sql import csv`"
    ],
    correct: [0],
    explain: "L'outil `bq` pilote BigQuery en ligne de commande et `bq load` crée une tâche de chargement depuis Cloud Storage ou un fichier local. `gcloud storage cp` copie des objets entre buckets et systèmes de fichiers : le schéma `bq://` n'existe pas. `bq mk` crée un ensemble de données ou une table vide sans charger de données. `gcloud sql import csv` concerne Cloud SQL."
  },
  {
    id: "d3-10", domain: 3,
    topic: "networking", difficulty: 3,
    doc: "https://docs.cloud.google.com/vpc/docs/vpc",
    q: "Vous concevez un réseau VPC en mode personnalisé pour une application déployée dans deux régions. Quelles affirmations sont exactes ?",
    options: [
      "Un réseau VPC est une ressource globale, alors que chaque sous-réseau est régional",
      "La plage IP principale d'un sous-réseau peut être étendue sans interruption, mais pas réduite",
      "Un sous-réseau peut couvrir plusieurs régions",
      "Il faut créer un réseau VPC distinct par région puis les relier par appairage",
      "Deux VM d'un même VPC situées dans des régions différentes doivent passer par un VPN pour communiquer en IP interne"
    ],
    correct: [0, 1],
    explain: "Un VPC Google Cloud est global ; ses sous-réseaux sont régionaux et couvrent toutes les zones de leur région. On peut agrandir la plage principale d'un sous-réseau (`gcloud compute networks subnets expand-ip-range`) sans coupure, mais jamais la réduire. Un sous-réseau n'appartient qu'à une région. Un seul VPC suffit pour plusieurs régions, et ses VM communiquent en IP interne sur le réseau de Google sans VPN, sous réserve des règles de pare-feu."
  },
  {
    id: "d3-11", domain: 3,
    topic: "networking", difficulty: 3,
    doc: "https://docs.cloud.google.com/load-balancing/docs/health-check-concepts",
    q: "Derrière un équilibreur de charge d'application externe, tous vos backends sont signalés comme défaillants alors que l'application répond bien en local sur les VM. Les VM portent le tag réseau `web`. Quelle règle de pare-feu manque probablement ?",
    options: [
      "Une règle d'entrée autorisant les plages `130.211.0.0/22` et `35.191.0.0/16` vers les VM portant le tag `web`, sur le port de vérification d'état",
      "Une règle de sortie autorisant `0.0.0.0/0` depuis les VM portant le tag `web`",
      "Une règle d'entrée autorisant `0.0.0.0/0` sur le port 22",
      "Une règle d'entrée autorisant la plage `35.235.240.0/20` sur le port 80"
    ],
    correct: [0],
    explain: "Les vérifications d'état des équilibreurs de charge Google proviennent des plages `130.211.0.0/22` et `35.191.0.0/16`. Sans règle d'entrée les autorisant, les sondes échouent et les backends sont déclarés défaillants. Le trafic sortant est autorisé par défaut. Ouvrir SSH à tout Internet est inutile ici et dangereux. La plage `35.235.240.0/20` est celle du transfert TCP d'Identity-Aware Proxy, sans rapport avec les vérifications d'état."
  },
  {
    id: "d3-12", domain: 3,
    topic: "iac", difficulty: 1,
    doc: "https://docs.cloud.google.com/docs/terraform/terraform-overview",
    q: "Votre équipe doit recréer à l'identique un environnement (VPC, sous-réseaux, VM, buckets) dans trois projets, avec revue des changements et historique dans Git. Quelle approche recommandez-vous ?",
    options: [
      "Décrire l'infrastructure de façon déclarative avec Terraform et appliquer la même configuration aux trois projets",
      "Rédiger une procédure pas à pas à suivre dans la console",
      "Créer l'environnement dans un projet, puis cloner le projet depuis la console",
      "Lancer les commandes gcloud à la main depuis Cloud Shell dans chaque projet"
    ],
    correct: [0],
    explain: "L'infrastructure en tant que code avec Terraform (éventuellement exécuté par Infrastructure Manager) décrit l'état voulu dans des fichiers versionnés, relus et rejouables à l'identique. Une procédure console est lente et source d'écarts. Google Cloud ne propose pas de clonage de projet. Des commandes manuelles sont impératives et ne garantissent ni la reproductibilité ni la détection des dérives."
  },
  {
    id: "d3-13", domain: 3,
    topic: "messaging", difficulty: 1,
    doc: "https://docs.cloud.google.com/pubsub/docs/overview",
    q: "Un service de commandes doit prévenir trois autres services (facturation, stock, e-mail) à chaque nouvelle commande, sans attendre leur réponse et sans perdre de message si l'un d'eux est momentanément indisponible. Que déployez-vous ?",
    options: [
      "Un sujet Pub/Sub avec un abonnement par service consommateur",
      "Trois appels HTTP synchrones depuis le service de commandes",
      "Un bucket Cloud Storage que chaque service interroge régulièrement",
      "Une instance Memorystore partagée"
    ],
    correct: [0],
    explain: "Pub/Sub découple l'émetteur des consommateurs : chaque abonnement reçoit sa copie du message et le conserve jusqu'à l'accusé de réception, ce qui absorbe les indisponibilités. Des appels synchrones couplent les services et échouent si l'un d'eux est en panne. Interroger un bucket est lent et fragile. Memorystore est un cache en mémoire, pas un système de messagerie durable."
  },
  {
    id: "d3-14", domain: 3,
    topic: "iac", difficulty: 1,
    doc: "https://docs.cloud.google.com/marketplace/docs",
    q: "Le marketing demande un site WordPress opérationnel aujourd'hui sur Compute Engine, avec base de données et serveur web préconfigurés. Quelle est la façon la plus rapide de le déployer ?",
    options: [
      "Déployer une solution WordPress depuis Cloud Marketplace",
      "Créer une VM vide et installer chaque composant à la main",
      "Écrire une image Docker personnalisée et créer un cluster GKE",
      "Demander une augmentation de quota avant toute création"
    ],
    correct: [0],
    explain: "Cloud Marketplace propose des solutions prêtes à déployer (pile logicielle, VM et configuration) en quelques clics. L'installation manuelle fonctionne mais prend beaucoup plus de temps. Construire une image et un cluster GKE est disproportionné pour ce besoin. Une demande de quota n'a pas lieu d'être pour une seule VM."
  },
  {
    id: "d3-15", domain: 3,
    topic: "storage", difficulty: 2,
    doc: "https://docs.cloud.google.com/storage/docs/lifecycle",
    q: "Les objets d'un bucket doivent passer en classe Nearline 30 jours après leur création, puis être supprimés au bout de 365 jours. Quelles actions configurez-vous dans les règles de cycle de vie ?",
    options: [
      "Une action `SetStorageClass` vers Nearline avec la condition d'âge 30 jours",
      "Une action `Delete` avec la condition d'âge 365 jours",
      "Une règle de conservation (retention policy) de 365 jours",
      "L'activation de la gestion des versions d'objets",
      "Une tâche Cloud Scheduler qui exécute `gcloud storage rm` chaque jour"
    ],
    correct: [0, 1],
    explain: "La gestion du cycle de vie applique automatiquement des actions selon des conditions : `SetStorageClass` pour changer de classe et `Delete` pour supprimer, ici selon l'âge. Une règle de conservation fait l'inverse : elle interdit la suppression avant l'échéance. La gestion des versions conserve les anciennes versions et n'automatise ni transition ni suppression. Une tâche planifiée refait à la main ce que le service gère nativement."
  },
  {
    id: "d3-16", domain: 3,
    topic: "gke", difficulty: 2,
    doc: "https://docs.cloud.google.com/kubernetes-engine/docs/concepts/horizontalpodautoscaler",
    q: "Un Deployment GKE nommé `api` doit passer automatiquement de 2 à 10 pods quand l'utilisation moyenne du CPU dépasse 60 %. Quelle commande met cela en place ?",
    options: [
      "`kubectl autoscale deployment api --min=2 --max=10 --cpu-percent=60`",
      "`kubectl scale deployment api --replicas=10`",
      "`gcloud container clusters resize` avec 10 nœuds",
      "`kubectl rollout restart deployment api`"
    ],
    correct: [0],
    explain: "`kubectl autoscale` crée un HorizontalPodAutoscaler qui ajuste le nombre de pods entre les bornes selon la métrique cible. `kubectl scale` fixe un nombre de pods une fois pour toutes. `clusters resize` change le nombre de nœuds, pas le nombre de pods. `rollout restart` redémarre les pods sans modifier leur nombre."
  },
  {
    id: "d3-18", domain: 3,
    topic: "compute", difficulty: 2,
    doc: "https://docs.cloud.google.com/compute/docs/instance-groups/autohealing-instances-in-migs",
    q: "Un site web tourne sur un groupe d'instances géré. Vous voulez que les VM qui cessent de répondre aux vérifications d'état HTTP soient recréées automatiquement. Que configurez-vous ?",
    options: [
      "La réparation automatique du groupe, avec un contrôle d'état",
      "L'autoscaling du groupe en fonction de l'utilisation du processeur",
      "Un équilibreur de charge interne devant le groupe",
      "Un calendrier d'instantanés pour les disques des VM"
    ],
    correct: [0],
    explain: "La réparation automatique d'un groupe d'instances géré s'appuie sur un contrôle d'état : une VM qui échoue de façon répétée est recréée. L'autoscaling ajuste le nombre de VM selon la charge, il ne remplace pas une VM défaillante. Un équilibreur cesse seulement de lui envoyer du trafic. Les instantanés protègent les données mais ne relancent pas la VM."
  },
  {
    id: "d3-19", domain: 3,
    topic: "gke", difficulty: 2,
    doc: "https://docs.cloud.google.com/kubernetes-engine/docs/concepts/cluster-autoscaler",
    q: "Dans un cluster GKE, des pods restent en attente faute de ressources. Vous voulez que des nœuds soient ajoutés automatiquement, puis retirés quand ils sont sous-utilisés. Qu'activez-vous ?",
    options: [
      "L'autoscaler de cluster sur le pool de nœuds, avec un nombre minimal et maximal de nœuds",
      "L'autoscaler horizontal de pods (HPA) sur le déploiement",
      "L'autoscaler vertical de pods (VPA) sur le déploiement",
      "Un redimensionnement manuel du pool avec `gcloud container clusters resize`"
    ],
    correct: [0],
    explain: "L'autoscaler de cluster ajoute des nœuds quand des pods ne peuvent pas être planifiés et en supprime quand ils sont peu utilisés, dans les limites fixées. Le HPA règle le nombre de pods et le VPA leurs demandes de ressources : aucun des deux n'ajoute de nœuds. Le redimensionnement manuel n'est pas automatique."
  },
  {
    id: "d3-20", domain: 3,
    topic: "messaging", difficulty: 2,
    doc: "https://docs.cloud.google.com/pubsub/docs/dead-letter-topics",
    q: "Certains messages Pub/Sub échouent à chaque traitement et sont renvoyés en boucle, ce qui encombre l'abonnement. Comment les isoler sans les perdre ?",
    options: [
      "Configurer un sujet de lettres mortes sur l'abonnement, avec un nombre maximal de tentatives de livraison",
      "Réduire le délai d'accusé de réception à zéro",
      "Supprimer l'abonnement et le recréer à chaque erreur",
      "Augmenter la durée de rétention des messages du sujet afin que les messages en échec restent disponibles plus longtemps"
    ],
    correct: [0],
    explain: "Un sujet de lettres mortes reçoit les messages qui dépassent le nombre maximal de tentatives de livraison : l'abonnement n'est plus encombré et les messages restent disponibles pour être analysés. Un délai d'accusé de réception à zéro provoquerait des renvois immédiats. Recréer l'abonnement perd les messages en attente. La rétention conserve les messages plus longtemps, elle ne les isole pas."
  },
  {
    id: "d3-21", domain: 3,
    topic: "bigquery", difficulty: 2,
    doc: "https://docs.cloud.google.com/bigquery/docs/best-practices-performance-compute",
    q: "Une table BigQuery de 5 To, non clusterisée, contient des événements et presque toutes les requêtes portent sur la dernière semaine. Les coûts à la demande sont élevés. Quelles pratiques réduisent le volume de données analysé ?",
    options: [
      "Partitionner la table sur la date de l'événement et filtrer sur cette colonne dans les requêtes",
      "Sélectionner uniquement les colonnes nécessaires plutôt que `SELECT *`",
      "Ajouter `LIMIT 1000` à chaque requête afin de n'obtenir qu'un échantillon des lignes de la table",
      "Ajouter une clause `ORDER BY` sur la date pour que BigQuery lise d'abord les lignes récentes"
    ],
    correct: [0, 1],
    explain: "BigQuery facture les octets lus. Le partitionnement permet de ne lire que les partitions concernées, et son stockage en colonnes fait qu'on ne paie que les colonnes sélectionnées. `LIMIT` réduit le nombre de lignes renvoyées mais pas les octets lus (sur une table non clusterisée), et `ORDER BY` n'en réduit aucun."
  },
  {
    id: "d3-22", domain: 3,
    topic: "iac", difficulty: 3,
    doc: "https://docs.cloud.google.com/docs/terraform/resource-management/store-state",
    q: "Une équipe de plusieurs personnes gère son infrastructure avec Terraform. L'état doit être partagé entre les membres, et deux exécutions simultanées ne doivent pas se marcher dessus. Que faites-vous ?",
    options: [
      "Stocker l'état dans un bucket Cloud Storage avec le backend `gcs`, qui verrouille l'état pendant les opérations",
      "Versionner le fichier `terraform.tfstate` dans le dépôt Git",
      "Garder l'état en local sur le poste de la personne qui lance les déploiements",
      "Envoyer le fichier d'état par e-mail avant chaque déploiement"
    ],
    correct: [0],
    explain: "Un backend distant dans Cloud Storage partage l'état entre les membres et le verrouille pendant `plan` et `apply`, ce qui évite les exécutions concurrentes. Le dépôt Git ne verrouille rien, provoque des conflits et expose des valeurs sensibles contenues dans l'état. Un état local ou envoyé par e-mail se désynchronise vite et n'est pas protégé."
  },
  {
    id: "d3-23", domain: 3,
    topic: "compute", difficulty: 1,
    doc: "https://docs.cloud.google.com/compute/docs/ip-addresses/configure-static-external-ip-address",
    q: "L'adresse IP externe d'une VM change à chaque arrêt puis redémarrage, alors qu'un enregistrement DNS pointe dessus. Que faites-vous ?",
    options: [
      "Réserver une adresse IP externe statique et l'attribuer à la VM",
      "Modifier à la main l'enregistrement DNS après chaque redémarrage de la VM",
      "Remplacer son adresse externe par une adresse IP interne dans le même sous-réseau",
      "Passer la VM à un type de machine plus grand pour stabiliser son adressage réseau"
    ],
    correct: [0],
    explain: "Une adresse externe éphémère est libérée quand la VM s'arrête ; une adresse statique réservée reste attachée au projet et peut être attribuée à la VM, ce qui stabilise l'enregistrement DNS. Corriger le DNS à la main est fragile. Une adresse interne n'est pas joignable depuis Internet, et la taille de la machine n'a aucun effet sur son adresse."
  },
  {
    id: "d3-24", domain: 3,
    topic: "compute", difficulty: 2,
    doc: "https://docs.cloud.google.com/compute/docs/images/create-custom",
    q: "Chaque VM d'une flotte installe 3 Go de logiciels à son démarrage, ce qui est lent. Vous voulez démarrer plus vite avec des VM toutes identiques. Que faites-vous ?",
    options: [
      "Créer une image personnalisée qui contient déjà les logiciels, puis créer les VM à partir d'elle",
      "Augmenter la taille du disque de démarrage de chaque VM pour accélérer les installations",
      "Remplacer le script de démarrage par un second script qui lance les installations en parallèle",
      "Utiliser des VM Spot, dont le démarrage est plus rapide que celui des VM standard"
    ],
    correct: [0],
    explain: "Une image personnalisée fige le système et les logiciels déjà installés : les VM créées à partir d'elle démarrent prêtes, et toutes sont identiques. Un disque plus grand n'accélère pas l'installation, un script parallèle reste long, et le type de provisionnement (Spot) n'a pas d'effet sur la durée des installations."
  },
  {
    id: "d3-25", domain: 3,
    topic: "serverless", difficulty: 2,
    doc: "https://docs.cloud.google.com/run/docs/execute/jobs-on-schedule",
    q: "Un traitement de nettoyage de données doit s'exécuter chaque nuit, aller jusqu'à son terme puis s'arrêter, sans écouter de requêtes HTTP. Quelle solution est adaptée ?",
    options: [
      "Un job Cloud Run, déclenché chaque nuit par Cloud Scheduler et arrêté à la fin",
      "Un service Cloud Run configuré avec au moins une instance active en permanence",
      "Un cluster GKE Standard dimensionné pour absorber le pic d'activité de la nuit",
      "Une VM Compute Engine standard allumée en continu avec une tâche planifiée"
    ],
    correct: [0],
    explain: "Un job Cloud Run exécute un conteneur jusqu'à sa fin sans serveur HTTP, et Cloud Scheduler peut le déclencher selon un calendrier : vous ne payez que pendant l'exécution. Un service Cloud Run attend des requêtes, un cluster GKE ou une VM allumés en continu coûtent même quand rien ne tourne."
  },
  {
    id: "d3-26", domain: 3,
    topic: "gke", difficulty: 3,
    doc: "https://docs.cloud.google.com/kubernetes-engine/docs/concepts/network-isolation",
    q: "La politique de sécurité interdit que les nœuds d'un cluster GKE aient une adresse IP publique. Quelle configuration appliquez-vous à la création du cluster ?",
    options: [
      "Un cluster privé, dont les nœuds n'ont que des adresses IP internes",
      "Un pare-feu qui refuse tout le trafic entrant sur les nœuds du cluster",
      "Un cluster zonal plutôt qu'un cluster régional, pour limiter les adresses utilisées",
      "Un pool de nœuds qui s'appuie uniquement sur des VM Spot, sans adresse stable"
    ],
    correct: [0],
    explain: "Dans un cluster privé, les nœuds n'ont que des adresses IP internes (leur accès sortant à Internet passe par Cloud NAT si nécessaire). Un pare-feu bloque du trafic mais n'enlève pas l'adresse publique. Zonal ou régional, et Spot ou non, ne changent rien au fait que les nœuds aient ou non une adresse publique."
  },
  {
    id: "d3-27", domain: 3,
    topic: "gke", difficulty: 1,
    doc: "https://docs.cloud.google.com/artifact-registry/docs/overview",
    q: "Votre équipe construit des images de conteneurs qu'elle veut stocker de façon privée dans Google Cloud, avant de les déployer sur GKE. Quel service utilisez-vous ?",
    options: [
      "Artifact Registry",
      "Un bucket Cloud Storage en accès public",
      "Secret Manager",
      "Cloud Source Repositories"
    ],
    correct: [0],
    explain: "Artifact Registry est le service géré de Google Cloud pour stocker des images de conteneurs et d'autres artefacts (paquets), avec des droits IAM par dépôt. Un bucket public exposerait les images, Secret Manager stocke des secrets et non des images, et un dépôt de code source ne sert pas à héberger des images de conteneurs."
  },
  {
    id: "d3-28", domain: 3,
    topic: "messaging", difficulty: 2,
    doc: "https://docs.cloud.google.com/pubsub/docs/push",
    q: "Un abonnement Pub/Sub doit livrer chaque message en l'envoyant directement à un point de terminaison HTTPS de votre application, sans que celle-ci ait à interroger Pub/Sub. Quel type d'abonnement choisissez-vous ?",
    options: [
      "Un abonnement push, livré à votre URL",
      "Un abonnement pull",
      "Un abonnement avec écriture dans BigQuery",
      "Un abonnement avec un sujet de lettres mortes"
    ],
    correct: [0],
    explain: "Avec un abonnement push, Pub/Sub envoie chaque message à une URL HTTPS que vous indiquez ; avec un abonnement pull, c'est l'application qui interroge Pub/Sub. L'écriture dans BigQuery stocke les messages dans une table, et un sujet de lettres mortes recueille les messages qui échouent, sans définir le mode de livraison."
  },
  {
    id: "d3-29", domain: 3,
    topic: "networking", difficulty: 2,
    doc: "https://docs.cloud.google.com/firewall/docs/firewalls",
    q: "Vous voulez autoriser le trafic SSH (TCP 22) uniquement vers les VM d'administration d'un VPC, et pas vers les autres VM. Comment limitez-vous la règle de pare-feu à ces VM ?",
    options: [
      "Cibler la règle avec une balise réseau (ou un compte de service) portée uniquement par ces VM",
      "Configurer le pare-feu du système d'exploitation de chaque VM, sans règle de pare-feu VPC",
      "Appliquer la règle à tout le VPC, puis désactiver SSH à la main dans les autres VM",
      "Placer les VM d'administration dans un projet distinct pour qu'elles ne soient plus filtrées"
    ],
    correct: [0],
    explain: "Une règle de pare-feu VPC peut cibler toutes les instances, des instances portant une balise réseau ou des instances utilisant un compte de service précis : seules les VM concernées reçoivent l'autorisation. Se passer des règles VPC pour gérer chaque VM à la main est fragile, ouvrir à tout le VPC expose toutes les VM, et changer de projet ne règle pas le filtrage."
  },
  {
    id: "d3-30", domain: 3,
    topic: "iac", difficulty: 2,
    doc: "https://docs.cloud.google.com/build/docs/triggers",
    q: "À chaque envoi (push) sur la branche principale d'un dépôt, vous voulez construire automatiquement l'image du conteneur puis la déployer sur Cloud Run. Quel service orchestre ce traitement ?",
    options: [
      "Cloud Build, avec un déclencheur lié à la branche du dépôt",
      "Cloud Scheduler, avec une tâche lancée toutes les minutes",
      "Pub/Sub, avec un abonnement pull consulté par un script",
      "Cloud Logging, avec un récepteur vers un bucket Cloud Storage"
    ],
    correct: [0],
    explain: "Cloud Build exécute des étapes de construction et de déploiement décrites dans un fichier de configuration, et un déclencheur le lance automatiquement à chaque push. Cloud Scheduler lance des tâches à heure fixe sans lien avec le dépôt, Pub/Sub transporte des messages, et un récepteur de journaux exporte des logs : aucun ne construit ni ne déploie."
  },
  {
    id: "d3-31", domain: 3,
    topic: "compute", difficulty: 2,
    doc: "https://docs.cloud.google.com/compute/docs/instance-groups/regional-migs",
    q: "Un site web tourne sur un groupe d'instances géré et doit rester disponible même si toute une zone de la région tombe en panne. Quelle configuration choisissez-vous ?",
    options: [
      "Un groupe d'instances géré régional, qui répartit les VM sur plusieurs zones",
      "Un groupe d'instances géré zonal, avec un autoscaler réglé sur 10 VM au minimum",
      "Un groupe d'instances géré zonal, dont la réparation automatique est activée",
      "Un groupe de VM Spot placées dans une seule zone pour limiter les risques de panne"
    ],
    correct: [0],
    explain: "Un groupe d'instances géré régional répartit ses VM sur plusieurs zones de la région : si une zone tombe, les VM des autres zones continuent de servir. Un groupe zonal reste dans une seule zone : l'autoscaler comme la réparation automatique recréent des VM, mais dans cette même zone. Les VM Spot n'apportent pas non plus de protection contre la panne d'une zone."
  },
  {
    id: "d3-32", domain: 3,
    topic: "serverless", difficulty: 2,
    doc: "https://docs.cloud.google.com/run/docs/configuring/min-instances",
    q: "Un service Cloud Run reçoit très peu de trafic la nuit. Le premier utilisateur du matin subit un délai dû au démarrage d'une instance. Comment réduire ce délai en gardant un service géré ?",
    options: [
      "Définir un nombre minimal d'instances (par exemple 1), pour qu'une instance reste prête",
      "Porter la mémoire de chaque instance à la valeur maximale autorisée par Cloud Run",
      "Fixer la concurrence à 1 requête par instance, pour que chaque requête ait son instance",
      "Remplacer le service par un job Cloud Run déclenché toutes les minutes par un planificateur"
    ],
    correct: [0],
    explain: "Un nombre minimal d'instances garde des instances actives même sans trafic, ce qui évite les démarrages lents lorsque le service repart de zéro ; en contrepartie, ces instances inactives sont facturées. Plus de mémoire ne supprime pas le délai de démarrage, une concurrence de 1 oblige à créer davantage d'instances, et un job planifié ne sert pas de requêtes HTTP."
  },
  {
    id: "d3-33", domain: 3,
    topic: "storage", difficulty: 1,
    doc: "https://docs.cloud.google.com/sdk/gcloud/reference/storage/rsync",
    q: "Vous devez synchroniser régulièrement un dossier local avec un bucket Cloud Storage, en ne transférant que les fichiers nouveaux ou modifiés. Quelle commande utilisez-vous ?",
    options: [
      "`gcloud storage rsync dossier gs://mon-bucket --recursive`, qui ne transfère que les différences",
      "`gcloud storage cp --recursive dossier gs://mon-bucket`, qui copie tous les fichiers à chaque exécution",
      "`gcloud storage mv dossier gs://mon-bucket`, qui déplace les fichiers vers le bucket",
      "`gcloud storage ls gs://mon-bucket --recursive`, qui compare les deux emplacements"
    ],
    correct: [0],
    explain: "`gcloud storage rsync` compare la source et la destination et ne transfère que ce qui diffère ; `--recursive` inclut les sous-dossiers. `cp` recopie les fichiers à chaque exécution, `mv` déplace (et supprime la source), et `ls` ne fait que lister : il ne compare ni ne transfère rien."
  },
  {
    id: "d3-34", domain: 3,
    topic: "networking", difficulty: 2,
    doc: "https://docs.cloud.google.com/dns/docs/overview",
    q: "Les VM d'un VPC doivent se joindre par des noms internes comme `base.interne.entreprise`, sans que ces noms soient exposés sur Internet. Que configurez-vous ?",
    options: [
      "Une zone Cloud DNS privée, visible uniquement depuis le réseau VPC autorisé",
      "Une zone Cloud DNS publique avec des enregistrements pointant vers les adresses internes",
      "Un fichier `/etc/hosts` copié à la main sur chacune des VM du réseau",
      "Une règle de pare-feu qui autorise le trafic DNS entre les VM du réseau"
    ],
    correct: [0],
    explain: "Une zone Cloud DNS privée n'est visible que depuis les réseaux VPC auxquels on l'attache : les VM résolvent les noms internes sans qu'ils soient publiés sur Internet. Une zone publique exposerait ces noms et ces adresses. Un fichier `hosts` copié à la main se désynchronise vite, et une règle de pare-feu autorise du trafic sans fournir de résolution de noms."
  },
  {
    id: "d3-35", domain: 3,
    topic: "iac", difficulty: 2,
    doc: "https://docs.cloud.google.com/deploy/docs/overview",
    q: "Vous voulez livrer une application vers des environnements successifs (développement, recette, production) sur GKE ou Cloud Run, avec une promotion contrôlée d'une cible à la suivante. Quel service est conçu pour cela ?",
    options: [
      "Cloud Deploy, avec un pipeline de livraison et des cibles successives à promouvoir",
      "Cloud Scheduler, avec une tâche planifiée pour chaque environnement",
      "Artifact Registry, qui promeut automatiquement les images d'un environnement à l'autre",
      "Secret Manager, avec une version de secret distincte pour chaque environnement"
    ],
    correct: [0],
    explain: "Cloud Deploy gère la livraison continue : un pipeline de livraison définit les cibles successives et la promotion des versions de l'une à l'autre, avec d'éventuelles approbations. Cloud Scheduler lance des tâches à heure fixe, Artifact Registry stocke des artefacts sans orchestrer de déploiements, et Secret Manager stocke des secrets."
  },

  /* ------------------------------------------------------------------
     DOMAINE 4 — Assurer le bon fonctionnement d'une solution cloud
     ------------------------------------------------------------------ */
  {
    id: "d4-01", domain: 4,
    topic: "disks", difficulty: 1,
    doc: "https://docs.cloud.google.com/compute/docs/disks/scheduled-snapshots",
    q: "Les disques persistants de vos VM de production doivent être sauvegardés chaque nuit, avec 14 jours de rétention, sans intervention manuelle. Quelle est la solution la plus simple ?",
    options: [
      "Créer une planification d'instantanés et l'associer aux disques",
      "Écrire une tâche cron sur chaque VM qui copie le disque vers Cloud Storage",
      "Créer chaque nuit une image personnalisée à la main",
      "Remplacer les disques par des disques SSD locaux"
    ],
    correct: [0],
    explain: "Une planification d'instantanés (une règle de ressource) crée automatiquement les instantanés à la fréquence voulue et applique la rétention. Une tâche cron par VM est fragile et à maintenir. Les images personnalisées servent à créer de nouvelles VM, pas à la sauvegarde régulière, et l'opération manuelle ne tient pas dans la durée. Les SSD locaux sont éphémères : leurs données disparaissent à l'arrêt de la VM."
  },
  {
    id: "d4-02", domain: 4,
    topic: "compute", difficulty: 3,
    doc: "https://docs.cloud.google.com/compute/docs/instance-groups/rolling-out-updates-to-managed-instance-groups",
    q: "Un groupe d'instances géré de 10 VM doit adopter un nouveau modèle d'instance sans jamais réduire la capacité disponible. Quelle méthode utilisez-vous ?",
    options: [
      "Une mise à jour progressive (`rolling-action start-update`) avec `max-unavailable` à 0 et `max-surge` supérieur à 0",
      "Supprimer le groupe puis le recréer avec le nouveau modèle",
      "Arrêter toutes les VM, modifier chaque disque de démarrage, puis redémarrer",
      "Une mise à jour progressive avec `max-surge` à 0 et `max-unavailable` à 10"
    ],
    correct: [0],
    explain: "La mise à jour progressive d'un MIG remplace les VM par lots. `max-unavailable=0` garantit qu'aucune VM en service n'est retirée avant que sa remplaçante soit prête, et `max-surge` autorise la création temporaire de VM supplémentaires. Supprimer le groupe ou arrêter toutes les VM provoque une interruption. `max-unavailable=10` autorise le remplacement des 10 VM en même temps, donc une coupure complète."
  },
  {
    id: "d4-03", domain: 4,
    topic: "compute", difficulty: 1,
    doc: "https://docs.cloud.google.com/compute/docs/instances/changing-machine-type-of-stopped-instance",
    q: "Une VM `e2-medium` manque de mémoire. Vous voulez la passer en `e2-standard-4` en conservant son disque et ses données. Quelle procédure suivez-vous ?",
    options: [
      "Arrêter la VM, modifier son type de machine, puis la redémarrer",
      "Modifier le type de machine pendant que la VM tourne : le changement est appliqué à chaud",
      "Supprimer la VM et son disque, puis en recréer une plus grosse",
      "Ajouter un second disque persistant pour augmenter la mémoire"
    ],
    correct: [0],
    explain: "Le type de machine ne se modifie que sur une VM arrêtée (`gcloud compute instances set-machine-type`). Le disque persistant et ses données sont conservés. Le changement à chaud n'est pas possible. Supprimer le disque ferait perdre les données. Un disque ajoute du stockage, pas de la mémoire vive."
  },
  {
    id: "d4-04", domain: 4,
    topic: "gke", difficulty: 2,
    doc: "https://docs.cloud.google.com/kubernetes-engine/docs/concepts/node-pools",
    q: "Votre cluster GKE Standard tourne sur des nœuds `e2-standard-4`. Une nouvelle charge de travail exige des nœuds à mémoire élevée, sans perturber les charges existantes. Que faites-vous ?",
    options: [
      "Ajouter au cluster un nouveau pool de nœuds avec le type de machine adapté et y planifier la charge",
      "Modifier le type de machine du pool de nœuds existant pendant qu'il fonctionne",
      "Créer un second cluster dans un autre projet",
      "Augmenter le nombre de réplicas du Deployment"
    ],
    correct: [0],
    explain: "Un cluster GKE peut contenir plusieurs pools de nœuds de configurations différentes ; on cible le bon pool avec un sélecteur de nœuds ou des taints et tolérances. Changer le type de machine d'un pool existant impose de recréer tous ses nœuds, ce qui perturbe les charges en place. Un second cluster complique l'exploitation sans raison. Ajouter des réplicas ne donne pas plus de mémoire par nœud."
  },
  {
    id: "d4-05", domain: 4,
    topic: "logging", difficulty: 2,
    doc: "https://docs.cloud.google.com/logging/docs/export/configure_export_v2",
    q: "L'équipe data veut croiser en SQL les journaux applicatifs avec ses propres tables BigQuery, sur plusieurs mois. Comment acheminez-vous les journaux ?",
    options: [
      "Créer un récepteur (sink) Cloud Logging dont la destination est un ensemble de données BigQuery",
      "Créer un récepteur vers un sujet Pub/Sub",
      "Télécharger les journaux depuis l'explorateur de journaux chaque semaine",
      "Installer l'agent Ops sur toutes les VM"
    ],
    correct: [0],
    explain: "Un récepteur du routeur de journaux envoie en continu les entrées correspondant à un filtre vers une destination : BigQuery pour l'analyse SQL, Cloud Storage pour l'archivage, Pub/Sub pour l'intégration avec des outils tiers. Pub/Sub sert à diffuser les journaux, pas à les interroger en SQL. Un téléchargement manuel est limité et non automatisé. L'agent Ops collecte journaux et métriques sur les VM mais ne les route pas vers BigQuery."
  },
  {
    id: "d4-06", domain: 4,
    topic: "monitoring", difficulty: 1,
    doc: "https://docs.cloud.google.com/monitoring/alerts",
    q: "L'astreinte doit recevoir un e-mail et une notification quand l'utilisation CPU d'un groupe de VM dépasse 80 % pendant 5 minutes. Que configurez-vous ?",
    options: [
      "Une règle d'alerte Cloud Monitoring avec une condition sur la métrique CPU et des canaux de notification",
      "Un budget Cloud Billing avec un seuil à 80 %",
      "Une métrique basée sur les journaux dans Cloud Logging, sans autre réglage",
      "Un test de disponibilité (uptime check) sur l'adresse IP des VM"
    ],
    correct: [0],
    explain: "Une règle d'alerte Cloud Monitoring associe une condition (métrique, seuil, durée) à des canaux de notification (e-mail, SMS, application mobile, Pub/Sub…). Un budget surveille la dépense, pas le CPU. Une métrique basée sur les journaux ne notifie personne toute seule, et le CPU est déjà une métrique système. Un test de disponibilité vérifie qu'un point d'accès répond, pas sa charge."
  },
  {
    id: "d4-07", domain: 4,
    topic: "monitoring", difficulty: 1,
    doc: "https://docs.cloud.google.com/monitoring/agent/ops-agent",
    q: "Dans Cloud Monitoring, vous voyez le CPU et le réseau de vos VM, mais ni l'utilisation mémoire ni les journaux de l'application. Que devez-vous faire ?",
    options: [
      "Installer l'agent Ops sur les VM",
      "Activer l'API Compute Engine",
      "Ajouter un disque persistant dédié aux journaux",
      "Créer un tableau de bord personnalisé"
    ],
    correct: [0],
    explain: "Sans agent, Compute Engine ne remonte que les métriques visibles depuis l'hyperviseur (CPU, réseau, E/S disque). L'agent Ops, installé dans la VM, collecte la mémoire, l'occupation des disques et les journaux système et applicatifs. L'API Compute Engine est forcément déjà active puisque les VM existent. Un disque ou un tableau de bord n'ajoute aucune collecte de données."
  },
  {
    id: "d4-08", domain: 4,
    topic: "storage", difficulty: 2,
    doc: "https://docs.cloud.google.com/storage/docs/object-versioning",
    q: "Des fichiers importants d'un bucket ont été écrasés par erreur. Vous voulez pouvoir restaurer une version précédente à l'avenir, tout en évitant que le coût de stockage grimpe indéfiniment. Quelles actions combinez-vous ?",
    options: [
      "Activer la gestion des versions d'objets sur le bucket",
      "Ajouter une règle de cycle de vie qui supprime les versions non actuelles au-delà d'un certain âge ou d'un certain nombre",
      "Passer le bucket en classe Archive",
      "Rendre le bucket public en lecture",
      "Désactiver l'accès uniforme au niveau du bucket"
    ],
    correct: [0, 1],
    explain: "Avec la gestion des versions, un objet écrasé ou supprimé devient une version non actuelle qu'on peut restaurer. Chaque version étant facturée, une règle de cycle de vie (conditions sur l'ancienneté ou le nombre de versions plus récentes) borne le coût. Changer de classe de stockage ne protège pas contre l'écrasement. Rendre le bucket public expose les données. Le mode de contrôle d'accès est sans rapport avec la restauration."
  },
  {
    id: "d4-09", domain: 4,
    topic: "databases", difficulty: 3,
    doc: "https://docs.cloud.google.com/sql/docs/mysql/backup-recovery/pitr",
    q: "Une erreur de manipulation a supprimé des lignes dans une base Cloud SQL pour MySQL à 14 h 32. Vous voulez retrouver l'état de 14 h 30. Qu'est-ce qui devait être activé au préalable ?",
    options: [
      "Les sauvegardes automatiques et la récupération à un moment précis (journalisation binaire)",
      "Uniquement une instance dupliquée en lecture",
      "Uniquement la configuration haute disponibilité",
      "Un export SQL hebdomadaire vers Cloud Storage"
    ],
    correct: [0],
    explain: "La récupération à un moment précis (PITR) rejoue les journaux de transactions à partir d'une sauvegarde automatique : il faut donc les sauvegardes automatiques et, pour MySQL, la journalisation binaire. La restauration crée une nouvelle instance (clone) à l'instant voulu. Une instance dupliquée et l'instance de secours de la haute disponibilité répliquent aussi la suppression. Un export hebdomadaire ne permet pas de revenir à la minute près."
  },
  {
    id: "d4-10", domain: 4,
    topic: "logging", difficulty: 2,
    doc: "https://docs.cloud.google.com/logging/docs/audit",
    q: "Une VM de production a été supprimée hier. Vous devez savoir qui l'a fait et à quelle heure. Où cherchez-vous ?",
    options: [
      "Dans les journaux d'audit des activités d'administration (Admin Activity) de Cloud Logging",
      "Dans les journaux d'audit d'accès aux données (Data Access)",
      "Dans les journaux de flux VPC",
      "Dans les rapports Cloud Billing"
    ],
    correct: [0],
    explain: "Les journaux Admin Activity enregistrent les appels d'API qui modifient la configuration ou les métadonnées des ressources (création, suppression, changement IAM), avec l'identité de l'appelant. Ils sont toujours activés et conservés 400 jours. Les journaux Data Access tracent la lecture et l'écriture de données et sont désactivés par défaut pour la plupart des services. Les journaux de flux VPC décrivent le trafic réseau. Les rapports de facturation ne montrent que les coûts."
  },
  {
    id: "d4-11", domain: 4,
    topic: "gke", difficulty: 1,
    doc: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-back-a-deployment",
    q: "Après la mise à jour de l'image d'un Deployment GKE nommé `web`, les nouveaux pods plantent au démarrage. Quelle commande rétablit le plus vite la version précédente ?",
    options: [
      "`kubectl rollout undo deployment/web`",
      "`kubectl delete deployment web`",
      "`kubectl scale deployment web --replicas=0`",
      "`gcloud container clusters upgrade`"
    ],
    correct: [0],
    explain: "`kubectl rollout undo` ramène le Deployment à sa révision précédente par une mise à jour progressive. Supprimer le Deployment ou le réduire à zéro pod coupe complètement le service. `clusters upgrade` met à niveau la version de Kubernetes du cluster, sans rapport avec l'image de l'application."
  },
  {
    id: "d4-12", domain: 4,
    topic: "monitoring", difficulty: 1,
    doc: "https://docs.cloud.google.com/trace/docs/overview",
    q: "Une requête utilisateur traverse cinq microservices et dure parfois plus de 4 secondes. Vous voulez identifier quel service introduit la latence. Quel outil utilisez-vous ?",
    options: ["Cloud Trace", "Cloud Profiler", "Error Reporting", "Les journaux de flux VPC"],
    correct: [0],
    explain: "Cloud Trace suit une requête de bout en bout et montre le temps passé dans chaque service (les spans). Cloud Profiler analyse la consommation CPU et mémoire du code à l'intérieur d'un service. Error Reporting regroupe les exceptions applicatives. Les journaux de flux VPC échantillonnent les connexions réseau sans relier les appels d'une même requête."
  },
  {
    id: "d4-13", domain: 4,
    topic: "disks", difficulty: 3,
    doc: "https://docs.cloud.google.com/compute/docs/disks/snapshots",
    q: "Quelles affirmations sur les instantanés (snapshots) de disques persistants Compute Engine sont exactes ?",
    options: [
      "Ils sont incrémentiels : seuls les blocs modifiés depuis l'instantané précédent sont stockés",
      "Un instantané peut servir à créer un disque dans une autre zone ou une autre région",
      "Il faut obligatoirement arrêter la VM pour créer un instantané",
      "Un instantané ne peut être restauré que dans la zone du disque d'origine",
      "Supprimer un instantané rend inutilisables tous les instantanés suivants de la chaîne"
    ],
    correct: [0, 1],
    explain: "Les instantanés sont incrémentiels et constituent une ressource globale : on peut créer un disque à partir d'un instantané dans n'importe quelle zone ou région, ce qui en fait un moyen de déplacer un disque. On peut les prendre sur un disque en cours d'utilisation (il est seulement conseillé de vider les tampons applicatifs pour la cohérence). À la suppression d'un instantané, les données nécessaires aux suivants sont reportées sur l'instantané suivant : la chaîne reste utilisable."
  },
  {
    id: "d4-14", domain: 4,
    topic: "logging", difficulty: 2,
    doc: "https://docs.cloud.google.com/logging/docs/export/configure_export_v2",
    q: "Des journaux d'audit doivent être conservés cinq ans pour la conformité, au moindre coût, et ne seront presque jamais consultés. Que faites-vous ?",
    options: [
      "Créer un récepteur de journaux qui les exporte vers un bucket Cloud Storage de classe Archive",
      "Porter la rétention des buckets de journaux de Cloud Logging à cinq ans",
      "Créer un récepteur qui les envoie vers un sujet Pub/Sub",
      "Copier les journaux à la main chaque mois"
    ],
    correct: [0],
    explain: "Un récepteur de journaux exporte automatiquement les entrées vers Cloud Storage ; la classe Archive est la moins chère pour des données quasiment jamais lues. Conserver cinq ans dans Cloud Logging est possible mais plus coûteux pour ce besoin. Pub/Sub transporte des messages, il ne les stocke pas durablement. Une copie manuelle est source d'oublis."
  },
  {
    id: "d4-15", domain: 4,
    topic: "monitoring", difficulty: 1,
    doc: "https://docs.cloud.google.com/monitoring/uptime-checks",
    q: "Vous voulez être prévenu par e-mail dès que votre site public ne répond plus quand on l'interroge depuis l'extérieur. Que configurez-vous dans Cloud Monitoring ?",
    options: [
      "Un contrôle de disponibilité et une règle d'alerte avec un canal de notification par e-mail",
      "Un récepteur de journaux qui exporte les journaux de l'application vers un jeu de données BigQuery",
      "Une alerte de budget de facturation",
      "Un tableau de bord Cloud Trace"
    ],
    correct: [0],
    explain: "Un contrôle de disponibilité interroge périodiquement le service depuis plusieurs régions, et une règle d'alerte envoie une notification (e-mail, par exemple) quand il échoue. Un récepteur de journaux exporte des données sans alerter. Une alerte de budget concerne les coûts. Cloud Trace sert à analyser la latence des requêtes."
  },
  {
    id: "d4-17", domain: 4,
    topic: "compute", difficulty: 2,
    doc: "https://docs.cloud.google.com/compute/docs/instances/setting-vm-host-options",
    q: "Google doit effectuer une maintenance sur le serveur physique qui héberge une VM Compute Engine standard. Que se passe-t-il par défaut pour cette VM ?",
    options: [
      "Elle est migrée à chaud vers un autre hôte, sans redémarrage",
      "Elle est arrêtée puis redémarrée automatiquement sur un nouvel hôte",
      "Elle est supprimée et vous devez la recréer à partir d'un instantané",
      "Elle reste sur place et la maintenance attend votre prochaine mise à jour"
    ],
    correct: [0],
    explain: "Par défaut, Compute Engine migre à chaud la VM vers un autre hôte pendant la maintenance (propriété `onHostMaintenance` à `MIGRATE`), sans redémarrage. Seules les VM Spot et préemptibles, ou celles qui ne prennent pas en charge la migration (par exemple avec des GPU), sont arrêtées pendant la maintenance. Une VM n'est pas supprimée, et la maintenance de l'hôte n'attend pas votre accord."
  },
  {
    id: "d4-18", domain: 4,
    topic: "disks", difficulty: 2,
    doc: "https://docs.cloud.google.com/compute/docs/disks/resize-persistent-disk",
    q: "Le disque persistant d'une VM de production est plein à 95 %. Vous voulez augmenter sa capacité en limitant l'interruption. Que faites-vous ?",
    options: [
      "Augmenter la taille du disque, puis étendre la partition et le système de fichiers dans la VM",
      "Arrêter la VM et supprimer le disque, car un disque persistant ne peut jamais être agrandi",
      "Créer un second disque que Compute Engine fusionne automatiquement avec le premier",
      "Réduire d'abord la taille du disque, puis la réaugmenter pour libérer de l'espace utilisable"
    ],
    correct: [0],
    explain: "La taille d'un disque persistant peut être augmentée, y compris lorsqu'il est attaché à une VM en marche ; il faut ensuite étendre la partition et le système de fichiers pour utiliser l'espace ajouté. Un disque ne peut pas être réduit, et Compute Engine ne fusionne pas automatiquement plusieurs disques."
  },
  {
    id: "d4-19", domain: 4,
    topic: "storage", difficulty: 3,
    doc: "https://docs.cloud.google.com/storage/docs/bucket-lock",
    q: "Une réglementation impose que les objets d'un bucket ne puissent être ni modifiés ni supprimés pendant un an, même par un administrateur. Que configurez-vous ?",
    options: [
      "Une politique de rétention d'un an sur le bucket, puis son verrouillage (Bucket Lock)",
      "La gestion des versions d'objets sur le bucket, avec conservation des anciennes versions",
      "Une règle de cycle de vie qui archive les objets au bout d'un an dans une classe moins chère",
      "Un rôle IAM en lecture seule attribué à tous les administrateurs du projet concernés"
    ],
    correct: [0],
    explain: "Une politique de rétention empêche de supprimer ou de remplacer un objet avant la fin de la durée fixée ; une fois verrouillée (Bucket Lock), elle ne peut plus être réduite ni supprimée, même par un administrateur. Les versions conservent d'anciennes copies sans empêcher la suppression, le cycle de vie change la classe de stockage, et un rôle IAM peut toujours être modifié par un administrateur."
  },
  {
    id: "d4-20", domain: 4,
    topic: "monitoring", difficulty: 3,
    doc: "https://docs.cloud.google.com/monitoring/settings/multiple-projects",
    q: "Votre organisation compte douze projets. Vous voulez consulter les métriques et les tableaux de bord de tous ces projets depuis une seule vue Cloud Monitoring. Que configurez-vous ?",
    options: [
      "Une étendue de métriques (metrics scope) qui regroupe les projets autour d'un projet central",
      "Un compte de service avec le rôle Lecteur dans chacun des douze projets, utilisé par un script",
      "Une exportation hebdomadaire des métriques de chaque projet vers un fichier au format CSV",
      "Un VPC partagé qui relie les douze projets au même réseau de supervision"
    ],
    correct: [0],
    explain: "Une étendue de métriques définit quels projets un projet central peut surveiller : ses tableaux de bord et alertes affichent alors les données des projets ajoutés. Un script avec un compte de service ou des exports CSV ne donnent pas une vue Cloud Monitoring unifiée, et un VPC partagé concerne le réseau, pas la supervision."
  },
  {
    id: "d4-21", domain: 4,
    topic: "logging", difficulty: 2,
    doc: "https://docs.cloud.google.com/logging/docs/logs-based-metrics",
    q: "Vous voulez être alerté quand l'application consigne plus de 50 erreurs « payment failed » par minute dans ses journaux. Que mettez-vous en place ?",
    options: [
      "Une métrique basée sur les journaux, puis une règle d'alerte sur cette métrique",
      "Un contrôle de disponibilité sur la page d'accueil du site public",
      "Un récepteur de journaux qui exporte toutes les entrées vers Cloud Storage",
      "Une alerte de budget de facturation envoyée aux administrateurs du projet"
    ],
    correct: [0],
    explain: "Une métrique basée sur les journaux compte les entrées qui correspondent à un filtre (ici le message d'erreur) ; Cloud Monitoring peut alors déclencher une alerte quand le taux dépasse un seuil. Un contrôle de disponibilité teste l'accès au site, un récepteur vers Cloud Storage archive sans alerter, et un budget concerne les coûts."
  },
  {
    id: "d4-22", domain: 4,
    topic: "gke", difficulty: 2,
    doc: "https://docs.cloud.google.com/kubernetes-engine/docs/concepts/maintenance-windows-and-exclusions",
    q: "Les mises à jour automatiques de votre cluster GKE ont lieu en pleine journée de travail. Vous voulez qu'elles se déroulent la nuit, hors des périodes critiques. Que configurez-vous ?",
    options: [
      "Une fenêtre de maintenance sur le cluster, avec d'éventuelles périodes d'exclusion",
      "Un quota de processeurs plus bas pour le projet pendant les heures ouvrées de l'équipe",
      "Un autoscaler de cluster avec un nombre minimal de nœuds plus élevé pendant la journée",
      "Une règle de pare-feu qui bloque le trafic de mise à jour pendant les heures de travail"
    ],
    correct: [0],
    explain: "Une fenêtre de maintenance indique quand GKE peut effectuer les mises à jour automatiques, et les exclusions de maintenance permettent d'éviter des périodes sensibles. Un quota, l'autoscaler ou un pare-feu n'influencent pas le moment des mises à jour du plan de contrôle et des nœuds."
  },
  {
    id: "d4-23", domain: 4,
    topic: "compute", difficulty: 2,
    doc: "https://docs.cloud.google.com/compute/vm-manager/docs/patch",
    q: "Vous devez appliquer les mises à jour de sécurité du système d'exploitation sur 200 VM Linux et Windows, selon un calendrier et avec un rapport de conformité, sans vous connecter à chaque VM. Quelle solution utilisez-vous ?",
    options: [
      "La gestion des correctifs d'OS de VM Manager, avec des déploiements de correctifs planifiés",
      "Un script de démarrage qui lance les mises à jour à chaque redémarrage de chaque VM",
      "Cloud Build, avec un déclencheur qui se connecte en SSH aux VM toutes les nuits",
      "Une règle d'alerte Cloud Monitoring sur la version du système d'exploitation des VM"
    ],
    correct: [0],
    explain: "La gestion des correctifs de VM Manager applique les mises à jour d'OS à une flotte de VM selon un calendrier, avec des rapports sur l'état de chaque VM, sans connexion manuelle. Un script de démarrage ne s'exécute qu'au redémarrage et n'offre ni calendrier ni rapport, Cloud Build n'est pas conçu pour administrer des VM, et une alerte signale un écart sans corriger quoi que ce soit."
  },
  {
    id: "d4-24", domain: 4,
    topic: "monitoring", difficulty: 1,
    doc: "https://docs.cloud.google.com/error-reporting/docs/grouping-errors",
    q: "Votre application consigne des exceptions de toutes sortes. Vous voulez que les erreurs identiques soient regroupées, comptées et signalées, sans lire les journaux un par un. Quel service utilisez-vous ?",
    options: [
      "Error Reporting, qui regroupe et compte les erreurs de l'application",
      "Cloud Trace, qui retrace la latence des requêtes entre les services",
      "Cloud Billing, qui détaille les coûts de chaque service utilisé",
      "Artifact Registry, qui conserve les versions des images déployées"
    ],
    correct: [0],
    explain: "Error Reporting analyse les erreurs consignées par l'application, regroupe celles qui sont identiques, les compte et permet d'être notifié des nouvelles erreurs. Cloud Trace analyse la latence, Cloud Billing les coûts, et Artifact Registry stocke des artefacts : aucun ne regroupe des erreurs."
  },
  {
    id: "d4-25", domain: 4,
    topic: "storage", difficulty: 2,
    doc: "https://docs.cloud.google.com/storage/docs/autoclass",
    q: "Les objets d'un bucket ont des habitudes d'accès imprévisibles : certains restent inutilisés pendant des mois puis redeviennent très consultés. Vous voulez que Cloud Storage ajuste automatiquement leur classe de stockage, sans règles de cycle de vie à maintenir. Qu'activez-vous ?",
    options: [
      "Autoclass, activé sur le bucket pour ajuster seul la classe de chaque objet",
      "Une règle de cycle de vie qui passe tous les objets en Archive après 90 jours",
      "La gestion des versions d'objets, pour conserver les anciennes copies des objets",
      "Une politique de rétention de 90 jours, appliquée à tous les objets du bucket"
    ],
    correct: [0],
    explain: "Autoclass déplace automatiquement chaque objet entre les classes de stockage selon son activité réelle, sans règle à écrire. Une règle de cycle de vie fixe est précisément ce qu'on veut éviter, et elle ne ramène pas un objet redevenu populaire vers une classe plus chaude. Les versions et la rétention n'agissent pas sur la classe de stockage."
  },
  {
    id: "d4-26", domain: 4,
    topic: "bigquery", difficulty: 2,
    doc: "https://docs.cloud.google.com/bigquery/docs/time-travel",
    q: "Une table BigQuery a été vidée par une requête `DELETE` erronée il y a deux jours. Vous voulez retrouver son contenu d'avant l'erreur. Quelle fonctionnalité utilisez-vous ?",
    options: [
      "Le voyage dans le temps (time travel) de BigQuery, avec `FOR SYSTEM_TIME AS OF`",
      "Les instantanés de table que BigQuery crée automatiquement chaque nuit pour toutes les tables",
      "Les journaux d'audit Cloud Logging, qui conservent le contenu des lignes supprimées",
      "La récupération à un instant précis (PITR) de Cloud SQL, appliquée à la table"
    ],
    correct: [0],
    explain: "Le voyage dans le temps permet d'interroger une table telle qu'elle était à un instant passé, dans la fenêtre de conservation (7 jours par défaut), avec `FOR SYSTEM_TIME AS OF`, et donc de restaurer les données supprimées. BigQuery ne crée pas d'instantanés automatiques chaque nuit, les journaux d'audit enregistrent des opérations mais pas le contenu des lignes, et la récupération à un instant précis concerne Cloud SQL, pas BigQuery."
  },

  /* ------------------------------------------------------------------
     DOMAINE 5 — Configurer l'accès et la sécurité
     ------------------------------------------------------------------ */
  {
    id: "d5-01", domain: 5,
    topic: "iam", difficulty: 1,
    doc: "https://docs.cloud.google.com/iam/docs/roles-permissions",
    q: "Un prestataire doit uniquement lire les objets d'un bucket Cloud Storage précis. Quelle attribution respecte le principe du moindre privilège ?",
    options: [
      "Le rôle Lecteur des objets Storage (`roles/storage.objectViewer`) sur ce bucket",
      "Le rôle de base Lecteur (`roles/viewer`) sur le projet",
      "Le rôle Administrateur Storage (`roles/storage.admin`) sur le projet",
      "Le rôle de base Éditeur (`roles/editor`) sur le projet"
    ],
    correct: [0],
    explain: "Le moindre privilège demande le rôle prédéfini le plus étroit, accordé sur la ressource la plus précise : ici Lecteur des objets sur le seul bucket concerné. Le rôle de base Lecteur expose en lecture toutes les ressources du projet. Administrateur Storage et Éditeur permettent en plus de modifier et de supprimer. Les rôles de base sont à éviter en production."
  },
  {
    id: "d5-02", domain: 5,
    topic: "service-accounts", difficulty: 2,
    doc: "https://docs.cloud.google.com/iam/docs/best-practices-service-accounts",
    q: "Une application sur une VM Compute Engine doit écrire dans un seul ensemble de données BigQuery. Quelle configuration est recommandée ?",
    options: [
      "Créer un compte de service dédié, lui accorder le rôle BigQuery nécessaire sur l'ensemble de données, et l'associer à la VM",
      "Garder le compte de service Compute Engine par défaut avec le rôle Éditeur",
      "Générer une clé JSON d'un compte de service et la copier sur le disque de la VM",
      "Enregistrer les identifiants d'un administrateur dans une variable d'environnement"
    ],
    correct: [0],
    explain: "La bonne pratique est un compte de service dédié par application, limité aux rôles nécessaires et associé à la VM : l'application obtient des jetons à courte durée de vie via le serveur de métadonnées, sans aucune clé à gérer. Le compte par défaut avec le rôle Éditeur est beaucoup trop permissif. Une clé JSON sur disque peut fuiter et doit être renouvelée. Utiliser les identifiants d'une personne est à la fois dangereux et fragile."
  },
  {
    id: "d5-03", domain: 5,
    topic: "service-accounts", difficulty: 3,
    doc: "https://docs.cloud.google.com/iam/docs/workload-identity-federation",
    q: "Un pipeline GitHub Actions doit déployer sur Google Cloud. L'équipe sécurité interdit toute clé de compte de service à longue durée de vie. Quelle solution retenez-vous ?",
    options: [
      "La fédération d'identité de charge de travail, qui échange le jeton OIDC de GitHub contre des identifiants Google de courte durée",
      "Une clé JSON de compte de service stockée dans les secrets GitHub et renouvelée chaque année",
      "Le mot de passe d'un utilisateur ayant le rôle Propriétaire",
      "Une clé API restreinte par adresse IP"
    ],
    correct: [0],
    explain: "La fédération d'identité de charge de travail fait confiance à un fournisseur d'identité externe (OIDC, AWS, Azure…) et délivre des jetons de courte durée, sans clé à stocker. Une clé JSON, même dans un coffre de secrets, reste un identifiant à longue durée de vie, précisément ce qui est interdit. Un mot de passe utilisateur est exclu pour une automatisation. Les clés API identifient un projet pour certaines API et n'autorisent pas des déploiements."
  },
  {
    id: "d5-04", domain: 5,
    topic: "service-accounts", difficulty: 2,
    doc: "https://docs.cloud.google.com/kubernetes-engine/docs/concepts/workload-identity",
    q: "Des pods GKE doivent lire un bucket Cloud Storage. Quelle méthode est recommandée pour les authentifier auprès des API Google Cloud ?",
    options: [
      "La fédération d'identité de charge de travail pour GKE, qui relie un compte de service Kubernetes à des autorisations IAM",
      "Monter une clé JSON de compte de service dans un Secret Kubernetes",
      "Donner au compte de service des nœuds le rôle Éditeur du projet",
      "Rendre le bucket public"
    ],
    correct: [0],
    explain: "La fédération d'identité de charge de travail pour GKE (Workload Identity) donne à chaque charge de travail sa propre identité, via son compte de service Kubernetes, sans clé et avec des droits distincts par application. Une clé dans un Secret reste un identifiant longue durée à protéger et à renouveler. Les droits du compte de service des nœuds sont partagés par tous les pods du nœud, et Éditeur est bien trop large. Un bucket public expose les données à tout Internet."
  },
  {
    id: "d5-05", domain: 5,
    topic: "service-accounts", difficulty: 3,
    doc: "https://docs.cloud.google.com/iam/docs/service-account-impersonation",
    q: "Une ingénieure doit lancer ponctuellement des commandes gcloud en se faisant passer pour le compte de service `deploy-sa` (option `--impersonate-service-account`), sans télécharger de clé. Quel rôle lui accordez-vous sur ce compte de service ?",
    options: [
      "Créateur de jetons du compte de service (`roles/iam.serviceAccountTokenCreator`)",
      "Administrateur de clés de compte de service (`roles/iam.serviceAccountKeyAdmin`)",
      "Propriétaire du projet",
      "Lecteur du projet"
    ],
    correct: [0],
    explain: "L'emprunt d'identité repose sur la création de jetons de courte durée pour le compte de service, ce que permet le rôle Créateur de jetons, accordé sur le compte visé. Administrateur de clés permet de créer des clés à longue durée de vie, ce qu'on cherche justement à éviter. Propriétaire est démesuré. Lecteur ne permet pas de générer de jetons."
  },
  {
    id: "d5-06", domain: 5,
    topic: "iam", difficulty: 1,
    doc: "https://docs.cloud.google.com/iam/docs/using-iam-securely",
    q: "Douze développeurs ont besoin des mêmes droits sur un projet, et l'équipe change souvent. Comment gérez-vous leurs accès ?",
    options: [
      "Créer un groupe Google, lui accorder les rôles, puis gérer l'appartenance au groupe",
      "Accorder les rôles à chaque utilisateur individuellement",
      "Partager un compte utilisateur commun à toute l'équipe",
      "Donner à chacun la clé d'un même compte de service"
    ],
    correct: [0],
    explain: "Google recommande d'accorder les rôles à des groupes : la stratégie IAM reste stable et lisible, et les arrivées ou départs se gèrent par l'appartenance au groupe. Les attributions individuelles se multiplient et laissent des accès orphelins. Un compte partagé supprime toute traçabilité dans les journaux d'audit. Les clés de compte de service ne sont pas destinées aux personnes et se propagent sans contrôle."
  },
  {
    id: "d5-07", domain: 5,
    topic: "iam", difficulty: 3,
    doc: "https://docs.cloud.google.com/iam/docs/creating-custom-roles",
    q: "Aucun rôle prédéfini ne correspond exactement à votre besoin et vous envisagez un rôle personnalisé. Quelles affirmations sont exactes ?",
    options: [
      "Un rôle personnalisé se crée au niveau de l'organisation ou d'un projet, mais pas d'un dossier",
      "Vous devez le maintenir vous-même : Google n'y ajoute pas automatiquement les nouvelles autorisations",
      "Un rôle personnalisé peut être créé au niveau d'un dossier",
      "Google met automatiquement à jour vos rôles personnalisés quand un service évolue",
      "Un rôle personnalisé créé dans un projet est utilisable dans tous les projets de l'organisation"
    ],
    correct: [0, 1],
    explain: "Les rôles personnalisés se définissent au niveau de l'organisation (utilisables dans toute l'organisation) ou d'un projet (utilisables dans ce seul projet), jamais d'un dossier. Contrairement aux rôles prédéfinis, entretenus par Google, leur liste d'autorisations est à votre charge. Un rôle créé dans un projet ne peut pas être attribué dans un autre projet."
  },
  {
    id: "d5-08", domain: 5,
    topic: "logging", difficulty: 2,
    doc: "https://docs.cloud.google.com/logging/docs/audit/configure-data-access",
    q: "Un audit exige de savoir qui a lu des objets dans un bucket contenant des données sensibles. Or ces lectures n'apparaissent pas dans Cloud Logging. Pourquoi, et que faites-vous ?",
    options: [
      "Les journaux d'audit d'accès aux données sont désactivés par défaut : il faut les activer pour Cloud Storage",
      "Les journaux Admin Activity sont désactivés : il faut les activer",
      "Cloud Storage ne propose aucune journalisation des lectures",
      "Il faut installer l'agent Ops sur le bucket"
    ],
    correct: [0],
    explain: "Les journaux d'audit Data Access (lecture de données et de métadonnées, écriture de données) sont désactivés par défaut pour la plupart des services, BigQuery excepté, car ils peuvent être volumineux et sont facturés. On les active dans la configuration des journaux d'audit IAM. Les journaux Admin Activity sont toujours actifs et ne couvrent pas la lecture d'objets. Cloud Storage prend bien en charge ces journaux. L'agent Ops s'installe sur des VM, pas sur un bucket."
  },
  {
    id: "d5-09", domain: 5,
    topic: "networking", difficulty: 3,
    doc: "https://docs.cloud.google.com/iap/docs/using-tcp-forwarding",
    q: "Vos VM n'ont pas d'adresse IP externe. Les administrateurs doivent s'y connecter en SSH depuis leur poste, sans bastion ni VPN, avec un contrôle d'accès par IAM. Que mettez-vous en place ?",
    options: [
      "Le transfert TCP d'Identity-Aware Proxy, avec une règle de pare-feu autorisant `35.235.240.0/20` sur le port 22 et le rôle Utilisateur de tunnels sécurisés par IAP",
      "Une adresse IP externe sur chaque VM et une règle autorisant `0.0.0.0/0` sur le port 22",
      "Cloud NAT pour permettre les connexions SSH entrantes",
      "L'accès privé à Google sur le sous-réseau"
    ],
    correct: [0],
    explain: "Le transfert TCP d'IAP (`gcloud compute ssh --tunnel-through-iap`) ouvre un tunnel vers des VM sans IP externe après vérification de l'identité et des droits IAM. Il faut autoriser en entrée la plage `35.235.240.0/20` et accorder le rôle `roles/iap.tunnelResourceAccessor`. Exposer le port 22 à tout Internet est exactement ce qu'on veut éviter. Cloud NAT ne gère que les connexions sortantes. L'accès privé à Google sert aux VM pour joindre les API Google, pas à y entrer."
  },
  {
    id: "d5-10", domain: 5,
    topic: "storage", difficulty: 2,
    doc: "https://docs.cloud.google.com/storage/docs/access-control/signed-urls",
    q: "Un client sans compte Google doit pouvoir télécharger pendant 24 heures un rapport stocké dans un bucket privé. Quelle solution choisissez-vous ?",
    options: [
      "Générer une URL signée valable 24 heures pour cet objet",
      "Rendre le bucket public puis le repasser en privé le lendemain",
      "Ajouter `allUsers` avec le rôle Lecteur des objets sur le bucket",
      "Envoyer une clé de compte de service au client"
    ],
    correct: [0],
    explain: "Une URL signée donne un accès limité dans le temps à un objet précis, à toute personne qui détient l'URL, sans compte Google. Rendre le bucket public ou ajouter `allUsers` expose tous les objets à tout Internet et repose sur un retour arrière manuel. Envoyer une clé de compte de service transmet un identifiant durable aux droits bien plus larges."
  },
  {
    id: "d5-11", domain: 5,
    topic: "iam", difficulty: 2,
    doc: "https://docs.cloud.google.com/iam/docs/conditions-overview",
    q: "Une consultante a besoin du rôle Lecteur de journaux sur un projet jusqu'au 30 juin seulement. Vous voulez que l'accès s'arrête tout seul à cette date. Comment faites-vous ?",
    options: [
      "Ajouter à la liaison de rôle une condition IAM d'expiration fondée sur la date et l'heure",
      "Accorder le rôle et poser un rappel dans votre agenda pour le retirer",
      "Créer un rôle personnalisé nommé « temporaire »",
      "Définir une règle d'organisation avec une date de fin"
    ],
    correct: [0],
    explain: "Les conditions IAM rendent une liaison de rôle conditionnelle, par exemple avec `request.time` inférieur à une date : l'accès cesse automatiquement à l'échéance. Un rappel manuel dépend d'une action humaine qui peut être oubliée. Le nom d'un rôle personnalisé ne lui donne aucune limite de durée. Les règles d'organisation contraignent la configuration des ressources, pas la durée d'un accès individuel."
  },
  {
    id: "d5-12", domain: 5,
    topic: "secrets", difficulty: 2,
    doc: "https://docs.cloud.google.com/run/docs/configuring/services/secrets",
    q: "Un service Cloud Run a besoin du mot de passe d'une base de données. Il ne doit figurer ni dans le code, ni dans l'image, ni en clair dans la configuration. Quelles actions combinez-vous ?",
    options: [
      "Stocker le mot de passe dans Secret Manager",
      "Accorder au compte de service du service Cloud Run le rôle Accesseur de secrets (`roles/secretmanager.secretAccessor`) sur ce secret",
      "Mettre le mot de passe dans une variable d'environnement en clair du service",
      "Placer le mot de passe dans un fichier d'un bucket public",
      "Écrire le mot de passe dans un label du service"
    ],
    correct: [0, 1],
    explain: "Secret Manager stocke les secrets chiffrés, versionnés et audités ; Cloud Run peut les exposer comme variable d'environnement ou volume, à condition que son compte de service ait le rôle Accesseur de secrets, de préférence sur le seul secret concerné. Une variable d'environnement en clair est lisible par quiconque peut consulter la configuration du service. Un bucket public ou un label exposent le mot de passe."
  },
  {
    id: "d5-13", domain: 5,
    topic: "org-policy", difficulty: 2,
    doc: "https://docs.cloud.google.com/organization-policy/restrict-service-accounts",
    q: "La sécurité veut empêcher la création de clés de comptes de service dans tous les projets de l'organisation, y compris par les propriétaires de projet. Quelle mesure appliquez-vous ?",
    options: [
      "Appliquer la règle d'organisation `iam.disableServiceAccountKeyCreation` au niveau de l'organisation",
      "Retirer le rôle Administrateur de comptes de service à tous les utilisateurs",
      "Créer une alerte sur les journaux d'audit signalant les créations de clés",
      "Supprimer chaque nuit les clés existantes avec un script"
    ],
    correct: [0],
    explain: "Une règle d'organisation s'impose à toutes les ressources situées en dessous, quels que soient les rôles IAM des utilisateurs : même un propriétaire de projet ne peut plus créer de clé. Retirer un rôle ne suffit pas, car d'autres rôles (Propriétaire, Éditeur, Administrateur de clés) contiennent la même autorisation. Une alerte ou un script de nettoyage agissent après coup et laissent une fenêtre d'exposition."
  },
  {
    id: "d5-17", domain: 5,
    topic: "iam", difficulty: 2,
    doc: "https://docs.cloud.google.com/policy-intelligence/docs/troubleshoot-access",
    q: "Une développeuse reçoit une erreur « permission denied » alors que vous pensez lui avoir accordé le bon rôle. Quel outil vous indique précisément pourquoi l'accès est accordé ou refusé ?",
    options: [
      "L'outil de dépannage des stratégies IAM (Policy Troubleshooter)",
      "Cloud Trace, qui retrace la latence des requêtes entre les services",
      "L'export de la facturation vers BigQuery, qui détaille les coûts par service",
      "Le simulateur de coût Google Cloud, qui estime les dépenses mensuelles"
    ],
    correct: [0],
    explain: "Policy Troubleshooter prend un principal, une ressource et une permission, puis indique si l'accès est autorisé et quelles stratégies (ou conditions) en sont la cause. Cloud Trace analyse la latence, l'export de facturation et le simulateur de coût concernent les dépenses : aucun n'explique une décision d'accès."
  },
  {
    id: "d5-18", domain: 5,
    topic: "iam", difficulty: 3,
    doc: "https://docs.cloud.google.com/policy-intelligence/docs/role-recommendations-overview",
    q: "Vous voulez repérer les rôles IAM accordés en trop, c'est-à-dire les permissions que personne n'utilise, pour appliquer le moindre privilège. Quel outil propose des recommandations fondées sur l'usage réel ?",
    options: [
      "Les recommandations de rôles IAM (IAM Recommender), fondées sur l'usage",
      "Les budgets de facturation, avec des seuils d'alerte par projet",
      "Les contrôles de disponibilité de Cloud Monitoring sur les services",
      "Les règles d'organisation de restriction des emplacements de ressources"
    ],
    correct: [0],
    explain: "IAM Recommender analyse l'usage réel des permissions par les principaux et propose de retirer ou de remplacer les rôles qui accordent des permissions en excès. Les budgets suivent les coûts, les contrôles de disponibilité testent des services, et les règles d'emplacement limitent les régions : aucun n'évalue l'usage des permissions."
  },
  {
    id: "d5-19", domain: 5,
    topic: "service-accounts", difficulty: 3,
    doc: "https://docs.cloud.google.com/compute/docs/instances/change-service-account",
    q: "Une VM de production utilise le compte de service par défaut de Compute Engine, dont le rôle est trop large. Vous avez créé un compte de service dédié aux droits minimaux. Comment le substituer à l'ancien ?",
    options: [
      "Arrêter la VM, changer son compte de service dans sa configuration, puis la redémarrer",
      "Modifier la VM en marche : son compte de service peut être changé à chaud",
      "Supprimer la VM et ses disques, car son compte de service ne peut jamais être modifié",
      "Créer une clé JSON du nouveau compte et la copier dans le système de fichiers de la VM"
    ],
    correct: [0],
    explain: "Le compte de service d'une VM se change lorsque la VM est arrêtée : on modifie la configuration, puis on la redémarre. Il n'est pas modifiable à chaud, et il n'est pas nécessaire de recréer la VM. Copier une clé JSON dans la VM va à l'encontre des bonnes pratiques : la VM s'authentifie avec le compte de service qui lui est rattaché, sans clé."
  },
  {
    id: "d5-20", domain: 5,
    topic: "secrets", difficulty: 2,
    doc: "https://docs.cloud.google.com/secret-manager/docs/add-secret-version",
    q: "Le mot de passe d'une base, stocké dans Secret Manager, a changé. L'application lit la version `latest` du secret. Que faites-vous pour qu'elle utilise la nouvelle valeur ?",
    options: [
      "Ajouter une nouvelle version du secret contenant la nouvelle valeur",
      "Modifier la valeur de la version existante directement dans la console",
      "Supprimer le secret puis le recréer sous un autre nom dans le projet",
      "Redéployer l'application avec le mot de passe dans une variable d'environnement"
    ],
    correct: [0],
    explain: "Les versions d'un secret sont immuables : pour changer la valeur, on ajoute une nouvelle version, et l'alias `latest` désigne la version activée la plus récente. On ne peut pas modifier une version existante. Recréer le secret sous un autre nom oblige à modifier l'application, et un mot de passe en variable d'environnement en clair annule l'intérêt de Secret Manager."
  },
  {
    id: "d5-21", domain: 5,
    topic: "networking", difficulty: 2,
    doc: "https://docs.cloud.google.com/armor/docs/cloud-armor-overview",
    q: "Votre site public, derrière un équilibreur de charge d'application externe, subit des attaques par déni de service et des requêtes issues de plages d'adresses IP malveillantes. Quel service ajoutez-vous pour les filtrer ?",
    options: [
      "Google Cloud Armor, avec une stratégie de sécurité sur le service de backend",
      "Cloud NAT sur le routeur Cloud de la région où tournent les backends",
      "Identity-Aware Proxy en transfert TCP, avec une règle de pare-feu dédiée",
      "Des règles de pare-feu VPC qui bloquent ces adresses sur chacune des VM"
    ],
    correct: [0],
    explain: "Cloud Armor s'applique au niveau de l'équilibreur de charge : ses stratégies de sécurité filtrent les adresses IP, bloquent des motifs d'attaque et limitent les attaques par déni de service avant que le trafic n'atteigne les backends. Cloud NAT gère le trafic sortant, IAP protège l'accès aux applications par identité, et les pare-feu des VM voient les adresses de l'équilibreur plutôt que celles des clients."
  },
  {
    id: "d5-22", domain: 5,
    topic: "storage", difficulty: 3,
    doc: "https://docs.cloud.google.com/storage/docs/encryption/customer-managed-keys",
    q: "Une règle interne impose que les données d'un bucket soient chiffrées avec des clés que votre organisation contrôle (rotation, désactivation), et non avec les clés gérées par Google par défaut. Que configurez-vous ?",
    options: [
      "Des clés de chiffrement gérées par le client (CMEK) dans Cloud KMS, associées au bucket",
      "Une URL signée à durée limitée pour chacun des objets stockés dans le bucket",
      "La gestion des versions d'objets, pour conserver plusieurs copies chiffrées des données",
      "Une règle d'organisation de restriction des emplacements pour les ressources du bucket"
    ],
    correct: [0],
    explain: "Avec les clés CMEK, les données du bucket sont chiffrées avec une clé que vous gérez dans Cloud KMS : vous contrôlez sa rotation et pouvez la désactiver, ce qui rend les données illisibles. Une URL signée donne un accès temporaire, les versions conservent des copies d'objets, et une règle d'emplacement limite les régions sans changer la clé de chiffrement."
  },
  {
    id: "d5-23", domain: 5,
    topic: "iam", difficulty: 2,
    doc: "https://docs.cloud.google.com/compute/docs/oslogin",
    q: "Cinquante administrateurs se connectent en SSH à des VM. Vous voulez éviter de gérer des clés SSH dans les métadonnées, lier l'accès SSH aux rôles IAM et pouvoir le révoquer immédiatement au départ d'une personne. Qu'activez-vous ?",
    options: [
      "OS Login sur les VM, avec des rôles IAM de connexion accordés à chaque administrateur",
      "Une clé SSH commune, ajoutée aux métadonnées du projet et partagée entre les administrateurs",
      "Un compte Linux local par administrateur, créé à la main sur chacune des VM",
      "L'agent Ops, qui crée les comptes Linux des administrateurs à partir de leur adresse e-mail"
    ],
    correct: [0],
    explain: "OS Login associe les comptes Linux des VM aux identités IAM : l'accès SSH dépend des rôles accordés, sans gestion manuelle de clés dans les métadonnées, et retirer le rôle révoque l'accès. Une clé partagée supprime la traçabilité et se révoque difficilement, des comptes locaux créés à la main sont longs à maintenir, et l'agent Ops collecte des métriques et des journaux, il ne gère pas les accès SSH."
  },
  {
    id: "d5-24", domain: 5,
    topic: "iam", difficulty: 2,
    doc: "https://docs.cloud.google.com/docs/authentication/api-keys",
    q: "Une clé d'API pour l'API Maps est intégrée à une application web publique. Vous voulez limiter les dégâts si elle est copiée et réutilisée ailleurs. Que faites-vous ?",
    options: [
      "Restreindre la clé à l'API concernée et aux sites web autorisés (référents HTTP)",
      "Chiffrer la clé dans le code source avec un algorithme maison pour la rendre illisible",
      "Accorder à la clé le rôle Lecteur du projet pour limiter les actions qu'elle permet",
      "Remplacer la clé par le compte de service par défaut de Compute Engine dans le navigateur"
    ],
    correct: [0],
    explain: "Une clé d'API peut être restreinte aux API qu'elle a le droit d'appeler et aux sites web (référents HTTP), adresses IP ou applications autorisés : copiée ailleurs, elle devient inutilisable. Le code d'une application web publique est lisible par tout le monde, donc chiffrer la clé dans le code est inefficace. Une clé d'API standard n'authentifie aucun principal : on ne lui accorde donc pas de rôle IAM. Exposer un compte de service dans un navigateur serait bien pire."
  },
  {
    id: "d5-25", domain: 5,
    topic: "networking", difficulty: 3,
    doc: "https://docs.cloud.google.com/vpc-service-controls/docs/overview",
    q: "Des identifiants volés pourraient permettre à un attaquant de copier des données BigQuery et Cloud Storage vers un projet extérieur à l'organisation. Quel service ajoute un périmètre de protection contre cette exfiltration ?",
    options: [
      "VPC Service Controls, avec un périmètre de service autour des projets",
      "Cloud Armor, avec une stratégie de sécurité sur l'équilibreur de charge",
      "Cloud NAT, configuré sur le routeur Cloud de la région des projets",
      "Sensitive Data Protection, qui détecte et masque les données sensibles"
    ],
    correct: [0],
    explain: "VPC Service Controls définit un périmètre autour des projets et des services et contrôle les échanges de données avec l'extérieur de ce périmètre, ce qui réduit le risque d'exfiltration ; il refuse aussi des accès depuis des réseaux non autorisés même si une stratégie IAM mal configurée les permet. Cloud Armor filtre le trafic entrant vers un équilibreur, Cloud NAT gère le trafic sortant des VM sans l'empêcher de copier des données, et la protection des données sensibles repère et masque des informations mais ne bloque pas leur déplacement."
  },
  {
    id: "d5-26", domain: 5,
    topic: "networking", difficulty: 2,
    doc: "https://docs.cloud.google.com/vpc/docs/private-google-access",
    q: "Des VM sans adresse IP externe doivent lire des objets dans Cloud Storage, sans passer par Internet. Qu'activez-vous sur leur sous-réseau ?",
    options: [
      "L'accès privé à Google (Private Google Access)",
      "Un appairage de réseaux VPC avec le réseau de Google",
      "Une adresse IP éphémère attribuée à chacune des VM",
      "Un VPC partagé avec un projet hôte contenant le sous-réseau"
    ],
    correct: [0],
    explain: "L'accès privé à Google permet aux VM qui n'ont que des adresses IP internes d'atteindre les API et services Google (Cloud Storage, par exemple) sans adresse externe. Cloud NAT, lui, sert à joindre Internet. Un appairage avec « le réseau de Google » n'existe pas, une adresse externe va à l'encontre de la consigne, et un VPC partagé organise la gestion du réseau sans donner cet accès."
  }
];
