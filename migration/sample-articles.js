// data/sample-articles.js
const sampleArticles = [
  {
    titre: "La SNTP inaugure un nouveau projet autoroutier",
    slug: "sntp-inaugure-nouveau-projet-autoroutier",
    contenu: `## Un projet d'envergure

La SNTP est fière d'annoncer l'inauguration de son dernier projet autoroutier qui reliera les villes d'Alger et de Constantine.

### Caractéristiques du projet

- **Longueur**: 420 km
- **Durée des travaux**: 36 mois
- **Budget**: 2,5 milliards de dinars

Ce projet représente une avancée majeure pour l'infrastructure algérienne.`,
    extrait: "La SNTP inaugure un nouveau tronçon autoroutier de 420 km reliant Alger à Constantine.",
    auteur: "Direction Communication SNTP",
    imagePrincipale: "/wp-content/uploads/2022/05/article-image-1.webp",
    statut: "publie",
    datePublication: new Date(),
    tags: ["Autoroute", "Infrastructure", "Projet"],
    metaDescription: "Découvrez le nouveau projet autoroutier de la SNTP reliant Alger et Constantine."
  },
  {
    titre: "Innovation dans les travaux publics",
    slug: "innovation-travaux-publics",
    contenu: `## L'innovation au cœur de nos projets

La SNTP investit massivement dans les nouvelles technologies pour moderniser le secteur des travaux publics en Algérie.

### Technologies déployées

- Drones pour l'inspection
- BIM (Building Information Modeling)
- Matériaux écologiques`,
    extrait: "La SNTP adopte les dernières technologies pour révolutionner le secteur des travaux publics.",
    auteur: "Département Innovation",
    imagePrincipale: "/wp-content/uploads/2022/05/article-image-2.webp",
    statut: "publie",
    datePublication: new Date(Date.now() - 86400000 * 2),
    tags: ["Innovation", "Technologie", "BIM"],
    metaDescription: "Découvrez comment la SNTP innove dans les travaux publics avec les nouvelles technologies."
  }
];

module.exports = sampleArticles;

