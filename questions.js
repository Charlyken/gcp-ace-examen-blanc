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
  }
];
