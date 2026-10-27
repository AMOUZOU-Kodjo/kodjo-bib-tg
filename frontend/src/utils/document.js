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

export function formatCategoryName(category) {
  if (category === "physique-chimie") return "Physique-Chimie";
  if (category === "littrature") return "Littérature";
  return category;
}

export function getFileExtension(fileName) {
  return fileName?.split(".").pop()?.toUpperCase() || "DOC";
}
