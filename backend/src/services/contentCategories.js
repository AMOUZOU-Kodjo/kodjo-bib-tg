export const CONTENT_CATEGORIES = [
  {
    slug: "litterature",
    name: "Littérature",
    keywords: [
      "litterature", "livre", "roman", "poesie", "poeme", "ecrivain", "auteur",
      "critique litteraire", "theatre", "conte", "essai", "bibliotheque", "lecture",
      "editeur", "edition", "manuscrit", "prix litteraire"
    ]
  },
  {
    slug: "sciences",
    name: "Sciences",
    keywords: [
      "science", "scientifique", "recherche", "etude", "physique", "chimie",
      "biologie", "mathematiques", "astronomie", "espace", "climat", "environnement",
      "biodiversite", "technologie", "intelligence artificielle", "numerique", "energie",
      "ocean", "decouverte", "chercheur", "laboratoire", "innovation", "donnees", "ia",
      "robot", "satellite", "adn", "genome", "cellule", "molecule", "ecosysteme",
      "agriculture", "foret", "eau"
    ]
  },
  {
    slug: "education",
    name: "Éducation",
    keywords: [
      "education", "ecole", "scolaire", "eleve", "etudiant", "enseignant", "professeur",
      "cours", "examen", "concours", "universite", "formation", "pedagogie", "baccalaureat",
      "bac", "bepc", "cepd", "cap", "rentree", "diplome", "bourse", "academie",
      "apprentissage", "orientation"
    ]
  },
  {
    slug: "art",
    name: "Art",
    keywords: [
      "art", "artiste", "peinture", "musique", "cinema", "photographie", "exposition",
      "culture", "creation", "design", "mode", "architecture", "sculpture", "danse",
      "festival", "spectacle", "galerie", "oeuvre", "litterature graphique"
    ]
  },
  {
    slug: "societe",
    name: "Société",
    keywords: [
      "societe", "social", "citoyen", "population", "communaute", "famille", "femme",
      "jeunesse", "emploi", "travail", "economie", "entreprise", "marche", "developpement",
      "ong", "association", "religion", "justice", "droit", "migration", "urbanisme",
      "logement", "transport", "finance", "business", "commerce", "consommation"
    ]
  },
  {
    slug: "politique",
    name: "Politique",
    keywords: [
      "politique", "gouvernement", "president", "ministre", "election", "vote",
      "assemblee", "parti", "opposition", "reforme", "loi", "decret", "prefet",
      "administration", "diplomatie", "securite", "armee", "defense", "international",
      "souverainete", "constitution"
    ]
  },
  {
    slug: "sante",
    name: "Santé",
    keywords: [
      "sante", "medecine", "maladie", "vaccin", "hopital", "medecin", "patient", "virus",
      "epidemie", "cancer", "paludisme", "grossesse", "nutrition", "hygiene", "prevention",
      "soins", "clinique", "pharmacie", "bien etre", "psychologie", "sommeil", "sida",
      "tuberculose", "cholera", "fievre", "sante mentale"
    ]
  },
  {
    slug: "sport",
    name: "Sport",
    keywords: [
      "sport", "football", "basket", "volley", "tennis", "athletisme", "match",
      "championnat", "coupe", "equipe", "joueur", "entraineur", "olympique", "competition",
      "tournoi", "cyclisme", "boxe", "lutte", "marathon", "stade"
    ]
  },
  {
    slug: "divertissement",
    name: "Divertissement",
    keywords: [
      "divertissement", "people", "celebrite", "star", "serie", "film", "television",
      "musique", "concert", "jeu", "loisir", "humour", "meme", "reseaux sociaux",
      "influenceur", "jeu video", "streaming", "netflix"
    ]
  },
  {
    slug: "philosophie",
    name: "Philosophie",
    keywords: [
      "philosophie", "philosophe", "ethique", "morale", "metaphysique", "pensee",
      "concept", "logique", "epistemologie", "existentialisme", "sagesse", "conscience",
      "spiritualite"
    ]
  },
  {
    slug: "histoire",
    name: "Histoire",
    keywords: [
      "histoire", "historique", "patrimoine", "archeologie", "civilisation", "colonisation",
      "independance", "memoire", "archive", "musee", "monument", "siecle", "guerre",
      "esclavage", "royaume", "empire", "tradition"
    ]
  }
];

const CATEGORY_BY_SLUG = new Map(CONTENT_CATEGORIES.map((category) => [category.slug, category]));
const NORMALIZED_KEYWORDS = CONTENT_CATEGORIES.map((category) => ({
  slug: category.slug,
  keywords: category.keywords.map((keyword) => normalize(keyword))
}));

export function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreKeyword(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}s?([^a-z0-9]|$)`, "g");
  return (text.match(pattern) || []).length;
}

export function classifyContent(title = "", description = "", fallback = "societe") {
  const text = normalize(`${title} ${description}`);
  let bestSlug = fallback;
  let bestScore = 0;

  for (const category of NORMALIZED_KEYWORDS) {
    let score = 0;
    for (const keyword of category.keywords) {
      const occurrences = scoreKeyword(text, keyword);
      if (occurrences > 0) {
        score += Math.min(occurrences, 3) * (keyword.includes(" ") ? 2 : 1);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestSlug = category.slug;
    }
  }

  return CATEGORY_BY_SLUG.has(bestSlug) ? bestSlug : "societe";
}

export function getContentCategories() {
  return CONTENT_CATEGORIES.map(({ slug, name }) => ({ slug, name }));
}
