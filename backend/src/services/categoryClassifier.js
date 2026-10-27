export function suggestCategory(filename = "") {
  const name = filename
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ");

  const rules = [
    { category: "Cours", regex: /(cours|chapitre|lecon|module|polycopie|cours de)/ },
    { category: "TD / TP", regex: /(td|tp|exercice|feuille|serie|travaux diriges|travaux pratiques)/ },
    { category: "Examens / Annales", regex: /(examen|partiel|controle|annale|qcm|corrige|correction|rattrapage|session)/ },
    { category: "Rapports / Mémoires", regex: /(rapport|memoire|stage|soutenance|compte rendu|rapport de)/ },
    { category: "Fiches", regex: /(fiche|resume|synthese|revision|aide memoire)/ },
    { category: "CV & Lettres", regex: /(cv|curriculum|lettre|motivation|lettre de)/ }
  ];

  for (const rule of rules) {
    if (rule.regex.test(name)) {
      return rule.category;
    }
  }
  return null;
}
