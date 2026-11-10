export const categoryLabels = {
  "Éducation & Examens": "cat.educationExams",
  "Sciences & Techniques": "cat.sciencesTechniques",
  "Lettres & Culture": "cat.lettersCulture",
  "Histoire & Géographie": "cat.historyGeography",
  "Société & Politique": "cat.societyPolitics",
  "Santé & Bien-être": "cat.healthWellbeing",
  "Enfance & Loisirs": "cat.childhoodLeisure",
  "Vie pratique & Administration": "cat.practicalLife",
  "Éducation": "cat.education",
  "Littérature": "cat.literature",
  "Science": "cat.science",
  "Histoire": "cat.history",
  "physique-chimie": "cat.physicsChemistry",
  "Physique-Chimie": "cat.physicsChemistry",
  "Mathématiques": "cat.mathematics",
  "SVT": "cat.svtScience",
  "Informatique": "cat.computerScience",
  "Art": "cat.art",
  "Société": "cat.society",
  "Petite Enfance": "cat.earlyChildhood",
  "Philosophie": "cat.philosophy",
  "Géographie": "cat.geography",
  "Politique": "cat.politics",
  "Sport": "cat.sport",
  "Divertissement": "cat.entertainment",
  "Santé": "cat.health",
  "Cours": "cat.courses",
  "TD / TP": "cat.tdTp",
  "Examens / Annales": "cat.exams",
  "Rapports / Mémoires": "cat.reports",
  "Fiches": "cat.sheets",
  "CV & Lettres": "cat.cvLetters"
};

const categoryColors = {
  "Éducation": "bg-blue-600",
  "Littérature": "bg-purple-600",
  "Science": "bg-emerald-600",
  "Histoire": "bg-amber-700",
  "physique-chimie": "bg-cyan-700",
  "Art": "bg-pink-600",
  "Société": "bg-orange-600",
  "Petite Enfance": "bg-rose-500",
  "Philosophie": "bg-indigo-700",
  "Géographie": "bg-teal-600",
  "Politique": "bg-red-700",
  "Sport": "bg-lime-600",
  "Divertissement": "bg-fuchsia-600",
  "Santé": "bg-green-700"
};

export function getCategoryColor(category) {
  return categoryColors[category] || "bg-teal-700";
}

export function formatCategoryName(category, t) {
  if (!category) return category;
  const key = categoryLabels[category] || (category === "littrature" ? categoryLabels["Littérature"] : null);
  if (key && t) return t(key);
  if (category === "physique-chimie") return t ? t("cat.physicsChemistry") : "Physique-Chimie";
  if (category === "littrature") return t ? t("cat.literature") : "Littérature";
  return category;
}

export function getFileExtension(fileName) {
  return fileName?.split(".").pop()?.toUpperCase() || "DOC";
}
